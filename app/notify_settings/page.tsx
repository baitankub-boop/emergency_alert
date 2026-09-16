"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { useStaffSession } from "@/lib/useStaffSession";
import { MessageCircle, Send, Mail, ChevronRight } from "lucide-react";

interface ProviderStatus {
  enabled: boolean;
  hasToken: boolean;
  target_id: string;
}

export default function NotifySettingsPage() {
  const { t } = useLanguage();
  const role = useStaffSession(["admin", "superadmin"]);

  const [loading, setLoading] = useState(true);
  const [line, setLine] = useState<ProviderStatus | null>(null);
  const [telegram, setTelegram] = useState<ProviderStatus | null>(null);
  const [email, setEmail] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    if (!role) return;
    fetch("/api/get_notify_settings")
      .then(res => res.json())
      .then(json => {
        setLine(json.line ?? null);
        setTelegram(json.telegram ?? null);
        setEmail(json.email ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [role]);

  if (!role || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-slate-200 border-t-slate-500 rounded-full animate-spin-smooth" style={{ borderWidth: 3 }} />
      </div>
    );
  }

  const cards = [
    {
      provider: "line",
      label: "LINE",
      icon: MessageCircle,
      color: "emerald",
      status: line,
    },
    {
      provider: "telegram",
      label: "Telegram",
      icon: Send,
      color: "sky",
      status: telegram,
    },
    {
      provider: "email",
      label: "Email",
      icon: Mail,
      color: "amber",
      status: email,
    },
  ] as const;

  const colorCls: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600",
    sky: "bg-sky-50 dark:bg-sky-500/10 text-sky-600",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 transition-colors">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("notify_settings_title")}</h1>
          <p className="text-slate-400 text-sm mt-1">{t("notify_settings_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ provider, label, icon: Icon, color, status }) => (
            <Link
              key={provider}
              href={`/notify_settings/${provider}`}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md p-6 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorCls[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors mt-1" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5">{label}</h2>
              {status?.hasToken ? (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  status.enabled ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.enabled ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {t(status.enabled ? "notify_status_enabled" : "notify_status_configured_disabled")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {t("notify_status_not_configured")}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
