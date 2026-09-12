export type NotifyProvider = "line" | "telegram";

const SAMPLE_PLACEHOLDERS: Record<string, string> = {
  type: "Serious Accident",
  floor: "Floor 5",
  description: "This is a sample test description.",
  email: "reporter@example.com",
  status: "Waiting",
  timestamp: new Date().toLocaleString("en-GB"),
};

/** JSON-safely substitutes {{key}} placeholders inside a raw JSON template string. */
export function fillTemplate(template: string, data: Record<string, string> = SAMPLE_PLACEHOLDERS): string {
  let out = template;
  for (const [key, value] of Object.entries(data)) {
    const escaped = JSON.stringify(value).slice(1, -1); // JSON-escape without surrounding quotes
    out = out.split(`{{${key}}}`).join(escaped);
  }
  return out;
}

export async function sendLineMessage(
  token: string,
  groupId: string,
  messages: unknown
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: groupId, messages: Array.isArray(messages) ? messages : [messages] }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: body || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function sendTelegramMessage(
  token: string,
  chatId: string,
  extra: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, ...extra }),
    });
    const json = await res.json();
    if (!json.ok) {
      return { ok: false, error: json.description || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}
