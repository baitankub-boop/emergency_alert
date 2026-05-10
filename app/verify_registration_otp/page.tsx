"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const type = searchParams.get("type") || "admin";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/verify_registration_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, type }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Verification failed.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        router.replace(type === "user" ? "/user_login" : "/admin_page");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResending(true);
    setError("");
    try {
      const storedData = sessionStorage.getItem("pending_registration");
      if (!storedData) { setError("Session expired. Please go back and try again."); return; }
      const { first_name, last_name, password } = JSON.parse(storedData);
      const res = await fetch("/api/send_registration_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, email, password, type }),
      });
      if (res.ok) {
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError("Failed to resend OTP.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setResending(false);
    }
  };

  const roleLabel = type === "admin" ? "Admin" : "Operator";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fadeInUp">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 text-center">
            <div className="relative inline-block mb-3">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md" />
              <Image src="/KMUTNB_Logo.svg.png" alt="KMUTNB" width={48} height={48} className="h-12 w-auto relative" />
            </div>
            <h2 className="text-lg font-bold text-white">Verify OTP</h2>
            <p className="text-slate-400 text-xs mt-0.5">40 Building alarm OTP · {roleLabel} Registration</p>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 text-center mb-1">
              A 6-digit OTP has been sent to
            </p>
            <p className="text-sm font-semibold text-slate-800 text-center mb-6 break-all">{email}</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* OTP Inputs */}
              <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold border-2 rounded-xl transition-all outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-400/30 bg-slate-50 text-slate-800"
                    style={{ height: "52px" }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-semibold text-sm transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                ) : "Verify OTP"}
              </button>
            </form>

            <div className="mt-4 text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-slate-400">Resend in {resendCooldown}s</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs text-slate-500 hover:text-slate-700 underline transition-colors disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>

            <div className="mt-3 text-center">
              <button
                onClick={() => router.back()}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyRegistrationOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <OtpContent />
    </Suspense>
  );
}
