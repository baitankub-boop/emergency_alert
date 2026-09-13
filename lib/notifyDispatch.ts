import { createClient } from "@supabase/supabase-js";
import { fillTemplate, sendLineMessage, sendTelegramMessage } from "./notifySend";
import { formatTimestamp, displayFloor } from "./mailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const STATUS_TH: Record<string, string> = {
  Waiting: "รอดำเนินการ",
  "In Process": "กำลังดำเนินการ",
  Success: "สำเร็จ",
  Failed: "ไม่สำเร็จ",
};

// breakdown_type may have been stored in English depending on the reporter's
// site language at submit time — normalize to Thai for the notification.
const BREAKDOWN_TYPE_TH: Record<string, string> = {
  "Electrical System": "ระบบไฟฟ้า",
  "Plumbing": "ระบบประปา",
  "Air Conditioning": "ระบบปรับอากาศ",
  "Elevator": "ลิฟต์",
  "Internet/Network": "อินเทอร์เน็ต/เครือข่าย",
  "Equipment": "อุปกรณ์",
};

const TITLE: Record<"emergency" | "breakdown", string> = {
  emergency: "🚨🆘 แจ้งเหตุฉุกเฉินใหม่",
  breakdown: "🚨🔧 แจ้งเหตุขัดข้องใหม่",
};

interface DispatchInput {
  kind: "emergency" | "breakdown";
  caseId: string;
  type: string;
  floor: string;
  description: string;
  email: string;
  status: string;
  createdAt: string;
  remark?: string;
}

/** Sends the current incident's data (LINE/Telegram, Thai labels) to every enabled notify channel. */
export async function dispatchIncidentNotification(input: DispatchInput): Promise<void> {
  try {
    const placeholders: Record<string, string> = {
      title: TITLE[input.kind],
      case_id: input.caseId,
      type: input.kind === "breakdown" ? (BREAKDOWN_TYPE_TH[input.type] ?? input.type) : input.type,
      floor: displayFloor(input.floor),
      description: input.description,
      email: input.email,
      status: STATUS_TH[input.status] ?? input.status,
      timestamp: formatTimestamp(input.createdAt),
      remark: input.remark ?? "",
    };

    const { data, error } = await supabase
      .from("notify_settings")
      .select("provider, enabled, token, target_id, message_template");

    if (error || !data) return;

    await Promise.all(data.map(async (row) => {
      if (!row.enabled || !row.token || !row.target_id || !row.message_template) return;
      try {
        const payload = JSON.parse(fillTemplate(row.message_template, placeholders));
        if (row.provider === "line") {
          await sendLineMessage(row.token, row.target_id, payload);
        } else if (row.provider === "telegram") {
          await sendTelegramMessage(row.token, row.target_id, payload);
        }
      } catch (err) {
        console.error(`notify dispatch (${row.provider}) error:`, err);
      }
    }));
  } catch (err) {
    console.error("dispatchIncidentNotification error:", err);
  }
}
