import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendMail, getAllStaffEmails, statusUpdateHtml } from "@/lib/mailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { table, id, old_status, new_status } = await req.json();

    if (!table || !id || !old_status || !new_status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const kind = table === "emergency_data" ? "emergency" : "breakdown";

    // Fetch record details
    const selectFields = kind === "emergency"
      ? "email, emergency_type, description, floor"
      : "email, breakdown_type, description, floor";

    const { data: record } = await supabase
      .from(table)
      .select(selectFields)
      .eq("id", id)
      .single();

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const reporterEmail: string = record.email;
    const eventType: string = kind === "emergency"
      ? (record.emergency_type || "ไม่ระบุประเภท")
      : (record.breakdown_type || "ไม่ระบุประเภท");
    const description: string = record.description;

    const staffEmails = await getAllStaffEmails();
    const recipients = [...new Set([reporterEmail, ...staffEmails])];

    const kindTh = kind === "emergency" ? "เหตุฉุกเฉิน" : "เหตุขัดข้อง";
    const subject = `อัปเดทสถานะ${kindTh}`;
    const html = statusUpdateHtml(kind, reporterEmail, eventType, description, old_status, new_status);

    await sendMail(recipients, subject, html);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify_status_change error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
