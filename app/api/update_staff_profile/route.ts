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
    const { first_name, last_name, nickname } = await req.json();

    if (email === "admin" && role === "admin") {
      return NextResponse.json({ error: "The built-in superadmin account cannot be edited" }, { status: 403 });
    }

    const table = TABLE_BY_ROLE[role];
    const update: Record<string, string | null> = {};
    if (first_name !== undefined) update.first_name = first_name;
    if (last_name !== undefined) update.last_name = last_name;
    if (nickname !== undefined) update.username = nickname || null;

    const { error } = await supabase.from(table).update(update).eq("email", email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
