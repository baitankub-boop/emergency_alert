import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: NextRequest) {
  const session = requireStaff(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email, role } = session;

  try {
    // Hardcoded superadmin has no table row and can never be disabled
    if (email === "admin" && role === "admin") {
      return NextResponse.json({ disabled: false });
    }

    const table = role === "admin" ? "admin_data" : role === "operator" ? "operator_data" : "superadmin_data";
    const { data, error } = await supabase.from(table).select("disabled").eq("email", email).single();

    if (error || !data) {
      // Row no longer exists (e.g. deleted) — treat as disabled
      return NextResponse.json({ disabled: true });
    }

    return NextResponse.json({ disabled: !!data.disabled });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to check staff status" }, { status: 500 });
  }
}
