import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const TABLE_BY_ROLE = { admin: "admin_data", operator: "operator_data", superadmin: "superadmin_data" } as const;

export async function POST(req: NextRequest) {
  const session = requireStaff(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email, role } = session;

  try {
    // The hardcoded built-in login (admin/admin1234) has no table row
    if (email === "admin" && role === "admin") {
      return NextResponse.json({
        builtin: true,
        email: "admin",
        role: "admin",
        first_name: "Super",
        last_name: "Admin",
        nickname: null,
        created_at: null,
      });
    }

    const table = TABLE_BY_ROLE[role];
    const { data, error } = await supabase
      .from(table)
      .select("first_name, last_name, email, username, created_at")
      .eq("email", email)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      builtin: false,
      email: data.email,
      role,
      first_name: data.first_name,
      last_name: data.last_name,
      nickname: data.username ?? null,
      created_at: data.created_at,
    });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
