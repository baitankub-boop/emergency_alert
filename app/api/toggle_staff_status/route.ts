import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const TABLE_BY_ROLE = { admin: "admin_data", operator: "operator_data", superadmin: "superadmin_data" } as const;

export async function POST(req: NextRequest) {
  const caller = requireStaff(req, ["admin", "superadmin"]);
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, role, disabled } = await req.json();

    if (!email || !["admin", "operator", "superadmin"].includes(role) || typeof disabled !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Only a Super Admin may disable/enable an Admin or another Super Admin.
    // A regular Admin may only manage Operators.
    if (caller.role === "admin" && role !== "operator") {
      return NextResponse.json({ error: "Only a Super Admin can do this" }, { status: 403 });
    }

    const table = TABLE_BY_ROLE[role as keyof typeof TABLE_BY_ROLE];
    const { error } = await supabase.from(table).update({ disabled }).eq("email", email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to update staff status" }, { status: 500 });
  }
}
