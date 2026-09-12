"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";

type Status = "checking" | "ready" | "invalid" | "success";

function ResetPasswordContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let settled = false;
    const markReady = () => {
      if (!settled) {
        settled = true;
        setStatus("ready");
      }
    };

    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) {
          if (!settled) {
            settled = true;
            setStatus("invalid");
          }
        } else {
          markReady();
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        markReady();
      }
    });

    if (!code) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          markReady();
        } else {
          const timeout = setTimeout(() => {
            if (!settled) {
              settled = true;
              setStatus("invalid");
            }
          }, 3000);
          return () => clearTimeout(timeout);
        }
      });
    }

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("auth_password_short"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth_password_mismatch"));
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    await supabase.auth.signOut();
    setStatus("success");
  };

  const inputCls =
    "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image src="/KMUTNB_Logo.png" alt="KMUTNB" width={64} height={64} className="drop-shadow-sm" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          {status === "checking" && (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm">{t("reset_password_checking")}</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {t("reset_password_invalid_title")}
              </h1>
              <p className="text-slate-400 text-sm mb-8">
                {t("reset_password_invalid_desc")}
              </p>
              <Link
                href="/forgot_password"
                className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm shadow-lg shadow-red-500/25 transition-all duration-200"
              >
                {t("reset_password_request_new")}
              </Link>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {t("reset_password_success_title")}
              </h1>
              <p className="text-slate-400 text-sm mb-8">
                {t("reset_password_success_desc")}
              </p>
              <Link
                href="/user_login"
                className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm shadow-lg shadow-red-500/25 transition-all duration-200"
              >
                {t("reset_password_go_login")}
              </Link>
            </div>
          )}

          {status === "ready" && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                {t("reset_password_title")}
              </h1>
              <p className="text-slate-400 text-sm text-center mb-8">
                {t("reset_password_subtitle")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("reset_password_new_label")}
                  </label>
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">{t("auth_password_hint")}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("reset_password_confirm_label")}
                  </label>
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {t("reset_password_saving")}
                    </>
                  ) : (
                    t("reset_password_btn")
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
