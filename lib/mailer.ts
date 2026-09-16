import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const settingsClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

/** Reads the Gmail address + app password saved in Notify Settings. Returns null if not configured or disabled. */
export async function getEmailSettings(): Promise<{ email: string; appPassword: string } | null> {
  const { data } = await settingsClient
    .from("notify_settings")
    .select("enabled, token, target_id")
    .eq("provider", "email")
    .single();
  if (!data || !data.enabled || !data.token || !data.target_id) return null;
  return { email: data.target_id, appPassword: data.token };
}

export async function sendMail(to: string[], subject: string, html: string) {
  const unique = [...new Set(to.filter(Boolean))];
  if (unique.length === 0) return;

  const settings = await getEmailSettings();
  if (!settings) return; // email notifications not configured/enabled in Notify Settings

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: settings.email, pass: settings.appPassword },
  });

  await transporter.sendMail({
    from: `"40 Building Alarm" <${settings.email}>`,
    to: unique.join(","),
    subject,
    html,
  });
}

export async function getAllStaffEmails(): Promise<string[]> {
  // admin_data/operator_data/superadmin_data have RLS enabled — must use the service role key, not anon.
  const [{ data: admins }, { data: operators }, { data: superadmins }] = await Promise.all([
    settingsClient.from("admin_data").select("email"),
    settingsClient.from("operator_data").select("email"),
    settingsClient.from("superadmin_data").select("email"),
  ]);
  return [
    ...(admins?.map((a: { email: string }) => a.email) ?? []),
    ...(operators?.map((o: { email: string }) => o.email) ?? []),
    ...(superadmins?.map((s: { email: string }) => s.email) ?? []),
  ];
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function displayFloor(floor: string): string {
  return /^\d+$/.test(floor) ? `ชั้น ${floor}` : floor;
}

// ─── Email templates ───────────────────────────────────────────────────────

function baseHtml(content: string) {
  return `
    <div style="font-family:Sarabun,sans-serif;max-width:580px;margin:0 auto;padding:28px 24px;background:#f8fafc;border-radius:12px;">
      <div style="background:#0f172a;border-radius:10px 10px 0 0;padding:18px 24px;">
        <span style="color:#fff;font-size:16px;font-weight:700;">40 Building · KMUTNB</span>
      </div>
      <div style="background:#fff;border-radius:0 0 10px 10px;padding:24px;border:1px solid #e2e8f0;border-top:none;">
        ${content}
      </div>
    </div>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#64748b;font-size:14px;white-space:nowrap;">${label}</td>
    <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

export function emergencySubmitHtml(email: string, type: string, description: string, floor: string, timestamp: string) {
  return baseHtml(`
    <h2 style="color:#dc2626;margin:0 0 16px;font-size:18px;">⚠️ แจ้งเหตุฉุกเฉิน</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${row("โดย:", email)}
      ${row("เหตุการณ์:", `${type} : ${description}`)}
      ${row("ชั้นที่:", displayFloor(floor))}
      ${row("เวลา:", timestamp)}
    </table>
    <p style="margin:20px 0 0;color:#dc2626;font-weight:600;font-size:15px;">โปรดพิจารณา</p>
  `);
}

export function breakdownSubmitHtml(email: string, type: string, description: string, floor: string, timestamp: string) {
  return baseHtml(`
    <h2 style="color:#d97706;margin:0 0 16px;font-size:18px;">🔧 แจ้งเหตุขัดข้อง</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${row("โดย:", email)}
      ${row("เหตุการณ์:", `${type} : ${description}`)}
      ${row("ชั้นที่:", displayFloor(floor))}
      ${row("เวลา:", timestamp)}
    </table>
    <p style="margin:20px 0 0;color:#d97706;font-weight:600;font-size:15px;">โปรดรับเรื่อง</p>
  `);
}

export function statusUpdateHtml(
  kind: "emergency" | "breakdown",
  reporterEmail: string,
  eventType: string,
  description: string,
  oldStatus: string,
  newStatus: string,
  remark?: string,
) {
  const isSuccess = newStatus === "Success";
  const kindTh = kind === "emergency" ? "เหตุฉุกเฉิน" : "เหตุขัดข้อง";
  const color = kind === "emergency" ? "#dc2626" : "#d97706";
  const statusLine = isSuccess
    ? `<p style="margin:16px 0 0;color:#16a34a;font-weight:600;font-size:15px;">✅ ได้รับการแก้ไขเสร็จสิ้น</p>`
    : `${row("สถานะ:", `${oldStatus} → ${newStatus}`)}`;

  return baseHtml(`
    <h2 style="color:${color};margin:0 0 16px;font-size:18px;">📋 อัปเดทสถานะ${kindTh}</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${row("ผู้แจ้งเหตุ:", reporterEmail)}
      ${row("เหตุการณ์:", `${eventType} : ${description}`)}
      ${isSuccess ? "" : statusLine}
      ${remark ? row("หมายเหตุจากเจ้าหน้าที่:", remark) : ""}
    </table>
    ${isSuccess ? statusLine : ""}
  `);
}
