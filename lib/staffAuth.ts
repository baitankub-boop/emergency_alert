import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export type StaffRole = "admin" | "operator" | "superadmin";

export interface StaffTokenPayload {
  email: string;
  role: StaffRole;
  exp: number;
}

export const STAFF_COOKIE_NAME = "staff_session";
export const STAFF_COOKIE_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours hard cap; idle timeout is enforced client-side

const SECRET = process.env.SUPABASE_SECRET_KEY!;

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createStaffToken(email: string, role: StaffRole): string {
  const payload = Buffer.from(
    JSON.stringify({ email, role, exp: Date.now() + STAFF_COOKIE_MAX_AGE_SECONDS * 1000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyStaffToken(token: string | undefined | null): StaffTokenPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;

  const expected = sign(payload);
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StaffTokenPayload;
    if (typeof data.exp !== "number" || Date.now() > data.exp) return null;
    if (data.role !== "admin" && data.role !== "operator" && data.role !== "superadmin") return null;
    if (typeof data.email !== "string" || !data.email) return null;
    return data;
  } catch {
    return null;
  }
}

/** Reads and verifies the staff session cookie from an API route request. */
export function getStaffSession(req: NextRequest): StaffTokenPayload | null {
  return verifyStaffToken(req.cookies.get(STAFF_COOKIE_NAME)?.value);
}

/** Reads and verifies the staff session cookie, requiring a specific role (or one of several) if given. */
export function requireStaff(req: NextRequest, requiredRole?: StaffRole | StaffRole[]): StaffTokenPayload | null {
  const session = getStaffSession(req);
  if (!session) return null;
  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(session.role)) return null;
  }
  return session;
}
