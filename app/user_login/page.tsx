"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { isBannedError } from "@/lib/authErrors";

function UserLoginContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [banned, setBanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("banned") === "1") {
      setBanned(true);
    }
  }, [searchParams]);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/");
    });

    // Also react to auth changes (e.g. OAuth flow completing)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBanned(false);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (isBannedError(error)) {
        setBanned(true);
      } else {
        setError(t("auth_login_error"));
      }
    } else if (data.user && !data.user.email_confirmed_at) {
      setError(t("auth_email_not_verified"));
      router.push(`/verify_otp?email=${encodeURIComponent(email)}`);
    } else {
      router.replace("/");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setBanned(false);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/kmutnb_font_logo.png" alt="KMUTNB" width={64} height={64} className="drop-shadow-sm" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          {banned ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center">
                  <ShieldOff className="w-7 h-7 text-red-600" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">
                {t("auth_account_disabled_title")}
              </h1>
              <p className="text-slate-400 text-sm mb-6">
                {t("auth_account_disabled_desc")}
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <span>
                    <strong className="text-slate-800">Baitan:</strong>{" "}
                    <a href="tel:0812583826" className="text-red-600 hover:underline">081-258-3826</a>
                  </span>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <span>
                    <strong className="text-slate-800">On:</strong>{" "}
                    <a href="tel:0878526457" className="text-red-600 hover:underline">087-852-6457</a>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBanned(false)}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                {t("btn_cancel")}
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                {t("user_login_title")}
              </h1>
              <p className="text-slate-400 text-sm text-center mb-8">
                {t("user_login_subtitle")}
              </p>

              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-6"
              >
                {googleLoading ? (
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {t("auth_login_google")}
              </button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400 uppercase">
                  <span className="bg-white px-3 tracking-wider">{t("auth_or")}</span>
                </div>
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
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
                    type="email"
                    className={inputCls}
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("auth_password")}
                  </label>
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-sm shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              <p className="text-center text-slate-400 text-sm mt-6">
                {t("auth_no_account")}{" "}
                <Link href="/user_register" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                  {t("auth_register_link")}
                </Link>
                <span className="mx-2 text-slate-300">·</span>
                <Link href="/forgot_password" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                  {t("auth_forgot_password")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
        </div>
      }
    >
      <UserLoginContent />
    </Suspense>
  );
}
