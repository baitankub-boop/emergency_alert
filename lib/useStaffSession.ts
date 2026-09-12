"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isStaffSessionValid, refreshStaffSession, clearStaffSession, getStaffRole, StaffRole } from "./staffSession";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
const STATUS_RECHECK_INTERVAL_MS = 45_000;

function serverLogout() {
  fetch("/api/staff_logout", { method: "POST" }).catch(() => {
    // best-effort — the cookie will still expire on its own
  });
}

export function useStaffSession(requiredRole?: StaffRole | StaffRole[]): StaffRole | null {
  const router = useRouter();
  const [role, setRole] = useState<StaffRole | null>(null);
  const requiredRoleKey = Array.isArray(requiredRole) ? requiredRole.join(",") : requiredRole ?? "";

  useEffect(() => {
    const allowed = requiredRoleKey ? requiredRoleKey.split(",") as StaffRole[] : null;

    const check = (): boolean => {
      if (!isStaffSessionValid()) {
        clearStaffSession();
        serverLogout();
        router.replace("/admin_login");
        return false;
      }
      const currentRole = getStaffRole();
      if (allowed && currentRole && !allowed.includes(currentRole)) {
        router.replace("/admin_page");
        return false;
      }
      setRole(currentRole);
      return true;
    };

    if (!check()) return;

    const handleActivity = () => refreshStaffSession();
    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, handleActivity, { passive: true })
    );

    const interval = setInterval(check, 30_000);

    const checkDisabled = async () => {
      try {
        const res = await fetch("/api/check_staff_status", { method: "POST" });
        if (res.status === 401) {
          clearStaffSession();
          router.replace("/admin_login");
          return;
        }
        const json = await res.json();
        if (json.disabled) {
          clearStaffSession();
          serverLogout();
          router.replace("/admin_login?disabled=1");
        }
      } catch {
        // network error — leave the session as-is, try again next interval
      }
    };
    const statusInterval = setInterval(checkDisabled, STATUS_RECHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity));
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [router, requiredRoleKey]);

  return role;
}
