"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { useTheme } from "@/lib/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useBanRecheck } from "@/lib/useBanRecheck";
import type { User } from "@supabase/supabase-js";
import { Sun, Moon, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  useBanRecheck();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/user_login");
        return;
      }
      setUser(session.user);
      setNickname((session.user.user_metadata?.nickname as string | undefined) ?? "");
      setCheckingAuth(false);
    });
  }, [router]);

  const handleSaveNickname = async () => {
    setSaving(true);
    setMessage(null);
    const { data, error } = await supabase.auth.updateUser({ data: { nickname: nickname.trim() } });
    if (error) {
      setMessage({ type: "error", text: t("profile_update_error") });
    } else {
      setUser(data.user);
      setMessage({ type: "success", text: t("profile_update_success") });
    }
    setSaving(false);
  };

  if (checkingAuth) {
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
          <p className="text-xs text-slate-400 mt-3">
            {t("user_logged_in_as")}: <span className="text-slate-600 dark:text-slate-300">{user?.email}</span>
          </p>
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
