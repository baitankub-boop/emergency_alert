"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase";
import Pagination from "@/components/Pagination";

const EMERGENCY_CANONICAL_TYPES = ["เป็นลม", "อุบัติเหตุร้ายแรง", "ทะเลาะวิวาท", "พบโจร", "โดนล่วงละเมิด", "สัตว์มีพิษกัด"];

const BREAKDOWN_TYPE_KEYS: Record<string, string> = {
  "ระบบไฟฟ้า": "type_electricity", "ระบบประปา": "type_plumbing",
  "ระบบปรับอากาศ": "type_ac", "ลิฟต์": "type_elevator",
  "อินเทอร์เน็ต/เครือข่าย": "type_internet", "อุปกรณ์": "type_equipment",
  "Electrical System": "type_electricity", "Plumbing": "type_plumbing",
  "Air Conditioning": "type_ac", "Elevator": "type_elevator",
  "Internet/Network": "type_internet", "Equipment": "type_equipment",
};

interface EmergencyRow {
  id: number;
  created_at: string;
  emergency_type: string;
  floor: string;
  description: string;
  email: string;
  status: string;
}

interface BreakdownRow {
  id: number;
  created_at: string;
  breakdown_type: string;
  floor: string;
  description: string;
  email: string;
  status: string;
}

type EditState = {
  table: "emergency" | "breakdown";
  id: number;
  floor: string;
  description: string;
  event_type: string;
  other_type: string;
  email: string;
} | null;

