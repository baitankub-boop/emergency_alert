"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { setStaffSession, isStaffSessionValid } from "@/lib/staffSession";

function StaffLoginContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isStaffSessionValid()) {
      router.replace("/admin_page");
    }
  }, [router]);

  useEffect(() => {
    if (searchParams.get("disabled") === "1") {
      setError(t("auth_account_disabled_desc"));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify_staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();

      if (json.success) {
        setStaffSession(json.role, username, json.nickname);
        router.push("/admin_page");
      } else if (json.reason === "disabled") {
        setError(t("auth_account_disabled_desc"));
        setLoading(false);
      } else {
        setError(t("auth_login_error"));
        setLoading(false);
      }
    } catch {
      setError(t("auth_network_error"));
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-400 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/kmutnb_font_logo.png" alt="KMUTNB" width={64} height={64} className="drop-shadow-sm" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
            {t("user_login_title")}
          </h1>
          <p className="text-slate-400 text-sm text-center mb-8">
            {t("staff_login_subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t("auth_email")}
              </label>
              <input
                type="text"
                className={inputCls}
                placeholder="example@email.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t("auth_password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${inputCls} pr-11`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-semibold text-sm shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("auth_logging_in")}
                </>
              ) : (
                t("auth_login_btn")
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-4">{t("staff_login_footnote")}</p>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
        </div>
      }
    >
      <StaffLoginContent />
    </Suspense>
  );
}
