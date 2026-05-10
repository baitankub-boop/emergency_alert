import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Service role client — needed to create Supabase Auth users server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp, type } = await req.json();

    if (!email || !otp || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Look up OTP record
    const { data, error: fetchError } = await supabase
      .from("registration_otps")
      .select("*")
      .eq("email", email)
      .eq("type", type)
      .single();

    if (fetchError || !data) {
      return NextResponse.json({ error: "OTP not found. Please request a new one." }, { status: 404 });
    }

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      await supabase.from("registration_otps").delete().eq("id", data.id);
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    // Check OTP hash
    if (hashOtp(otp) !== data.otp_hash) {
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
    }

    // OTP correct — create account
    const { email: pendingEmail, password } = data.pending_data;

    if (type === "user") {
      // Create Supabase Auth user (email auto-confirmed)
      const { error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: pendingEmail,
        password,
        email_confirm: true,
      });
      if (authError) {
        console.error("Auth error:", authError);
        return NextResponse.json({ error: authError.message }, { status: 500 });
      }
    } else {
      // Create admin or operator in custom table
      const { first_name, last_name } = data.pending_data;
      const table = type === "admin" ? "admin_data" : "operator_data";
      const { error: insertError } = await supabase.from(table).insert({
        first_name,
        last_name,
        email: pendingEmail,
        password,
      });
      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Clean up OTP record
    await supabase.from("registration_otps").delete().eq("id", data.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
