import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendMail, getAllStaffEmails, emergencySubmitHtml, formatTimestamp } from "@/lib/mailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emergency_type, floor, description, reporter_email, photo_url } = body;

    if (!emergency_type || !floor || !description || !reporter_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase.from("emergency_data").insert({
      emergency_type,
      floor,
      description,
      email: reporter_email,
      status: "Waiting",
      photo_url: photo_url || null,
    }).select("created_at").single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notifications (non-blocking)
    const timestamp = data?.created_at ? formatTimestamp(data.created_at) : new Date().toLocaleString("th-TH");
    const staffEmails = await getAllStaffEmails();
    const recipients = [...new Set([reporter_email, ...staffEmails])];
    const html = emergencySubmitHtml(reporter_email, emergency_type, description, floor, timestamp);
    sendMail(recipients, "แจ้งเหตุฉุกเฉิน", html).catch(e => console.error("Email error:", e));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
