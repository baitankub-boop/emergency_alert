"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useStaffSession } from "@/lib/useStaffSession";
import { Eye, EyeOff, KeyRound, IdCard } from "lucide-react";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function StaffAccountPage() {
  const { t } = useLanguage();
  const role = useStaffSession();

  const [loading, setLoading] = useState(true);
  const [isBuiltin, setIsBuiltin] = useState(false);
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!role) return;
    fetch("/api/get_staff_profile", { method: "POST" })
      .then(res => res.json())
      .then(json => {
        setIsBuiltin(!!json.builtin);
        setEmail(json.email ?? "");
        setCreatedAt(json.created_at ?? null);
        setFirstName(json.first_name ?? "");
        setLastName(json.last_name ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [role]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setSavingInfo(true);
    setInfoMessage(null);
    try {
      const res = await fetch("/api/update_staff_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      });
      const json = await res.json();
      setInfoMessage(json.success
        ? { type: "success", text: t("profile_update_success") }
        : { type: "error", text: t("profile_update_error") });
    } catch {
      setInfoMessage({ type: "error", text: t("profile_update_error") });
    }
    setSavingInfo(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: t("password_too_short_error") });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: t("password_mismatch_error") });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/update_staff_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setPasswordMessage({ type: "success", text: t("password_update_success") });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else if (json.error === "wrong_password") {
        setPasswordMessage({ type: "error", text: t("wrong_current_password_error") });
      } else {
        setPasswordMessage({ type: "error", text: t("profile_update_error") });
      }
    } catch {
      setPasswordMessage({ type: "error", text: t("profile_update_error") });
    }
    setSavingPassword(false);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("account_title")}</h1>
          <p className="text-slate-400 text-sm mt-1">{t("account_subtitle")}</p>
        </div>

        {/* Account info card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <IdCard className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("account_info_section")}</h2>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-5">
            <div>
              <dt className="text-xs text-slate-400 mb-1">{t("th_email")}</dt>
              <dd className="text-slate-700 dark:text-slate-200 font-medium truncate">{email}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 mb-1">{t("th_role")}</dt>
              <dd className="text-slate-700 dark:text-slate-200 font-medium capitalize">{role}</dd>
            </div>
            {!isBuiltin && (
              <div>
                <dt className="text-xs text-slate-400 mb-1">{t("account_created_label")}</dt>
                <dd className="text-slate-700 dark:text-slate-200 font-medium">{formatDate(createdAt)}</dd>
              </div>
            )}
          </dl>

          {isBuiltin ? (
            <p className="text-sm text-slate-400">{t("superadmin_note")}</p>
          ) : (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t("first_name_label")}</label>
                  <input type="text" className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t("last_name_label")}</label>
                  <input type="text" className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              {infoMessage && (
                <p className={`text-xs ${infoMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{infoMessage.text}</p>
              )}
              <button
                type="submit"
                disabled={savingInfo}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm shadow-md shadow-red-500/20 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingInfo ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t("btn_saving")}</> : t("btn_save")}
              </button>
            </form>
          )}
        </div>

        {/* Password card */}
        {!isBuiltin && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("change_password_section")}</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t("current_password_label")}</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className={inputCls}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
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

              {passwordMessage && (
                <p className={`text-xs ${passwordMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{passwordMessage.text}</p>
              )}

              <button
                type="submit"
                disabled={savingPassword}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm shadow-md shadow-red-500/20 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingPassword ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t("btn_saving")}</> : t("btn_save")}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
