"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase";
import { useBanRecheck } from "@/lib/useBanRecheck";
import type { User } from "@supabase/supabase-js";
import { Eye, EyeOff, KeyRound, IdCard } from "lucide-react";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AccountPage() {
  const { t } = useLanguage();
  const router = useRouter();
  useBanRecheck();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/user_login");
        return;
      }
      setUser(session.user);
      setCheckingAuth(false);
    });
  }, [router]);

  const provider = user?.app_metadata?.provider ?? "email";
  const canChangePassword = provider === "email";

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: t("password_too_short_error") });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("password_mismatch_error") });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage({ type: "error", text: t("profile_update_error") });
    } else {
      setMessage({ type: "success", text: t("password_update_success") });
      setNewPassword("");
      setConfirmPassword("");
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("account_title")}</h1>
          <p className="text-slate-400 text-sm mt-1">{t("account_subtitle")}</p>
        </div>

        {/* Account info card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <IdCard className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("account_info_section")}</h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-slate-400 mb-1">{t("th_email")}</dt>
              <dd className="text-slate-700 dark:text-slate-200 font-medium truncate">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 mb-1">{t("th_signup_method")}</dt>
              <dd className="text-slate-700 dark:text-slate-200 font-medium">{t(provider === "google" ? "provider_google" : "provider_email")}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 mb-1">{t("account_created_label")}</dt>
              <dd className="text-slate-700 dark:text-slate-200 font-medium">{formatDate(user?.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Password card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("change_password_section")}</h2>
          </div>

          {!canChangePassword ? (
            <p className="text-sm text-slate-400">{t("google_password_note")}</p>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t("new_password_label")}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputCls} pr-11`}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t("auth_confirm_password")}</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className={inputCls}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {message && (
                <p className={`text-xs ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm shadow-md shadow-red-500/20 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t("btn_saving")}</> : t("btn_save")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
