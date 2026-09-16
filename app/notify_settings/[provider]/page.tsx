"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { useStaffSession } from "@/lib/useStaffSession";
import { ArrowLeft, Send, KeyRound } from "lucide-react";

type Provider = "line" | "telegram" | "email";

const PROVIDER_META: Record<Provider, {
  label: string;
  tokenLabel: string;
  tokenPlaceholder: string;
  targetLabel: string;
  targetPlaceholder: string;
  defaultTemplate: string;
  hasTemplate: boolean;
}> = {
  line: {
    label: "LINE",
    tokenLabel: "Channel Access Token",
    tokenPlaceholder: "Long-lived channel access token from LINE Developers Console",
    targetLabel: "Group ID",
    targetPlaceholder: "C4af4980629...",
    defaultTemplate: JSON.stringify(
      [{ type: "text", text: "{{title}}\n\nหมายเลขเคส : {{case_id}}\nประเภท: {{type}}\nชั้นที่: {{floor}}\nรายละเอียด: {{description}}\nสถานะ: {{status}}\nหมายเหตุ: {{remark}}" }],
      null,
      2
    ),
    hasTemplate: true,
  },
  telegram: {
    label: "Telegram",
    tokenLabel: "Bot Token",
    tokenPlaceholder: "123456789:AAFhx...",
    targetLabel: "Chat ID",
    targetPlaceholder: "-1001234567890",
    defaultTemplate: JSON.stringify(
      { text: "{{title}}\n\nหมายเลขเคส : {{case_id}}\nประเภท: {{type}}\nชั้นที่: {{floor}}\nรายละเอียด: {{description}}\nสถานะ: {{status}}\nหมายเหตุ: {{remark}}", parse_mode: "HTML" },
      null,
      2
    ),
    hasTemplate: true,
  },
  email: {
    label: "Email",
    tokenLabel: "Gmail App Password",
    tokenPlaceholder: "16-character app password from Google Account",
    targetLabel: "Gmail Address",
    targetPlaceholder: "yourname@gmail.com",
    defaultTemplate: "",
    hasTemplate: false,
  },
};

export default function NotifyProviderSettingsPage() {
  const { t } = useLanguage();
  const role = useStaffSession(["admin", "superadmin"]);
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const provider = (["line", "telegram", "email"].includes(params.provider) ? params.provider : null) as Provider | null;

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [targetId, setTargetId] = useState("");
  const [template, setTemplate] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!provider) {
      router.replace("/notify_settings");
    }
  }, [provider, router]);

  useEffect(() => {
    if (!role || !provider) return;
    fetch("/api/get_notify_settings")
      .then(res => res.json())
      .then(json => {
        const data = json[provider];
        setEnabled(!!data?.enabled);
        setHasToken(!!data?.hasToken);
        setTokenPreview(data?.tokenPreview ?? null);
        setTargetId(data?.target_id ?? "");
        setTemplate(data?.message_template || PROVIDER_META[provider].defaultTemplate);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [role, provider]);

  if (!role || !provider || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-slate-200 border-t-slate-500 rounded-full animate-spin-smooth" style={{ borderWidth: 3 }} />
      </div>
    );
  }

  const meta = PROVIDER_META[provider];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);

    if (meta.hasTemplate) {
      try {
        JSON.parse(template);
      } catch {
        setSaveMessage({ type: "error", text: t("invalid_json_error") });
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/save_notify_settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, enabled, token: token || undefined, target_id: targetId, message_template: template }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveMessage({ type: "success", text: t("profile_update_success") });
        if (token) {
          setHasToken(true);
          setTokenPreview(`••••••••${token.slice(-4)}`);
          setToken("");
        }
      } else {
        setSaveMessage({ type: "error", text: json.error === "invalid_json" ? t("invalid_json_error") : t("profile_update_error") });
      }
    } catch {
      setSaveMessage({ type: "error", text: t("profile_update_error") });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTestMessage(null);
    setTesting(true);
    try {
      const res = await fetch("/api/test_notify_settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json();
      if (json.success) {
        setTestMessage({ type: "success", text: t("notify_test_success") });
      } else if (json.error === "not_configured") {
        setTestMessage({ type: "error", text: t("notify_test_not_configured") });
      } else if (json.error === "invalid_json") {
        setTestMessage({ type: "error", text: t("invalid_json_error") });
      } else {
        setTestMessage({ type: "error", text: `${t("notify_test_failed")}${json.detail ? `: ${json.detail}` : ""}` });
      }
    } catch {
      setTestMessage({ type: "error", text: t("notify_test_failed") });
    }
    setTesting(false);
  };

  const inputCls =
    "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 transition-colors">
      <div className="container mx-auto max-w-2xl">
        <Link href="/notify_settings" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("notify_settings_title")}
        </Link>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{meta.label} {t("notify_settings_title")}</h1>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("notify_enabled_label")}</span>
            <button
              type="button"
              onClick={() => setEnabled(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-4" : ""}`} />
            </button>
          </label>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("notify_connection_section")}</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{meta.tokenLabel}</label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder={hasToken ? tokenPreview ?? "" : meta.tokenPlaceholder}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  autoComplete="off"
                />
                {hasToken && <p className="text-xs text-slate-400 mt-1.5">{t("notify_token_unchanged_hint")}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{meta.targetLabel}</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={meta.targetPlaceholder}
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                />
              </div>
            </div>
          </div>

          {meta.hasTemplate && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">{t("notify_template_section")}</h2>
              <p className="text-xs text-slate-400 mb-3">{t("notify_template_hint")}</p>
              <textarea
                rows={8}
                className={`${inputCls} font-mono text-xs`}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {saveMessage && (
            <p className={`text-xs -mt-2 ${saveMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{saveMessage.text}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm shadow-md shadow-red-500/20 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t("btn_saving")}</> : t("btn_save")}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !hasToken}
              title={!hasToken ? t("notify_test_not_configured") : undefined}
              className="py-2.5 px-6 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {testing ? <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {t("btn_test_send")}
            </button>
            {testMessage && (
              <span className={`text-xs ${testMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{testMessage.text}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
