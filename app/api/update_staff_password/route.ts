import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { requireStaff } from "@/lib/staffAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const hashBuffer = Buffer.from(hash, "hex");
    const derived = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, derived);
  } catch {
    return false;
  }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const TABLE_BY_ROLE = { admin: "admin_data", operator: "operator_data", superadmin: "superadmin_data" } as const;

export async function POST(req: NextRequest) {
  const session = requireStaff(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email, role } = session;

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (email === "admin" && role === "admin") {
      return NextResponse.json({ error: "The built-in superadmin password cannot be changed here" }, { status: 403 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const table = TABLE_BY_ROLE[role];
    const { data, error: fetchError } = await supabase.from(table).select("password").eq("email", email).single();

    if (fetchError || !data) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!verifyPassword(currentPassword, data.password)) {
      return NextResponse.json({ error: "wrong_password" }, { status: 401 });
    }

    const { error: updateError } = await supabase
      .from(table)
      .update({ password: hashPassword(newPassword) })
      .eq("email", email);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
