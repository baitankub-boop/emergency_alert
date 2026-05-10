import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes, scryptSync } from "crypto";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { first_name, last_name, email, password, type } = await req.json();

    if (!email || !password || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["admin", "operator", "user"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (type !== "user" && (!first_name || !last_name)) {
      return NextResponse.json({ error: "Missing name fields" }, { status: 400 });
    }

    // For admin/operator: hash password with scrypt
    // For user: keep plain text (Supabase Auth needs it)
    const stored_password = type === "user" ? password : hashPassword(password);

    // Generate OTP
    const otp = generateOtp();
    const otp_hash = hashOtp(otp);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email+type
    await supabase
      .from("registration_otps")
      .delete()
      .eq("email", email)
      .eq("type", type);

    // Store OTP + pending data
    const pending_data = type === "user"
      ? { email, password: stored_password }
      : { first_name, last_name, email, password: stored_password };

    const { error: dbError } = await supabase.from("registration_otps").insert({
      email,
      otp_hash,
      type,
      pending_data,
      expires_at: expires_at.toISOString(),
    });

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json({ error: "Failed to store OTP" }, { status: 500 });
    }

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const roleLabel = type === "admin" ? "Admin" : type === "operator" ? "Operator" : "User";

    await transporter.sendMail({
      from: `"40 Building Alarm" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "40 building alarm OTP",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#1e293b;margin-bottom:8px;">40 Building Alarm</h2>
          <p style="color:#475569;font-size:14px;">
            Your OTP code for ${roleLabel} registration is:
          </p>
          <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#0f172a;">${otp}</span>
          </div>
          <p style="color:#64748b;font-size:13px;">
            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
