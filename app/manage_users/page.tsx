"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UserPlus, ShieldPlus, Ban, CheckCircle2, Crown, Lock } from "lucide-react";
import { useStaffSession } from "@/lib/useStaffSession";
import { useLanguage } from "@/lib/LanguageContext";

interface StaffUser {
  id: string;
  email: string;
  provider: string;
  role: "user" | "admin" | "operator" | "superadmin";
  created_at: string | null;
  banned: boolean;
  manageable: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const ROLE_BADGE_CLS: Record<StaffUser["role"], string> = {
  user: "bg-slate-100 text-slate-600 border border-slate-200",
  admin: "bg-blue-50 text-blue-700 border border-blue-200",
  operator: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  superadmin: "bg-amber-50 text-amber-700 border border-amber-200",
};

const ROLE_KEY: Record<StaffUser["role"], string> = {
  user: "role_user",
  admin: "role_admin",
  operator: "role_operator",
  superadmin: "role_superadmin",
};

export default function ManageUsersPage() {
  const { t } = useLanguage();
  const role = useStaffSession(["admin", "superadmin"]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/list_users");
      const json = await res.json();
      if (res.ok) setUsers(json.users as StaffUser[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleBan = async (target: StaffUser, ban: boolean) => {
    setUpdatingId(target.id);
    try {
      if (target.role === "user") {
        await fetch("/api/toggle_user_ban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: target.id, ban }),
        });
      } else {
        await fetch("/api/toggle_staff_status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: target.email, role: target.role, disabled: ban }),
        });
      }
      await fetchUsers();
    } finally {
      setUpdatingId(null);
      setConfirmingId(null);
    }
  };

  if (!role) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">{t("manage_users_title")}</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{t("manage_users_subtitle")}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            href="/add_admin"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-sm"
          >
            <ShieldPlus className="w-4 h-4" />
            {t("btn_add_admin")}
          </Link>
          <Link
            href="/add_operator"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            {t("btn_add_operator")}
          </Link>
          {role === "superadmin" && (
            <Link
              href="/add_superadmin"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-all shadow-sm"
            >
              <Crown className="w-4 h-4" />
              {t("btn_add_superadmin")}
            </Link>
          )}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{t("th_email")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{t("th_role")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{t("th_signup_method")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{t("th_timestamp")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{t("th_status")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{t("th_action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin-smooth" />
                        <span className="text-sm text-slate-400">{t("manage_users_loading")}</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-slate-400">{t("manage_users_empty")}</td>
                  </tr>
                )}
                {!loading && users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-4 py-3 text-sm text-slate-700">{u.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE_CLS[u.role]}`}>
                        {t(ROLE_KEY[u.role])}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {t(u.provider === "google" ? "provider_google" : "provider_email")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.banned ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.banned ? "bg-red-500" : "bg-emerald-500"}`} />
                        {t(u.banned ? "status_disabled" : "status_active")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!u.manageable ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-slate-300 text-xs"
                          title={t("manage_users_locked_hint")}
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      ) : confirmingId === u.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleBan(u, !u.banned)}
                            disabled={updatingId === u.id}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-50 ${
                              u.banned ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {updatingId === u.id ? (
                              <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin-smooth" />
                            ) : null}
                            {t(u.banned ? "btn_confirm_enable" : "btn_confirm_disable")}
                          </button>
                          <button onClick={() => setConfirmingId(null)} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1">
                            {t("btn_cancel")}
                          </button>
                        </div>
                      ) : u.banned ? (
                        <button
                          onClick={() => setConfirmingId(u.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t("btn_enable")}
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(u.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold transition-all"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {t("btn_disable")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
