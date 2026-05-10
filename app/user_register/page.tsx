"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

export default function UserRegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t("auth_password_mismatch"));
      return;
    }
    if (formData.password.length < 6) {
      setError(t("auth_password_short"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/send_registration_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password, type: "user" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t("submit_error"));
      } else {
        router.push(`/verify_registration_otp?email=${encodeURIComponent(formData.email)}&type=user`);
      }
    } catch {
      setError(t("submit_error"));
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image src="/KMUTNB_Logo.svg.png" alt="KMUTNB" width={64} height={64} className="drop-shadow-xl" />
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            {t("auth_register_title")}
          </h1>
          <p className="text-slate-400 text-sm text-center mb-8">
            {t("auth_register_subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {t("auth_email")} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={inputCls}
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {t("auth_password")} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className={inputCls}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <p className="text-xs text-slate-500 mt-1">{t("auth_password_hint")}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {t("auth_confirm_password")} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className={inputCls}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("auth_registering")}
                </>
              ) : (
                t("auth_register_btn")
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            {t("auth_have_account")}{" "}
            <Link href="/user_login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
              {t("auth_login_link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
