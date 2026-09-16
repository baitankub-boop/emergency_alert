import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: NextRequest) {
  if (!requireStaff(req, ["admin", "superadmin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { provider, enabled, token, target_id, message_template } = await req.json();

    if (!["line", "telegram", "email"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    if (message_template) {
      try {
        JSON.parse(message_template);
      } catch {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
      }
    }

    const update: Record<string, unknown> = {
      provider,
      enabled: !!enabled,
      target_id: target_id ?? "",
      message_template: message_template ?? "",
      updated_at: new Date().toISOString(),
    };
    // Only overwrite the stored token when a new non-empty value is supplied,
    // so re-saving the template doesn't force re-entering the secret.
    if (token) {
      update.token = token;
    }

    const { error } = await supabase.from("notify_settings").upsert(update, { onConflict: "provider" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to save notify settings" }, { status: 500 });
  }
}