const PREDEFINED_TYPES = [
  "Electrical System", "Plumbing", "Air Conditioning", "Elevator", "Internet/Network", "Equipment",
  "ระบบไฟฟ้า", "ระบบประปา", "ระบบปรับอากาศ", "ลิฟต์", "อินเทอร์เน็ต/เครือข่าย", "อุปกรณ์",
];

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const config: Record<string, { cls: string; dot: string; key: string }> = {
    Waiting: { cls: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400 animate-pulse", key: "status_waiting" },
    "In Process": { cls: "bg-blue-50 text-blue-700 border border-blue-200", dot: "bg-blue-400 animate-pulse", key: "status_in_process" },
    Success: { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", key: "status_success" },
    Failed: { cls: "bg-red-50 text-red-700 border border-red-200", dot: "bg-red-500", key: "status_failed" },
  };
  const c = config[status] ?? { cls: "bg-slate-100 text-slate-600 border border-slate-200", dot: "bg-slate-400", key: "" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.key ? t(c.key) : status}
    </span>
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function displayFloor(floor: string, t: (k: string) => string) {
  return /^\d+$/.test(floor) ? `${t("floor_display")} ${floor}` : floor;
}

function displayEmergencyType(type: string, t: (k: string) => string) {
  const map: Record<string, string> = {
    "เป็นลม": t("emergency_type_fainting"), "อุบัติเหตุร้ายแรง": t("emergency_type_accident"),
    "ทะเลาะวิวาท": t("emergency_type_fighting"), "พบโจร": t("emergency_type_robbery"),
    "โดนล่วงละเมิด": t("emergency_type_harassment"), "สัตว์มีพิษกัด": t("emergency_type_animal"),
  };
  return map[type] || type;
}

function LoadingSpinner({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-slate-200 border-t-slate-500 rounded-full animate-spin-smooth" style={{ borderWidth: 3 }} />
          <span className="text-sm text-slate-400">Loading...</span>
        </div>
      </td>
    </tr>
  );
}

type ActiveTable = "emergency" | "breakdown";

export default function Home() {
  const { t } = useLanguage();
  const [activeTable, setActiveTable] = useState<ActiveTable>("emergency");
  const [emergencyRows, setEmergencyRows] = useState<EmergencyRow[]>([]);
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [myReportsOnly, setMyReportsOnly] = useState(false);
  const [editState, setEditState] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pageEmergency, setPageEmergency] = useState(1);
  const [pageBreakdown, setPageBreakdown] = useState(1);
  const ROWS_PER_PAGE = 10;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
      if (!session) setMyReportsOnly(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (activeTable === "emergency") {
      const { data, error } = await supabase
        .from("emergency_data")
        .select("id, created_at, emergency_type, floor, description, email, status")
        .order("created_at", { ascending: false });
      if (error) console.error("emergency_data error:", error.message);
      if (!error && data) setEmergencyRows(data as EmergencyRow[]);
    } else {
      const { data, error } = await supabase
        .from("breakdown_data")
        .select("id, created_at, breakdown_type, floor, description, email, status")
        .order("created_at", { ascending: false });
      if (error) console.error("breakdown_data error:", error.message);
      if (!error && data) setBreakdownRows(data as BreakdownRow[]);
    }
    setLoading(false);
  }, [activeTable]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!editState) return;
    setDeleting(true);
    if (editState.table === "emergency") {
      await supabase.from("emergency_data").delete().eq("id", editState.id);
    } else {
      await supabase.from("breakdown_data").delete().eq("id", editState.id);
    }
    setDeleting(false);
    setEditState(null);
    setConfirmingDelete(false);
    fetchData();
  };

  const handleSaveEdit = async () => {
    if (!editState) return;
    setSaving(true);
    if (editState.table === "emergency") {
      await supabase.from("emergency_data").update({
        emergency_type: editState.event_type === "other" ? editState.other_type : editState.event_type,
        floor: editState.floor,
        description: editState.description,
      }).eq("id", editState.id);
    } else {
      await supabase.from("breakdown_data").update({
        breakdown_type: editState.event_type === "other" ? editState.other_type : editState.event_type,
        floor: editState.floor,
        description: editState.description,
      }).eq("id", editState.id);
    }
    setSaving(false);
    setEditState(null);
    fetchData();
  };

  const emailMatch = (a: string | null | undefined, b: string | null | undefined) =>
    !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

  const displayEmergency = myReportsOnly && userEmail
    ? emergencyRows.filter(r => emailMatch(r.email, userEmail))
    : emergencyRows;

  const displayBreakdown = myReportsOnly && userEmail
    ? breakdownRows.filter(r => emailMatch(r.email, userEmail))
    : breakdownRows;

  const totalPagesEmergency = Math.max(1, Math.ceil(displayEmergency.length / ROWS_PER_PAGE));
  const totalPagesBreakdown = Math.max(1, Math.ceil(displayBreakdown.length / ROWS_PER_PAGE));
  const pagedEmergency = displayEmergency.slice((pageEmergency - 1) * ROWS_PER_PAGE, pageEmergency * ROWS_PER_PAGE);
  const pagedBreakdown = displayBreakdown.slice((pageBreakdown - 1) * ROWS_PER_PAGE, pageBreakdown * ROWS_PER_PAGE);

  const thCls = "px-3 sm:px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap";
  const tdCls = "px-3 sm:px-4 py-3.5 text-sm text-slate-700";

  const emergencyCols = userEmail ? 8 : 7;
  const breakdownCols = userEmail ? 8 : 7;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Edit Modal */}
      {editState && (() => {
        const isBreakdown = editState.table === "breakdown";
        const headerCls = isBreakdown
          ? "bg-gradient-to-r from-emerald-600 to-teal-500"
          : "bg-gradient-to-r from-red-600 to-red-500";
        const ringCls = isBreakdown
          ? "focus:ring-emerald-400/50 focus:border-emerald-400"
          : "focus:ring-red-400/50 focus:border-red-400";
        const modalInputCls = `w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 ${ringCls} transition-all duration-200`;
        const floorOptions = Array.from({ length: 12 }, (_, i) => ({ value: `${i + 1}`, label: `${t("floor")} ${i + 1}` }));
        const floorMatches = floorOptions.some(f => f.value === editState.floor);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setEditState(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`${headerCls} px-6 py-4 flex items-center justify-between`}>
                <h3 className="text-white font-semibold text-sm tracking-wide">
                  {t(isBreakdown ? "edit_breakdown_title" : "edit_emergency_title")}
                </h3>
                <button onClick={() => setEditState(null)} className="text-white/70 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="p-5 sm:p-6 space-y-5">

                {/* Emergency type */}
                {!isBreakdown && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {t("emergency_type_label")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={modalInputCls}
                      value={editState.event_type}
                      onChange={e => setEditState({ ...editState, event_type: e.target.value })}
                    >
                      <option value="">{t("emergency_select_type")}</option>
                      {EMERGENCY_CANONICAL_TYPES.map(v => {
                        const keyMap: Record<string, string> = { "เป็นลม": "emergency_type_fainting", "อุบัติเหตุร้ายแรง": "emergency_type_accident", "ทะเลาะวิวาท": "emergency_type_fighting", "พบโจร": "emergency_type_robbery", "โดนล่วงละเมิด": "emergency_type_harassment", "สัตว์มีพิษกัด": "emergency_type_animal" };
                        return <option key={v} value={v}>{t(keyMap[v])}</option>;
                      })}
                      <option value="other">{t("type_other")}</option>
                    </select>
                    {editState.event_type === "other" && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          {t("other_type_label")} <span className="text-red-500">*</span>
                        </label>
                        <input type="text" className={modalInputCls} placeholder={t("other_type_placeholder")} value={editState.other_type} onChange={e => setEditState({ ...editState, other_type: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}

                {/* Breakdown type */}
                {isBreakdown && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {t("breakdown_type_label")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={modalInputCls}
                      value={editState.event_type}
                      onChange={e => setEditState({ ...editState, event_type: e.target.value })}
                    >
                      <option value="">{t("select_type")}</option>
                      <option value={t("type_electricity")}>{t("type_electricity")}</option>
                      <option value={t("type_plumbing")}>{t("type_plumbing")}</option>
                      <option value={t("type_ac")}>{t("type_ac")}</option>
                      <option value={t("type_elevator")}>{t("type_elevator")}</option>
                      <option value={t("type_internet")}>{t("type_internet")}</option>
                      <option value={t("type_equipment")}>{t("type_equipment")}</option>
                      <option value="other">{t("type_other")}</option>
                    </select>
                    {editState.event_type === "other" && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          {t("other_type_label")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={modalInputCls}
                          placeholder={t("other_type_placeholder")}
                          value={editState.other_type}
                          onChange={e => setEditState({ ...editState, other_type: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Floor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t(isBreakdown ? "breakdown_floor_label" : "emergency_floor_label")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={modalInputCls}
                    value={editState.floor}
                    onChange={e => setEditState({ ...editState, floor: e.target.value })}
                  >
                    <option value="">{t("select_floor")}</option>
                    {!floorMatches && editState.floor && (
                      <option value={editState.floor}>{editState.floor}</option>
                    )}
                    {floorOptions.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t(isBreakdown ? "breakdown_desc_label" : "emergency_desc_label")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className={modalInputCls}
                    placeholder={t(isBreakdown ? "breakdown_desc_placeholder" : "emergency_desc_placeholder")}
                    value={editState.description}
                    onChange={e => setEditState({ ...editState, description: e.target.value })}
                  />
                </div>

                {/* Email (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t(isBreakdown ? "breakdown_email_label" : "emergency_email_label")}
                  </label>
                  <input
                    type="email"
                    className={`${modalInputCls} bg-slate-50 text-slate-500`}
                    value={editState.email}
                    readOnly
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 mt-2">
                  {!confirmingDelete ? (
                    <button type="button" onClick={() => setConfirmingDelete(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      {t("btn_delete")}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleDelete} disabled={deleting}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50">
                        {deleting ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        {t("btn_confirm_delete")}
                      </button>
                      <button type="button" onClick={() => setConfirmingDelete(false)} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1">{t("btn_cancel")}</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditState(null); setConfirmingDelete(false); }} className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all">{t("btn_cancel")}</button>
                    <button type="button" onClick={handleSaveEdit} disabled={saving}
                      className={`py-2.5 px-4 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2 ${isBreakdown ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600" : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"}`}>
                      {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t("btn_saving")}</> : t("btn_save")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute left-0 bottom-0 hidden md:block select-none pointer-events-none">
          <Image src="/emergency_cat.png" alt="Emergency" width={160} height={180} className="object-contain object-bottom opacity-90" />
        </div>
        <div className="absolute right-0 bottom-0 hidden md:block select-none pointer-events-none">
          <Image src="/breakdown_dog.png" alt="Breakdown" width={160} height={180} className="object-contain object-bottom opacity-90" />
        </div>
        <div className="relative z-10 py-12 px-4 md:py-16 md:px-48 lg:px-56">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-medium tracking-wide uppercase">{t("live_monitoring")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 animate-fadeInUp">
              {t("home_title")}
            </h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto animate-fadeInUp delay-100">
              40 Building · KMUTNB
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Tab Selector + My Reports toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8 animate-fadeInUp delay-200">
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => { setActiveTable("emergency"); setPageEmergency(1); }}
              className={`flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg ${
                activeTable === "emergency"
                  ? "bg-red-600 text-white shadow-red-500/30 scale-105"
                  : "bg-white text-slate-500 hover:text-red-600 hover:shadow-md border border-slate-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTable === "emergency" ? "bg-red-200" : "bg-red-400"}`} />
              {t("btn_emergency")}
            </button>
            <button
              onClick={() => { setActiveTable("breakdown"); setPageBreakdown(1); }}
              className={`flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg ${
                activeTable === "breakdown"
                  ? "bg-emerald-600 text-white shadow-emerald-500/30 scale-105"
                  : "bg-white text-slate-500 hover:text-emerald-600 hover:shadow-md border border-slate-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTable === "breakdown" ? "bg-emerald-200" : "bg-emerald-500"}`} />
              {t("btn_breakdown")}
            </button>
          </div>

          {/* My Reports Button — only when logged in */}
          {userEmail && (
            <button
              onClick={() => { setMyReportsOnly(!myReportsOnly); setPageEmergency(1); setPageBreakdown(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border shadow-sm ${
                myReportsOnly
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/25"
                  : "bg-white text-slate-500 border-slate-200 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t("my_reports")}
            </button>
          )}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeInUp delay-300 mb-16">
          <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between ${
            activeTable === "emergency"
              ? "bg-gradient-to-r from-red-50 to-orange-50"
              : "bg-gradient-to-r from-emerald-50 to-teal-50"
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${activeTable === "emergency" ? "bg-red-500" : "bg-emerald-500"}`} />
              <h3 className="font-semibold text-slate-700 text-sm sm:text-base">
                {activeTable === "emergency" ? t("btn_emergency") : t("btn_breakdown")} — {t("recent_events")}
                {myReportsOnly && <span className="ml-2 text-xs text-indigo-500 font-normal">{t("for_me_label")}</span>}
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {loading ? "" : `${activeTable === "emergency" ? displayEmergency.length : displayBreakdown.length} ${t("records")}`}
            </span>
          </div>

          <div className="overflow-x-auto">
            {activeTable === "emergency" && (
              <table className="w-full min-w-[560px]">
                <thead className="sticky top-0 z-10 bg-slate-800">
                  <tr>
                    <th className={thCls}>{t("th_no")}</th>
                    <th className={thCls}>{t("th_timestamp")}</th>
                    <th className={thCls}>{t("emergency_type_label")}</th>
                    <th className={thCls}>{t("th_floor")}</th>
                    <th className={thCls}>{t("th_description")}</th>
                    <th className={thCls}>{t("th_email")}</th>
                    <th className={thCls}>{t("th_status")}</th>
                    {userEmail && <th className={thCls}></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && <LoadingSpinner cols={emergencyCols} />}
                  {!loading && displayEmergency.length === 0 && (
                    <tr><td colSpan={emergencyCols} className="py-16 text-center text-sm text-slate-400">{t("no_events")}</td></tr>
                  )}
                  {!loading && pagedEmergency.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className={`${tdCls} text-slate-400 font-medium w-10`}>{(pageEmergency - 1) * ROWS_PER_PAGE + idx + 1}</td>
                      <td className={`${tdCls} text-slate-500 font-mono text-xs whitespace-nowrap`}>{formatTimestamp(r.created_at)}</td>
                      <td className={tdCls}>
                        {r.emergency_type ? <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">{displayEmergencyType(r.emergency_type, t)}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className={`${tdCls} font-medium`}>{displayFloor(r.floor, t)}</td>
                      <td className={`${tdCls} max-w-[200px]`}><span className="line-clamp-2">{r.description}</span></td>
                      <td className={`${tdCls} text-slate-500 text-xs`}>{r.email}</td>
                      <td className={tdCls}><StatusBadge status={r.status} /></td>
                      {userEmail && (
                        <td className={tdCls}>
                          {emailMatch(r.email, userEmail) && r.status === "Waiting" ? (
                            <button
                              onClick={() => { const isPredefinedE = EMERGENCY_CANONICAL_TYPES.includes(r.emergency_type || ""); setEditState({ table: "emergency", id: r.id, floor: r.floor, description: r.description, event_type: isPredefinedE ? (r.emergency_type || "") : (r.emergency_type ? "other" : ""), other_type: isPredefinedE ? "" : (r.emergency_type || ""), email: r.email }); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              title="แก้ไขการแจ้งเหตุ"
                            >
                              <PencilIcon />
                            </button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTable === "emergency" && !loading && (
              <Pagination currentPage={pageEmergency} totalPages={totalPagesEmergency} onPageChange={setPageEmergency} />
            )}

            {activeTable === "breakdown" && (
              <table className="w-full min-w-[640px]">
                <thead className="sticky top-0 z-10 bg-slate-800">
                  <tr>
                    <th className={thCls}>{t("th_no")}</th>
                    <th className={thCls}>{t("th_timestamp")}</th>
                    <th className={thCls}>{t("th_type")}</th>
                    <th className={thCls}>{t("th_floor")}</th>
                    <th className={thCls}>{t("th_description")}</th>
                    <th className={thCls}>{t("th_email")}</th>
                    <th className={thCls}>{t("th_status")}</th>
                    {userEmail && <th className={thCls}></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && <LoadingSpinner cols={breakdownCols} />}
                  {!loading && displayBreakdown.length === 0 && (
                    <tr><td colSpan={breakdownCols} className="py-16 text-center text-sm text-slate-400">{t("no_events")}</td></tr>
                  )}
                  {!loading && pagedBreakdown.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className={`${tdCls} text-slate-400 font-medium w-10`}>{(pageBreakdown - 1) * ROWS_PER_PAGE + idx + 1}</td>
                      <td className={`${tdCls} text-slate-500 font-mono text-xs whitespace-nowrap`}>{formatTimestamp(r.created_at)}</td>
                      <td className={tdCls}>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{r.breakdown_type}</span>
                      </td>
                      <td className={`${tdCls} font-medium`}>{displayFloor(r.floor, t)}</td>
                      <td className={`${tdCls} max-w-[160px]`}><span className="line-clamp-2">{r.description}</span></td>
                      <td className={`${tdCls} text-slate-500 text-xs`}>{r.email}</td>
                      <td className={tdCls}><StatusBadge status={r.status} /></td>
                      {userEmail && (
                        <td className={tdCls}>
                          {emailMatch(r.email, userEmail) && r.status === "Waiting" ? (
                            <button
                              onClick={() => {
                                const normalizedKey = BREAKDOWN_TYPE_KEYS[r.breakdown_type];
                                const normalized = normalizedKey ? t(normalizedKey) : null;
                                setEditState({ table: "breakdown", id: r.id, floor: r.floor, description: r.description, event_type: normalized ?? (PREDEFINED_TYPES.includes(r.breakdown_type) ? r.breakdown_type : "other"), other_type: normalized ? "" : (PREDEFINED_TYPES.includes(r.breakdown_type) ? "" : r.breakdown_type), email: r.email });
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              title="แก้ไขการแจ้งเหตุ"
                            >
                              <PencilIcon />
                            </button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTable === "breakdown" && !loading && (
              <Pagination currentPage={pageBreakdown} totalPages={totalPagesBreakdown} onPageChange={setPageBreakdown} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
