import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function maskToken(token: string | null): string | null {
  if (!token) return null;
  return token.length <= 4 ? "••••" : `••••••••${token.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  if (!requireStaff(req, ["admin", "superadmin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("notify_settings")
      .select("provider, enabled, token, target_id, message_template");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result: Record<string, unknown> = {};
    for (const provider of ["line", "telegram", "email"]) {
      const row = data?.find(r => r.provider === provider);
      result[provider] = {
        enabled: row?.enabled ?? false,
        hasToken: !!row?.token,
        tokenPreview: maskToken(row?.token ?? null),
        target_id: row?.target_id ?? "",
        message_template: row?.message_template ?? "",
      };
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to load notify settings" }, { status: 500 });
  }
}
