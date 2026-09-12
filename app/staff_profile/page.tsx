"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";
import { useStaffSession } from "@/lib/useStaffSession";
import { setStaffNickname } from "@/lib/staffSession";
import { Sun, Moon, User as UserIcon } from "lucide-react";

export default function StaffProfilePage() {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const role = useStaffSession();

  const [loading, setLoading] = useState(true);
  const [isBuiltin, setIsBuiltin] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!role) return;
    fetch("/api/get_staff_profile", { method: "POST" })
      .then(res => res.json())
      .then(json => {
        setIsBuiltin(!!json.builtin);
        setNickname(json.nickname ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [role]);

  const handleSaveNickname = async () => {
    if (!role) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/update_staff_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setStaffNickname(nickname.trim() || null);
        setMessage({ type: "success", text: t("profile_update_success") });
      } else {
        setMessage({ type: "error", text: t("profile_update_error") });
      }
    } catch {
      setMessage({ type: "error", text: t("profile_update_error") });
    }
    setSaving(false);
  };

  if (!role || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-slate-200 border-t-slate-500 rounded-full animate-spin-smooth" style={{ borderWidth: 3 }} />
      </div>
    );
  }

  const inputCls =
    "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 transition-colors">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("profile_title")}</h1>
          <p className="text-slate-400 text-sm mt-1">{t("profile_subtitle")}</p>
        </div>

        {/* Username card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("username_label")}</h2>
          </div>
          {isBuiltin ? (
            <p className="text-sm text-slate-400">{t("superadmin_note")}</p>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-3">{t("username_hint")}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t("username_placeholder")}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={40}
                />
                <button
                  onClick={handleSaveNickname}
                  disabled={saving}
                  className="shrink-0 py-2.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm shadow-md shadow-red-500/20 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t("btn_saving")}</> : t("btn_save")}
                </button>
              </div>
              {message && (
                <p className={`text-xs mt-3 ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>
              )}
            </>
          )}
        </div>

        {/* Theme card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">{t("theme_label")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-2 py-5 rounded-xl border-2 transition-all duration-150 ${
                theme === "light" ? "border-red-400 bg-red-50 dark:bg-red-500/10" : "border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <Sun className={`w-6 h-6 ${theme === "light" ? "text-red-500" : "text-slate-400"}`} />
              <span className={`text-sm font-semibold ${theme === "light" ? "text-red-600" : "text-slate-500 dark:text-slate-400"}`}>{t("theme_light")}</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-2 py-5 rounded-xl border-2 transition-all duration-150 ${
                theme === "dark" ? "border-red-400 bg-red-50 dark:bg-red-500/10" : "border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <Moon className={`w-6 h-6 ${theme === "dark" ? "text-red-500" : "text-slate-400"}`} />
              <span className={`text-sm font-semibold ${theme === "dark" ? "text-red-600" : "text-slate-500 dark:text-slate-400"}`}>{t("theme_dark")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
