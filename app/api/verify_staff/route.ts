import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { scryptSync, timingSafeEqual } from "crypto";
import { createStaffToken, STAFF_COOKIE_NAME, STAFF_COOKIE_MAX_AGE_SECONDS } from "@/lib/staffAuth";

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

function withStaffCookie(res: NextResponse, email: string, role: "admin" | "operator" | "superadmin"): NextResponse {
  res.cookies.set(STAFF_COOKIE_NAME, createStaffToken(email, role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Hardcoded superadmin
    if (username === "admin" && password === "admin1234") {
      return withStaffCookie(NextResponse.json({ success: true, role: "admin" }), "admin", "admin");
    }

    // Check admin_data table by email
    const { data: adminData } = await supabase
      .from("admin_data")
      .select("password, disabled, username")
      .eq("email", username)
      .single();

    if (adminData && verifyPassword(password, adminData.password)) {
      if (adminData.disabled) {
        return NextResponse.json({ success: false, reason: "disabled" });
      }
      return withStaffCookie(
        NextResponse.json({ success: true, role: "admin", nickname: adminData.username ?? null }),
        username,
        "admin"
      );
    }

    // Check operator_data table by email
    const { data: operatorData } = await supabase
      .from("operator_data")
      .select("password, disabled, username")
      .eq("email", username)
      .single();

    if (operatorData && verifyPassword(password, operatorData.password)) {
      if (operatorData.disabled) {
        return NextResponse.json({ success: false, reason: "disabled" });
      }
      return withStaffCookie(
        NextResponse.json({ success: true, role: "operator", nickname: operatorData.username ?? null }),
        username,
        "operator"
      );
    }

    // Check superadmin_data table by email
    const { data: superadminData } = await supabase
      .from("superadmin_data")
      .select("password, disabled, username")
      .eq("email", username)
      .single();

    if (superadminData && verifyPassword(password, superadminData.password)) {
      if (superadminData.disabled) {
        return NextResponse.json({ success: false, reason: "disabled" });
      }
      return withStaffCookie(
        NextResponse.json({ success: true, role: "superadmin", nickname: superadminData.username ?? null }),
        username,
        "superadmin"
      );
    }

    return NextResponse.json({ success: false });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ success: false });
  }
}
