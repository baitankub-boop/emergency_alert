"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useOperatorSession } from "@/lib/useOperatorSession";
import { clearOperatorSession } from "@/lib/operatorSession";
import { useLanguage } from "@/lib/LanguageContext";
import Pagination from "@/components/Pagination";

interface EmergencyRow {
  id: number;
  created_at: string;
  emergency_type: string;
  floor: string;
  description: string;
  email: string;
  status: string;
  photo_url: string | null;
  finish_at: string | null;
}

interface BreakdownRow {
  id: number;
  created_at: string;
  breakdown_type: string;
  floor: string;
  description: string;
  email: string;
  status: string;
  photo_url: string | null;
  finish_at: string | null;
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${color} p-4 shadow-sm`}>
      <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

type EditState = {
  table: "emergency" | "breakdown";
  id: number;
  floor: string;
  description: string;
  event_type: string;
  other_type: string;
  email: string;
  status: string;
  original_status: string;
} | null;

const EMERGENCY_CANONICAL_TYPES = ["เป็นลม", "อุบัติเหตุร้ายแรง", "ทะเลาะวิวาท", "พบโจร", "โดนล่วงละเมิด", "สัตว์มีพิษกัด"];

const BREAKDOWN_TYPE_KEYS: Record<string, string> = {
  "ระบบไฟฟ้า": "type_electricity", "ระบบประปา": "type_plumbing",
  "ระบบปรับอากาศ": "type_ac", "ลิฟต์": "type_elevator",
  "อินเทอร์เน็ต/เครือข่าย": "type_internet", "อุปกรณ์": "type_equipment",
  "Electrical System": "type_electricity", "Plumbing": "type_plumbing",
  "Air Conditioning": "type_ac", "Elevator": "type_elevator",
  "Internet/Network": "type_internet", "Equipment": "type_equipment",
};

const PREDEFINED_TYPES = [
  "Electrical System", "Plumbing", "Air Conditioning", "Elevator", "Internet/Network", "Equipment",
  "ระบบไฟฟ้า", "ระบบประปา", "ระบบปรับอากาศ", "ลิฟต์", "อินเทอร์เน็ต/เครือข่าย", "อุปกรณ์",
];

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

type ActiveTab = "emergency" | "breakdown";

export default function OperatorPage() {
  const router = useRouter();
  const { t } = useLanguage();
  useOperatorSession();
  const [activeTab, setActiveTab] = useState<ActiveTab>("emergency");
  const [emergencyRows, setEmergencyRows] = useState<EmergencyRow[]>([]);
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [photoModal, setPhotoModal] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pageEmergency, setPageEmergency] = useState(1);
  const [pageBreakdown, setPageBreakdown] = useState(1);
  const ROWS_PER_PAGE = 10;
  const [operatorMenuOpen, setOperatorMenuOpen] = useState(false);

  const fetchEmergency = useCallback(async () => {
    const { data, error } = await supabase
      .from("emergency_data")
      .select("id, created_at, emergency_type, floor, description, email, status, photo_url, finish_at")
      .order("created_at", { ascending: false });
    if (!error && data) setEmergencyRows(data as EmergencyRow[]);
  }, []);

  const fetchBreakdown = useCallback(async () => {
    const { data, error } = await supabase
      .from("breakdown_data")
      .select("id, created_at, breakdown_type, floor, description, email, status, photo_url, finish_at")
      .order("created_at", { ascending: false });
    if (!error && data) setBreakdownRows(data as BreakdownRow[]);
  }, []);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([fetchEmergency(), fetchBreakdown()]);
      setLoading(false);
    }
    loadAll();
  }, [fetchEmergency, fetchBreakdown]);

  const notifyStatusChange = (table: string, id: number, old_status: string, new_status: string) => {
    fetch("/api/notify_status_change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id, old_status, new_status }),
    }).catch(e => console.error("notify error:", e));
  };

  const updateEmergencyStatus = async (id: number, status: string) => {
    setUpdating(id);
    const row = emergencyRows.find(r => r.id === id);
    await supabase.from("emergency_data").update({ status }).eq("id", id);
    if (row) notifyStatusChange("emergency_data", id, row.status, status);
    await fetchEmergency();
    setUpdating(null);
  };

  const updateBreakdownStatus = async (id: number, status: string) => {
    setUpdating(id);
    const row = breakdownRows.find(r => r.id === id);
    await supabase.from("breakdown_data").update({ status }).eq("id", id);
    if (row) notifyStatusChange("breakdown_data", id, row.status, status);
    await fetchBreakdown();
    setUpdating(null);
  };

  const handleDelete = async () => {
    if (!editState) return;
    setDeleting(true);
    if (editState.table === "emergency") {
      await supabase.from("emergency_data").delete().eq("id", editState.id);
      await fetchEmergency();
    } else {
      await supabase.from("breakdown_data").delete().eq("id", editState.id);
      await fetchBreakdown();
    }
    setDeleting(false);
    setEditState(null);
    setConfirmingDelete(false);
  };

  const handleSaveEdit = async () => {
    if (!editState) return;
    setSaving(true);
    if (editState.table === "emergency") {
      await supabase.from("emergency_data").update({
        emergency_type: editState.event_type === "other" ? editState.other_type : editState.event_type,
        floor: editState.floor,
        description: editState.description,
        status: editState.status,
      }).eq("id", editState.id);
      await fetchEmergency();
    } else {
      await supabase.from("breakdown_data").update({
        breakdown_type: editState.event_type === "other" ? editState.other_type : editState.event_type,
        floor: editState.floor,
        description: editState.description,
        status: editState.status,
      }).eq("id", editState.id);
      await fetchBreakdown();
    }
    if (editState.status !== editState.original_status) {
      const tbl = editState.table === "emergency" ? "emergency_data" : "breakdown_data";
      notifyStatusChange(tbl, editState.id, editState.original_status, editState.status);
    }
    setSaving(false);
    setEditState(null);
  };

  const handleLogout = () => {
    clearOperatorSession();
    router.push("/operator_login");
  };

  const totalEmergency = emergencyRows.length;
  const totalBreakdown = breakdownRows.length;
  const inProcessEmergency = emergencyRows.filter((r) => r.status === "In Process").length;
  const inProcessBreakdown = breakdownRows.filter((r) => r.status === "In Process").length;
  const successEmergency = emergencyRows.filter((r) => r.status === "Success").length;
  const successBreakdown = breakdownRows.filter((r) => r.status === "Success").length;

  const totalPagesEmergency = Math.max(1, Math.ceil(emergencyRows.length / ROWS_PER_PAGE));
  const totalPagesBreakdown = Math.max(1, Math.ceil(breakdownRows.length / ROWS_PER_PAGE));
  const pagedEmergency = emergencyRows.slice((pageEmergency - 1) * ROWS_PER_PAGE, pageEmergency * ROWS_PER_PAGE);
  const pagedBreakdown = breakdownRows.slice((pageBreakdown - 1) * ROWS_PER_PAGE, pageBreakdown * ROWS_PER_PAGE);

  const thCls = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap";
  const tdCls = "px-4 py-3 text-sm text-slate-700";

  function ActionButtons({ id, currentStatus, onUpdate }: {
    id: number;
    currentStatus: string;
    onUpdate: (id: number, status: string) => void;
  }) {
    const isUpdating = updating === id;
    const isFinalized = currentStatus === "Success" || currentStatus === "Failed";

    if (isFinalized) {
      return <span className="text-slate-300 text-sm">—</span>;
    }

    if (isUpdating) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-medium border border-slate-200">
          <span className="w-2.5 h-2.5 border border-slate-300 border-t-indigo-400 rounded-full animate-spin-smooth" />
          {t("updating")}
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1.5">
        <button
          onClick={() => onUpdate(id, "Success")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-150"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {t("status_success")}
        </button>
        <button
          onClick={() => onUpdate(id, "Failed")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-150"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {t("status_failed")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Edit Modal */}
      {editState && (() => {
        const isBreakdown = editState.table === "breakdown";
        const headerCls = isBreakdown ? "bg-gradient-to-r from-emerald-600 to-teal-500" : "bg-gradient-to-r from-red-600 to-red-500";
        const ringCls = isBreakdown ? "focus:ring-emerald-400/50 focus:border-emerald-400" : "focus:ring-red-400/50 focus:border-red-400";
        const iCls = `w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 ${ringCls} transition-all duration-200`;
        const floorOptions = Array.from({ length: 12 }, (_, i) => ({ value: `${i + 1}`, label: `${t("floor")} ${i + 1}` }));
        const floorMatches = floorOptions.some(f => f.value === editState.floor);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditState(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className={`${headerCls} px-6 py-4 flex items-center justify-between`}>
                <h3 className="text-white font-semibold text-sm tracking-wide">
                  {t(isBreakdown ? "edit_breakdown_title" : "edit_emergency_title")}
                </h3>
                <button onClick={() => setEditState(null)} className="text-white/70 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-5 sm:p-6 space-y-5">
                {!isBreakdown && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("emergency_type_label")} <span className="text-red-500">*</span></label>
                    <select className={iCls} value={editState.event_type} onChange={e => setEditState({ ...editState, event_type: e.target.value })}>
                      <option value="">{t("emergency_select_type")}</option>
                      {EMERGENCY_CANONICAL_TYPES.map(v => {
                        const keyMap: Record<string, string> = { "เป็นลม": "emergency_type_fainting", "อุบัติเหตุร้ายแรง": "emergency_type_accident", "ทะเลาะวิวาท": "emergency_type_fighting", "พบโจร": "emergency_type_robbery", "โดนล่วงละเมิด": "emergency_type_harassment", "สัตว์มีพิษกัด": "emergency_type_animal" };
                        return <option key={v} value={v}>{t(keyMap[v])}</option>;
                      })}
                      <option value="other">{t("type_other")}</option>
                    </select>
                    {editState.event_type === "other" && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("other_type_label")} <span className="text-red-500">*</span></label>
                        <input type="text" className={iCls} placeholder={t("other_type_placeholder")} value={editState.other_type} onChange={e => setEditState({ ...editState, other_type: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}
                {isBreakdown && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("breakdown_type_label")} <span className="text-red-500">*</span></label>
                    <select className={iCls} value={editState.event_type} onChange={e => setEditState({ ...editState, event_type: e.target.value })}>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("other_type_label")} <span className="text-red-500">*</span></label>
                        <input type="text" className={iCls} placeholder={t("other_type_placeholder")} value={editState.other_type} onChange={e => setEditState({ ...editState, other_type: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(isBreakdown ? "breakdown_floor_label" : "emergency_floor_label")} <span className="text-red-500">*</span></label>
                  <select className={iCls} value={editState.floor} onChange={e => setEditState({ ...editState, floor: e.target.value })}>
                    <option value="">{t("select_floor")}</option>
                    {!floorMatches && editState.floor && <option value={editState.floor}>{editState.floor}</option>}
                    {floorOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(isBreakdown ? "breakdown_desc_label" : "emergency_desc_label")} <span className="text-red-500">*</span></label>
                  <textarea rows={4} className={iCls} placeholder={t(isBreakdown ? "breakdown_desc_placeholder" : "emergency_desc_placeholder")} value={editState.description} onChange={e => setEditState({ ...editState, description: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(isBreakdown ? "breakdown_email_label" : "emergency_email_label")}</label>
                  <input type="email" className={`${iCls} bg-slate-50 text-slate-500`} value={editState.email} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("status_label")} <span className="text-red-500">*</span></label>
                  <select className={iCls} value={editState.status} onChange={e => setEditState({ ...editState, status: e.target.value })}>
                    <option value="Waiting">{t("status_waiting")}</option>
                    <option value="In Process">{t("status_in_process")}</option>
                    <option value="Success">{t("status_success")}</option>
                    <option value="Failed">{t("status_failed")}</option>
                  </select>
                </div>
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
                    <button type="button" onClick={handleSaveEdit} disabled={saving} className={`py-2.5 px-4 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2 ${isBreakdown ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600" : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"}`}>
                      {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t("btn_saving")}</> : t("btn_save")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Photo Modal */}
      {photoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPhotoModal(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPhotoModal(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t("btn_close")}
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoModal}
              alt="report photo"
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-700/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-white leading-tight">{t("operator_dashboard")}</h1>
              <p className="text-xs text-slate-400 hidden sm:block">40 Building · KMUTNB</p>
            </div>
            {/* Operator account dropdown */}
            <div className="relative">
              <button
                onClick={() => setOperatorMenuOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:bg-slate-600/60 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-500/40 flex items-center justify-center text-xs font-bold text-white">O</div>
                <span className="text-xs font-medium hidden sm:inline">Operator</span>
                <svg className={`w-3 h-3 transition-transform ${operatorMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {operatorMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-slate-700/50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t("btn_logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {operatorMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setOperatorMenuOpen(false)} />}

      <div className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 animate-fadeInUp">
          <StatCard label={t("stat_total_emergency")} value={totalEmergency} color="border-red-500" />
          <StatCard label={t("stat_total_breakdown")} value={totalBreakdown} color="border-emerald-500" />
          <StatCard label={t("stat_in_process_emergency")} value={inProcessEmergency} color="border-blue-500" />
          <StatCard label={t("stat_in_process_breakdown")} value={inProcessBreakdown} color="border-blue-500" />
          <StatCard label={t("stat_success_emergency")} value={successEmergency} color="border-emerald-400" />
          <StatCard label={t("stat_success_breakdown")} value={successBreakdown} color="border-emerald-400" />
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1 mb-0 animate-fadeInUp delay-100">
          <button
            onClick={() => { setActiveTab("emergency"); setPageEmergency(1); }}
            className={`px-6 py-2.5 rounded-t-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "emergency"
                ? "bg-white text-indigo-600 border-t border-x border-slate-200 shadow-sm font-semibold"
                : "bg-slate-200/70 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t("tab_emergency")}
          </button>
          <button
            onClick={() => { setActiveTab("breakdown"); setPageBreakdown(1); }}
            className={`px-6 py-2.5 rounded-t-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "breakdown"
                ? "bg-white text-indigo-600 border-t border-x border-slate-200 shadow-sm font-semibold"
                : "bg-slate-200/70 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t("tab_breakdown")}
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeInUp delay-200 mb-10">
          <div className="overflow-x-auto overflow-y-auto max-h-[480px] custom-scroll">

            {/* Emergency Table */}
            {activeTab === "emergency" && (
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-slate-800">
                  <tr>
                    <th className={thCls}>{t("th_no")}</th>
                    <th className={thCls}>{t("th_timestamp")}</th>
                    <th className={thCls}>{t("emergency_type_label")}</th>
                    <th className={thCls}>{t("th_floor")}</th>
                    <th className={thCls}>{t("th_description")}</th>
                    <th className={thCls}>{t("th_photo")}</th>
                    <th className={thCls}>{t("th_status")}</th>
                    <th className={thCls}>{t("th_finished_at")}</th>
                    <th className={thCls}>{t("th_action")}</th>
                    <th className={thCls}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin-smooth" />
                          <span className="text-sm text-slate-400">{t("loading")}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && emergencyRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-sm text-slate-400">{t("no_records")}</td>
                    </tr>
                  )}
                  {!loading && pagedEmergency.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors duration-100">
                      <td className={`${tdCls} text-slate-400 w-10`}>{(pageEmergency - 1) * ROWS_PER_PAGE + idx + 1}</td>
                      <td className={`${tdCls} font-mono text-xs text-slate-500 whitespace-nowrap`}>{formatTimestamp(r.created_at)}</td>
                      <td className={tdCls}>
                        {r.emergency_type ? <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">{displayEmergencyType(r.emergency_type, t)}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className={`${tdCls} font-medium whitespace-nowrap`}>{displayFloor(r.floor, t)}</td>
                      <td className={`${tdCls} max-w-xs`}>
                        <span className="line-clamp-2">{r.description}</span>
                      </td>
                      <td className={tdCls}>
                        {r.photo_url ? (
                          <button
                            onClick={() => setPhotoModal(r.photo_url!)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {t("btn_view_photo")}
                          </button>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>
                      <td className={tdCls}><StatusBadge status={r.status} /></td>
                      <td className={`${tdCls} font-mono text-xs text-slate-500 whitespace-nowrap`}>
                        {r.finish_at ? formatTimestamp(r.finish_at) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className={tdCls}>
                        <ActionButtons id={r.id} currentStatus={r.status} onUpdate={updateEmergencyStatus} />
                      </td>
                      <td className={tdCls}>
                        <button
                          onClick={() => { const isPredefinedE = EMERGENCY_CANONICAL_TYPES.includes(r.emergency_type || ""); setEditState({ table: "emergency", id: r.id, floor: r.floor, description: r.description, event_type: isPredefinedE ? (r.emergency_type || "") : (r.emergency_type ? "other" : ""), other_type: isPredefinedE ? "" : (r.emergency_type || ""), email: r.email, status: r.status, original_status: r.status }); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          title="แก้ไข"
                        >
                          <PencilIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === "emergency" && !loading && (
              <Pagination currentPage={pageEmergency} totalPages={totalPagesEmergency} onPageChange={setPageEmergency} />
            )}

            {/* Breakdown Table */}
            {activeTab === "breakdown" && (
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-slate-800">
                  <tr>
                    <th className={thCls}>{t("th_no")}</th>
                    <th className={thCls}>{t("th_timestamp")}</th>
                    <th className={thCls}>{t("th_floor")}</th>
                    <th className={thCls}>{t("th_description")}</th>
                    <th className={thCls}>{t("th_photo")}</th>
                    <th className={thCls}>{t("th_status")}</th>
                    <th className={thCls}>{t("th_finished_at")}</th>
                    <th className={thCls}>{t("th_action")}</th>
                    <th className={thCls}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin-smooth" />
                          <span className="text-sm text-slate-400">{t("loading")}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && breakdownRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-sm text-slate-400">{t("no_records")}</td>
                    </tr>
                  )}
                  {!loading && pagedBreakdown.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors duration-100">
                      <td className={`${tdCls} text-slate-400 w-10`}>{(pageBreakdown - 1) * ROWS_PER_PAGE + idx + 1}</td>
                      <td className={`${tdCls} font-mono text-xs text-slate-500 whitespace-nowrap`}>{formatTimestamp(r.created_at)}</td>
                      <td className={`${tdCls} font-medium whitespace-nowrap`}>{displayFloor(r.floor, t)}</td>
                      <td className={`${tdCls} max-w-xs`}>
                        <span className="line-clamp-2">{r.description}</span>
                      </td>
                      <td className={tdCls}>
                        {r.photo_url ? (
                          <button
                            onClick={() => setPhotoModal(r.photo_url!)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {t("btn_view_photo")}
                          </button>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>
                      <td className={tdCls}><StatusBadge status={r.status} /></td>
                      <td className={`${tdCls} font-mono text-xs text-slate-500 whitespace-nowrap`}>
                        {r.finish_at ? formatTimestamp(r.finish_at) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className={tdCls}>
                        <ActionButtons id={r.id} currentStatus={r.status} onUpdate={updateBreakdownStatus} />
                      </td>
                      <td className={tdCls}>
                        <button
                          onClick={() => { const normalizedKey = BREAKDOWN_TYPE_KEYS[r.breakdown_type]; const normalized = normalizedKey ? t(normalizedKey) : null; setEditState({ table: "breakdown", id: r.id, floor: r.floor, description: r.description, event_type: normalized ?? (PREDEFINED_TYPES.includes(r.breakdown_type) ? r.breakdown_type : "other"), other_type: normalized ? "" : (PREDEFINED_TYPES.includes(r.breakdown_type) ? "" : r.breakdown_type), email: r.email, status: r.status, original_status: r.status }); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          title="แก้ไข"
                        >
                          <PencilIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === "breakdown" && !loading && (
              <Pagination currentPage={pageBreakdown} totalPages={totalPagesBreakdown} onPageChange={setPageBreakdown} />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
