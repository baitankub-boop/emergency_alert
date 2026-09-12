import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface StaffUser {
  id: string;
  email: string;
  provider: string;
  role: "user" | "admin" | "operator" | "superadmin";
  created_at: string | null;
  banned: boolean;
  manageable: boolean;
}

export async function GET(req: NextRequest) {
  const caller = requireStaff(req, ["admin", "superadmin"]);
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // A regular Admin may only manage Operators (and reporters); only a Super Admin
  // may disable/enable an Admin or another Super Admin.
  const canManage = (targetRole: StaffUser["role"]) =>
    caller.role === "superadmin" || targetRole === "user" || targetRole === "operator";

  try {
    const [authResult, adminResult, operatorResult, superadminResult] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin.from("admin_data").select("*"),
      supabaseAdmin.from("operator_data").select("*"),
      supabaseAdmin.from("superadmin_data").select("*"),
    ]);

    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: 500 });
    }

    const reporterUsers: StaffUser[] = authResult.data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      provider: u.app_metadata?.provider === "google" ? "google" : "email",
      role: "user",
      created_at: u.created_at,
      banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
      manageable: canManage("user"),
    }));

    const adminUsers: StaffUser[] = (adminResult.data ?? []).map((row) => ({
      id: `admin-${row.email}`,
      email: row.email,
      provider: "email",
      role: "admin",
      created_at: row.created_at ?? null,
      banned: !!row.disabled,
      manageable: canManage("admin"),
    }));

    const operatorUsers: StaffUser[] = (operatorResult.data ?? []).map((row) => ({
      id: `operator-${row.email}`,
      email: row.email,
      provider: "email",
      role: "operator",
      created_at: row.created_at ?? null,
      banned: !!row.disabled,
      manageable: canManage("operator"),
    }));

    const superadminUsers: StaffUser[] = (superadminResult.data ?? []).map((row) => ({
      id: `superadmin-${row.email}`,
      email: row.email,
      provider: "email",
      role: "superadmin",
      created_at: row.created_at ?? null,
      banned: !!row.disabled,
      manageable: canManage("superadmin"),
    }));

    const users = [...superadminUsers, ...adminUsers, ...operatorUsers, ...reporterUsers].sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}
