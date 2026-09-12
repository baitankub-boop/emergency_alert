import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffAuth";
import { fillTemplate, sendLineMessage, sendTelegramMessage } from "@/lib/notifySend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: NextRequest) {
  if (!requireStaff(req, ["admin", "superadmin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { provider } = await req.json();
    if (!["line", "telegram"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("notify_settings")
      .select("token, target_id, message_template")
      .eq("provider", provider)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "not_configured" }, { status: 400 });
    }
    if (!data.token || !data.target_id) {
      return NextResponse.json({ error: "not_configured" }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(fillTemplate(data.message_template || ""));
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const result = provider === "line"
      ? await sendLineMessage(data.token, data.target_id, payload)
      : await sendTelegramMessage(data.token, data.target_id, payload as Record<string, unknown>);

    if (!result.ok) {
      return NextResponse.json({ error: "send_failed", detail: result.error }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 });
  }
}
