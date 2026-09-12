"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { isBannedError } from "./authErrors";

const RECHECK_INTERVAL_MS = 45_000;

/**
 * Periodically re-validates the current Supabase session against the server.
 * A reporter who gets banned while already logged in keeps their local session
 * (and full page access) until this check — or a natural token refresh —
 * catches it, since `getSession()` alone never re-contacts the server.
 */
export function useBanRecheck() {
  const router = useRouter();

  useEffect(() => {
    const recheck = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.auth.getUser();
      if (error) {
        await supabase.auth.signOut();
        router.replace(isBannedError(error) ? "/user_login?banned=1" : "/user_login");
      }
    };

    const interval = setInterval(recheck, RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);
}
