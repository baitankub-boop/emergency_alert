"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirected = useRef(false);

  useEffect(() => {
    const done = (path: string) => {
      if (!redirected.current) {
        redirected.current = true;
        router.replace(path);
      }
    };

    const urlError = searchParams.get("error");
    if (urlError) {
      done("/user_login");
      return;
    }

    const code = searchParams.get("code");

    if (code) {
      // PKCE flow (default in @supabase/supabase-js v2): must exchange the code explicitly
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) {
          done("/user_login");
        } else {
          done("/");
        }
      });
      return;
    }

    // Implicit flow fallback (no code param — tokens arrive in the URL hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        done("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) done("/");
    });

    const timeout = setTimeout(() => done("/user_login"), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-300 text-sm">กำลังเข้าสู่ระบบ...</p>
        <p className="text-slate-500 text-xs mt-1">กรุณารอสักครู่</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
