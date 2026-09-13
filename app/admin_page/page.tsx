"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useStaffSession } from "@/lib/useStaffSession";
import { useLanguage, translate, Language } from "@/lib/LanguageContext";
import Pagination from "@/components/Pagination";
import FloorFilterDropdown from "@/components/FloorFilterDropdown";
import BarChart, { BarChartDatum, BarSeriesDef } from "@/components/BarChart";
import DateRangeDropdown, { DateRange } from "@/components/DateRangeDropdown";
import ReportButtonDropdown from "@/components/ReportButtonDropdown";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EMERGENCY_CANONICAL_TYPES = ["เป็นลม", "อุบัติเหตุร้ายแรง", "ทะเลาะวิวาท", "พบโจร", "โดนล่วงละเมิด", "สัตว์มีพิษกัด"];

const STATUS_KEY: Record<string, string> = {
  Waiting: "status_waiting", "In Process": "status_in_process", Success: "status_success", Failed: "status_failed",
};

interface EmergencyRow {
  id: string;
  created_at: string;
  emergency_type: string;
  floor: string;
  description: string;
  email: string;
  status: string;
  photo_url: string | null;
  finish_at: string | null;
  remark: string | null;
}

interface BreakdownRow {
  id: string;
  created_at: string;
  breakdown_type: string;
  floor: string;
  description: string;
  email: string;
  status: string;
  photo_url: string | null;
  finish_at: string | null;
  remark: string | null;
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

const ALL_STATUSES = ["Waiting", "In Process", "Success", "Failed"];

function filterByRange<T extends { created_at: string }>(rows: T[], range: DateRange): T[] {
  if (range === "all") return rows;
  if (range === "today") {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return rows.filter(r => new Date(r.created_at).getTime() >= start.getTime());
  }
  const days = range === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return rows.filter(r => new Date(r.created_at).getTime() >= cutoff);
}

function CategoryBarChartCard({ title, data, color, range, setRange, translator, embedded = false }: {
  title: string;
  data: BarChartDatum[];
  color: string;
  range: DateRange;
  setRange: (r: DateRange) => void;
  translator: (k: string) => string;
  embedded?: boolean;
}) {
  return (
    <div className={embedded ? "p-4" : "p-5"}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className={`font-semibold text-slate-800 ${embedded ? "text-xs uppercase tracking-wide text-slate-500" : "text-sm"}`}>{title}</h3>
        <DateRangeDropdown value={range} onChange={setRange} translator={translator} />
      </div>
      <BarChart data={data} series={[{ key: "count", label: title, color }]} emptyLabel={translator("report_no_data")} />
    </div>
  );
}

function StatusCompareChartCard({ data, range, setRange, statuses, setStatuses, translator, embedded = false }: {
  data: BarChartDatum[];
  range: DateRange;
  setRange: (r: DateRange) => void;
  statuses: string[];
  setStatuses: (s: string[]) => void;
  translator: (k: string) => string;
  embedded?: boolean;
}) {
  const series: BarSeriesDef[] = [
    { key: "emergency", label: translator("btn_emergency"), color: "#ef4444" },
    { key: "breakdown", label: translator("btn_breakdown"), color: "#10b981" },
  ];
  const toggle = (s: string) => setStatuses(statuses.includes(s) ? statuses.filter(x => x !== s) : [...statuses, s]);

  return (
    <div className={embedded ? "bg-slate-50 rounded-xl p-4 mb-4" : "bg-white rounded-2xl border border-slate-200 shadow-md p-5 mb-6 animate-fadeInUp"}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {ALL_STATUSES.map(s => (
            <label key={s} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statuses.includes(s)}
                onChange={() => toggle(s)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 cursor-pointer"
              />
              {translator(STATUS_KEY[s])}
            </label>
          ))}
        </div>
        <DateRangeDropdown value={range} onChange={setRange} translator={translator} />
      </div>
      <BarChart data={data} series={series} emptyLabel={translator("report_no_data")} />
    </div>
  );
}

type EditState = {
  table: "emergency" | "breakdown";
  id: string;
  floor: string;
  description: string;
  event_type: string;
  other_type: string;
  email: string;
  status: string;
  original_status: string;
  remark: string;
  original_remark: string;
} | null;

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

export default function AdminPage() {
  const { t } = useLanguage();
  const role = useStaffSession();
  const isAdmin = role === "admin" || role === "superadmin";
  const [activeTab, setActiveTab] = useState<ActiveTab>("emergency");
  const [emergencyRows, setEmergencyRows] = useState<EmergencyRow[]>([]);
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [photoModal, setPhotoModal] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pageEmergency, setPageEmergency] = useState(1);
  const [pageBreakdown, setPageBreakdown] = useState(1);
  const [floorFilterEmergency, setFloorFilterEmergency] = useState("");
  const [floorFilterBreakdown, setFloorFilterBreakdown] = useState("");
  const ROWS_PER_PAGE = 10;
  const [showReport, setShowReport] = useState(false);
  const [reportLang, setReportLang] = useState<Language>("en");
  const [range1, setRange1] = useState<DateRange>("all");
  const [range2, setRange2] = useState<DateRange>("all");
  const [range3, setRange3] = useState<DateRange>("all");
  const [range4, setRange4] = useState<DateRange>("all");
  const [range5, setRange5] = useState<DateRange>("all");
  const [chart1Statuses, setChart1Statuses] = useState<string[]>(ALL_STATUSES);
  const rt = (key: string) => translate(reportLang, key);

  const fetchEmergency = useCallback(async () => {
    const { data, error } = await supabase
      .from("emergency_data")
      .select("id, created_at, emergency_type, floor, description, email, status, photo_url, finish_at, remark")
      .order("created_at", { ascending: false });
    if (!error && data) setEmergencyRows(data as EmergencyRow[]);
  }, []);

  const fetchBreakdown = useCallback(async () => {
    const { data, error } = await supabase
      .from("breakdown_data")
      .select("id, created_at, breakdown_type, floor, description, email, status, photo_url, finish_at, remark")
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

  const notifyStatusChange = (table: string, id: string, old_status: string, new_status: string, remark?: string) => {
    fetch("/api/notify_status_change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id, old_status, new_status, remark }),
    }).catch(e => console.error("notify error:", e));
  };

  // Admin quick-action: dispatch a waiting report (Waiting -> In Process)
  const acceptEmergency = async (id: string) => {
    setUpdating(id);
    await supabase.from("emergency_data").update({ status: "In Process" }).eq("id", id);
    notifyStatusChange("emergency_data", id, "Waiting", "In Process");
    await fetchEmergency();
    setUpdating(null);
  };

  const acceptBreakdown = async (id: string) => {
    setUpdating(id);
    await supabase.from("breakdown_data").update({ status: "In Process" }).eq("id", id);
    notifyStatusChange("breakdown_data", id, "Waiting", "In Process");
    await fetchBreakdown();
    setUpdating(null);
  };

  // Operator quick-action: resolve a report (-> Success / Failed)
  const updateEmergencyStatus = async (id: string, status: string) => {
    setUpdating(id);
    const row = emergencyRows.find(r => r.id === id);
    await supabase.from("emergency_data").update({ status }).eq("id", id);
    if (row) notifyStatusChange("emergency_data", id, row.status, status);
    await fetchEmergency();
    setUpdating(null);
  };

  const updateBreakdownStatus = async (id: string, status: string) => {
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
        remark: editState.remark,
      }).eq("id", editState.id);
      await fetchEmergency();
    } else {
      await supabase.from("breakdown_data").update({
        breakdown_type: editState.event_type === "other" ? editState.other_type : editState.event_type,
        floor: editState.floor,
        description: editState.description,
        status: editState.status,
        remark: editState.remark,
      }).eq("id", editState.id);
      await fetchBreakdown();
    }
    // Notify if the status and/or the staff remark changed
    if (editState.status !== editState.original_status || editState.remark !== editState.original_remark) {
      const tbl = editState.table === "emergency" ? "emergency_data" : "breakdown_data";
      notifyStatusChange(tbl, editState.id, editState.original_status, editState.status, editState.remark);
    }
    setSaving(false);
    setEditState(null);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const eData = emergencyRows.map((r) => ({
      [rt("th_no")]: r.id, [rt("th_timestamp")]: formatTimestamp(r.created_at),
      [rt("th_floor")]: displayFloor(r.floor, rt), [rt("th_description")]: r.description,
      [rt("th_email")]: r.email, [rt("th_status")]: rt(STATUS_KEY[r.status] ?? r.status),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eData), rt("btn_emergency").slice(0, 31));
    const bData = breakdownRows.map((r) => ({
      [rt("th_no")]: r.id, [rt("th_timestamp")]: formatTimestamp(r.created_at), [rt("th_type")]: r.breakdown_type,
      [rt("th_floor")]: displayFloor(r.floor, rt), [rt("th_description")]: r.description,
      [rt("th_email")]: r.email, [rt("th_status")]: rt(STATUS_KEY[r.status] ?? r.status),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bData), rt("btn_breakdown").slice(0, 31));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { [rt("th_type")]: rt("btn_emergency"), [rt("status_waiting")]: waitingEmergency, [rt("status_in_process")]: inProcessEmergency, [rt("status_success")]: successEmergency, [rt("status_failed")]: failedEmergency, [rt("th_total")]: totalEmergency },
      { [rt("th_type")]: rt("btn_breakdown"), [rt("status_waiting")]: waitingBreakdown, [rt("status_in_process")]: inProcessBreakdown, [rt("status_success")]: successBreakdown, [rt("status_failed")]: failedBreakdown, [rt("th_total")]: totalBreakdown },
    ]), rt("report_summary_sheet").slice(0, 31));
    XLSX.writeFile(wb, `report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

    const hexToRgb = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];

    const makePieCanvas = (data: [string, number][]): string => {
      const size = 200;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const total = data.reduce((s, [, n]) => s + n, 0);
      if (total === 0) return canvas.toDataURL();
      const cx = size / 2, cy = size / 2, r = size / 2 - 4;
      let ang = -Math.PI / 2;
      data.forEach(([, value], i) => {
        const sweep = (value / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, ang, ang + sweep);
        ctx.closePath();
        ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ang += sweep;
      });
      return canvas.toDataURL("image/png");
    };

    const floorLabel = (f: string) => /^\d+$/.test(f) ? `Floor ${f}` : f;
    const eTypeMap: Record<string, string> = {
      "เป็นลม": "Fainting", "อุบัติเหตุร้ายแรง": "Accident",
      "ทะเลาะวิวาท": "Fighting", "พบโจร": "Robbery",
      "โดนล่วงละเมิด": "Harassment", "สัตว์มีพิษกัด": "Animal Bite",
    };
    const bTypeMap: Record<string, string> = {
      "ระบบไฟฟ้า": "Electrical", "ระบบประปา": "Plumbing",
      "ระบบปรับอากาศ": "A/C", "ลิฟต์": "Elevator",
      "อินเทอร์เน็ต/เครือข่าย": "Internet", "อุปกรณ์": "Equipment",
    };
    const countBy = (labels: string[]): [string, number][] =>
      Object.entries(labels.reduce((acc, l) => { acc[l] = (acc[l] || 0) + 1; return acc; }, {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1]).slice(0, 6);

    const pdfFloorsE = countBy(emergencyRows.map(r => floorLabel(r.floor)));
    const pdfFloorsB = countBy(breakdownRows.map(r => floorLabel(r.floor)));
    const pdfTypesE = countBy(emergencyRows.filter(r => r.emergency_type).map(r => eTypeMap[r.emergency_type] ?? r.emergency_type));
    const pdfTypesB = countBy(breakdownRows.filter(r => r.breakdown_type).map(r => bTypeMap[r.breakdown_type] ?? r.breakdown_type));

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    doc.setFontSize(16); doc.text("Emergency & Breakdown Report", 14, 18);
    doc.setFontSize(9); doc.setTextColor(120); doc.text(`Generated: ${date}`, 14, 25); doc.setTextColor(0);
    doc.setFontSize(12); doc.text("Summary", 14, 35);
    autoTable(doc, {
      startY: 40,
      head: [["Type", "Waiting", "In Process", "Success", "Failed", "Total"]],
      body: [
        ["Emergency", waitingEmergency, inProcessEmergency, successEmergency, failedEmergency, totalEmergency],
        ["Breakdown", waitingBreakdown, inProcessBreakdown, successBreakdown, failedBreakdown, totalBreakdown],
      ],
      styles: { fontSize: 9 }, headStyles: { fillColor: [30, 41, 59] },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let y = (doc as any).lastAutoTable.finalY + 12;
    if (y + 130 > 270) { doc.addPage(); y = 14; }

    const charts: { title: string; data: [string, number][] }[] = [
      { title: "Top Floors — Emergency", data: pdfFloorsE },
      { title: "Top Floors — Breakdown", data: pdfFloorsB },
      { title: "Top Emergency Types", data: pdfTypesE },
      { title: "Top Breakdown Types", data: pdfTypesB },
    ];
    const imgW = 40, imgH = 40, colW = 95;
    charts.forEach((chart, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = 14 + col * colW;
      const by = y + row * 65;

      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(60);
      doc.text(chart.title, bx, by);
      doc.setFont("helvetica", "normal");

      if (chart.data.length === 0) {
        doc.setFontSize(7); doc.setTextColor(150); doc.text("No data", bx, by + 10); doc.setTextColor(0);
        return;
      }

      doc.addImage(makePieCanvas(chart.data), "PNG", bx, by + 3, imgW, imgH);

      const total = chart.data.reduce((s, [, n]) => s + n, 0);
      chart.data.forEach(([label, value], i) => {
        const lx = bx + imgW + 3, ly = by + 9 + i * 8;
        const [r, g, b] = hexToRgb(PIE_COLORS[i % PIE_COLORS.length]);
        doc.setFillColor(r, g, b);
        doc.rect(lx, ly - 3, 3, 3, "F");
        doc.setFontSize(6.5); doc.setTextColor(60);
        doc.text(`${label}: ${value} (${Math.round((value / total) * 100)}%)`, lx + 4.5, ly);
      });
      doc.setTextColor(0);
    });

    doc.addPage();
    doc.setFontSize(12); doc.text("Emergency Reports", 14, 18);
    autoTable(doc, {
      startY: 23,
      head: [["#", "Timestamp", "Floor", "Description", "Email", "Status"]],
      body: emergencyRows.map((r, i) => [i + 1, formatTimestamp(r.created_at), displayFloor(r.floor, t), r.description, r.email, r.status]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [220, 38, 38] },
      columnStyles: { 3: { cellWidth: 50 } },
    });

    doc.addPage();
    doc.setFontSize(12); doc.text("Breakdown Reports", 14, 18);
    autoTable(doc, {
      startY: 23,
      head: [["#", "Timestamp", "Type", "Floor", "Description", "Email", "Status"]],
      body: breakdownRows.map((r, i) => [i + 1, formatTimestamp(r.created_at), r.breakdown_type, displayFloor(r.floor, t), r.description, r.email, r.status]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [5, 150, 105] },
      columnStyles: { 4: { cellWidth: 45 } },
    });

    doc.save(`report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const totalEmergency = emergencyRows.length;
  const totalBreakdown = breakdownRows.length;
  const waitingEmergency = emergencyRows.filter((r) => r.status === "Waiting").length;
  const waitingBreakdown = breakdownRows.filter((r) => r.status === "Waiting").length;
  const inProcessEmergency = emergencyRows.filter((r) => r.status === "In Process").length;
  const inProcessBreakdown = breakdownRows.filter((r) => r.status === "In Process").length;
  const successEmergency = emergencyRows.filter((r) => r.status === "Success").length;
  const successBreakdown = breakdownRows.filter((r) => r.status === "Success").length;
  const failedEmergency = emergencyRows.filter((r) => r.status === "Failed").length;
  const failedBreakdown = breakdownRows.filter((r) => r.status === "Failed").length;

  const buildTopFloors = (rows: { floor: string }[], translator: (k: string) => string) =>
    Object.entries(
      rows.reduce((acc, r) => {
        const fl = displayFloor(r.floor, translator); acc[fl] = (acc[fl] || 0) + 1; return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const buildTopEmergencyTypes = (rows: EmergencyRow[], translator: (k: string) => string) =>
    Object.entries(
      rows.reduce((acc, r) => {
        if (!r.emergency_type) return acc;
        const label = displayEmergencyType(r.emergency_type, translator);
        acc[label] = (acc[label] || 0) + 1; return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const buildTopTypes = (rows: BreakdownRow[]) =>
    Object.entries(
      rows.reduce((acc, r) => {
        acc[r.breakdown_type] = (acc[r.breakdown_type] || 0) + 1; return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const topTypes = buildTopTypes(breakdownRows);

  const topFloorsEmergencyRpt = buildTopFloors(emergencyRows, rt);
  const topFloorsBreakdownRpt = buildTopFloors(breakdownRows, rt);
  const topEmergencyTypesRpt = buildTopEmergencyTypes(emergencyRows, rt);

  const sortFloors = (floors: string[]) => Array.from(new Set(floors)).sort((a, b) => {
    const na = Number(a), nb = Number(b);
    const aNum = /^\d+$/.test(a), bNum = /^\d+$/.test(b);
    if (aNum && bNum) return na - nb;
    if (aNum !== bNum) return aNum ? -1 : 1;
    return a.localeCompare(b);
  });

  const floorOptionsEmergency = sortFloors(emergencyRows.map(r => r.floor));
  const floorOptionsBreakdown = sortFloors(breakdownRows.map(r => r.floor));

  const buildChart1Data = (translator: (k: string) => string) => {
    const eRows = filterByRange(emergencyRows, range1);
    const bRows = filterByRange(breakdownRows, range1);
    return ALL_STATUSES.filter(s => chart1Statuses.includes(s)).map(status => ({
      label: translator(STATUS_KEY[status]),
      emergency: eRows.filter(r => r.status === status).length,
      breakdown: bRows.filter(r => r.status === status).length,
    }));
  };

  const buildChart2Data = (translator: (k: string) => string) => {
    const rows = filterByRange(breakdownRows, range2);
    return sortFloors(rows.map(r => r.floor)).map(floor => ({
      label: displayFloor(floor, translator),
      count: rows.filter(r => r.floor === floor).length,
    }));
  };

  const buildChart3Data = () => {
    const rows = filterByRange(breakdownRows, range3);
    const types = Array.from(new Set(rows.map(r => r.breakdown_type).filter(Boolean)));
    return types.map(tp => ({ label: tp, count: rows.filter(r => r.breakdown_type === tp).length }));
  };

  const buildChart4Data = (translator: (k: string) => string) => {
    const rows = filterByRange(emergencyRows, range4);
    return sortFloors(rows.map(r => r.floor)).map(floor => ({
      label: displayFloor(floor, translator),
      count: rows.filter(r => r.floor === floor).length,
    }));
  };

  const buildChart5Data = (translator: (k: string) => string) => {
    const rows = filterByRange(emergencyRows, range5);
    const types = Array.from(new Set(rows.map(r => r.emergency_type).filter(Boolean)));
    return types.map(tp => ({ label: displayEmergencyType(tp, translator), count: rows.filter(r => r.emergency_type === tp).length }));
  };

  const filteredEmergencyRows = floorFilterEmergency ? emergencyRows.filter(r => r.floor === floorFilterEmergency) : emergencyRows;
  const filteredBreakdownRows = floorFilterBreakdown ? breakdownRows.filter(r => r.floor === floorFilterBreakdown) : breakdownRows;

  const totalPagesEmergency = Math.max(1, Math.ceil(filteredEmergencyRows.length / ROWS_PER_PAGE));
  const totalPagesBreakdown = Math.max(1, Math.ceil(filteredBreakdownRows.length / ROWS_PER_PAGE));
  const pagedEmergency = filteredEmergencyRows.slice((pageEmergency - 1) * ROWS_PER_PAGE, pageEmergency * ROWS_PER_PAGE);
  const pagedBreakdown = filteredBreakdownRows.slice((pageBreakdown - 1) * ROWS_PER_PAGE, pageBreakdown * ROWS_PER_PAGE);

  const thCls = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap";
  const tdCls = "px-4 py-3 text-sm text-slate-700";

  // Column counts for loading/empty colSpan — mirrors which <th> are actually rendered below
  const emergencyCols = (isAdmin ? 11 : 10) + 1; // no,timestamp,type,floor,description,[email],photo,status,finished,action,edit,remark
  const breakdownCols = (isAdmin ? 11 : 9) + 1; // admin: no,timestamp,type,floor,description,email,photo,status,finished,action,edit,remark — operator: no,timestamp,floor,description,photo,status,finished,action,edit,remark

  function OperatorActionButtons({ id, currentStatus, onUpdate }: {
    id: string;
    currentStatus: string;
    onUpdate: (id: string, status: string) => void;
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

  if (!role) return null;

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
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-5 sm:p-6 space-y-5">
                {/* Emergency Type */}
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
                {/* Breakdown Type */}
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("th_remark")}</label>
                  <textarea rows={3} className={iCls} placeholder={t("remark_placeholder")} value={editState.remark} onChange={e => setEditState({ ...editState, remark: e.target.value })} />
                </div>
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 mt-2">
                  {/* Delete button with inline confirmation */}
                  {!confirmingDelete ? (
                    <button type="button" onClick={() => setConfirmingDelete(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t("btn_delete")}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleDelete} disabled={deleting}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50">
                        {deleting ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        {t("btn_confirm_delete")}
                      </button>
                      <button type="button" onClick={() => setConfirmingDelete(false)} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1">
                        {t("btn_cancel")}
                      </button>
                    </div>
                  )}
                  {/* Save/Cancel */}
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
      <div className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {t(isAdmin ? "admin_dashboard" : "operator_dashboard")}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">40 Building · KMUTNB</p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <ReportButtonDropdown
                  active={showReport}
                  onClose={() => setShowReport(false)}
                  onSelect={(lang) => { setReportLang(lang); setShowReport(true); }}
                  label={t("btn_show_report")}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 animate-fadeInUp">
          <StatCard label={t("stat_total_emergency")} value={totalEmergency} color="border-red-500" />
          <StatCard label={t("stat_total_breakdown")} value={totalBreakdown} color="border-emerald-500" />
          {isAdmin ? (
            <>
              <StatCard label={t("stat_waiting_emergency")} value={waitingEmergency} color="border-amber-400" />
              <StatCard label={t("stat_waiting_breakdown")} value={waitingBreakdown} color="border-amber-400" />
              <StatCard label={t("stat_in_process_emergency")} value={inProcessEmergency} color="border-blue-500" />
              <StatCard label={t("stat_in_process_breakdown")} value={inProcessBreakdown} color="border-blue-500" />
            </>
          ) : (
            <>
              <StatCard label={t("stat_in_process_emergency")} value={inProcessEmergency} color="border-blue-500" />
              <StatCard label={t("stat_in_process_breakdown")} value={inProcessBreakdown} color="border-blue-500" />
              <StatCard label={t("stat_success_emergency")} value={successEmergency} color="border-emerald-400" />
              <StatCard label={t("stat_success_breakdown")} value={successBreakdown} color="border-emerald-400" />
            </>
          )}
        </div>

        {/* Incident Bar Charts — always visible */}
        <StatusCompareChartCard
          data={buildChart1Data(t)}
          range={range1}
          setRange={setRange1}
          statuses={chart1Statuses}
          setStatuses={setChart1Statuses}
          translator={t}
        />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md mb-6 animate-fadeInUp">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <CategoryBarChartCard title={t("chart2_title")} data={buildChart2Data(t)} color="#10b981" range={range2} setRange={setRange2} translator={t} />
            <CategoryBarChartCard title={t("chart3_title")} data={buildChart3Data()} color="#10b981" range={range3} setRange={setRange3} translator={t} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md mb-6 animate-fadeInUp">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <CategoryBarChartCard title={t("chart4_title")} data={buildChart4Data(t)} color="#ef4444" range={range4} setRange={setRange4} translator={t} />
            <CategoryBarChartCard title={t("chart5_title")} data={buildChart5Data(t)} color="#ef4444" range={range5} setRange={setRange5} translator={t} />
          </div>
        </div>

        {/* Report Section — admin only */}
        {isAdmin && showReport && (() => {
          const pct = (n: number, total: number) => total === 0 ? 0 : Math.round((n / total) * 100);
          const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];
          const PieChart = ({ data, colors }: { data: [string, number][]; colors: string[] }) => {
            const total = data.reduce((s, [, n]) => s + n, 0);
            if (total === 0 || data.length === 0) return <p className="text-xs text-slate-400">{rt("report_no_data")}</p>;
            const cx = 50, cy = 50, r = 45;
            if (data.length === 1) return (
              <div className="flex items-start gap-3">
                <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0"><circle cx={cx} cy={cy} r={r} fill={colors[0]} /></svg>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors[0] }} />
                    <span className="text-slate-600 truncate">{data[0][0]}</span>
                    <span className="text-slate-400 ml-auto shrink-0 pl-1">{data[0][1]} (100%)</span>
                  </div>
                </div>
              </div>
            );
            let startAngle = -Math.PI / 2;
            const slices = data.map(([label, value], i) => {
              const angle = (value / total) * 2 * Math.PI;
              const endAngle = startAngle + angle;
              const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
              const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
              const path = `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
              const result = { label, value, path, color: colors[i % colors.length], pct: Math.round((value / total) * 100) };
              startAngle = endAngle;
              return result;
            });
            return (
              <div className="flex items-start gap-3">
                <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
                  {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="1.5" />)}
                </svg>
                <div className="flex-1 min-w-0 space-y-1.5">
                  {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-600 truncate">{s.label}</span>
                      <span className="text-slate-400 ml-auto shrink-0 pl-1">{s.value} ({s.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          };
          const StatusBar = ({ label, count, total, color }: { label: string; count: number; total: number; color: string }) => (
            <div className="mb-2.5">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{label}</span>
                <span className="font-medium">{count} <span className="text-slate-400">({pct(count, total)}%)</span></span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct(count, total)}%` }} />
              </div>
            </div>
          );
          const TopBar = ({ label, count, max }: { label: string; count: number; max: number }) => (
            <div className="mb-2.5">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="truncate pr-2">{label}</span>
                <span className="font-medium shrink-0">{count}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 rounded-full transition-all" style={{ width: `${Math.round((count / max) * 100)}%` }} />
              </div>
            </div>
          );
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowReport(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto custom-scroll animate-fadeInUp" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 sm:p-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {rt("report_title")}
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setReportLang(reportLang === "th" ? "en" : "th")} title={t("btn_change_language")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                    {reportLang === "th" ? "TH" : "EN"}
                  </button>
                  <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-500/20">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {rt("btn_export_excel")}
                  </button>
                  <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-sm shadow-red-500/20">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {rt("btn_export_pdf")}
                  </button>
                  <button onClick={() => setShowReport(false)} title={t("btn_close")} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-5">
              <StatusCompareChartCard
                data={buildChart1Data(rt)}
                range={range1}
                setRange={setRange1}
                statuses={chart1Statuses}
                setStatuses={setChart1Statuses}
                translator={rt}
                embedded
              />
              <div className="bg-slate-50 rounded-xl mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                  <CategoryBarChartCard title={rt("chart2_title")} data={buildChart2Data(rt)} color="#10b981" range={range2} setRange={setRange2} translator={rt} embedded />
                  <CategoryBarChartCard title={rt("chart3_title")} data={buildChart3Data()} color="#10b981" range={range3} setRange={setRange3} translator={rt} embedded />
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                  <CategoryBarChartCard title={rt("chart4_title")} data={buildChart4Data(rt)} color="#ef4444" range={range4} setRange={setRange4} translator={rt} embedded />
                  <CategoryBarChartCard title={rt("chart5_title")} data={buildChart5Data(rt)} color="#ef4444" range={range5} setRange={setRange5} translator={rt} embedded />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{rt("report_emergency_stats")}</p>
                  {totalEmergency === 0 ? <p className="text-xs text-slate-400">{rt("report_no_data")}</p> : <>
                    <StatusBar label={rt("status_waiting")} count={waitingEmergency} total={totalEmergency} color="bg-amber-400" />
                    <StatusBar label={rt("status_in_process")} count={inProcessEmergency} total={totalEmergency} color="bg-blue-400" />
                    <StatusBar label={rt("status_success")} count={successEmergency} total={totalEmergency} color="bg-emerald-500" />
                    <StatusBar label={rt("status_failed")} count={failedEmergency} total={totalEmergency} color="bg-red-500" />
                  </>}
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{rt("report_breakdown_stats")}</p>
                  {totalBreakdown === 0 ? <p className="text-xs text-slate-400">{rt("report_no_data")}</p> : <>
                    <StatusBar label={rt("status_waiting")} count={waitingBreakdown} total={totalBreakdown} color="bg-amber-400" />
                    <StatusBar label={rt("status_in_process")} count={inProcessBreakdown} total={totalBreakdown} color="bg-blue-400" />
                    <StatusBar label={rt("status_success")} count={successBreakdown} total={totalBreakdown} color="bg-emerald-500" />
                    <StatusBar label={rt("status_failed")} count={failedBreakdown} total={totalBreakdown} color="bg-red-500" />
                  </>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pie charts for floors */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{rt("report_top_floors_emergency")}</p>
                  <PieChart data={topFloorsEmergencyRpt} colors={PIE_COLORS} />
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{rt("report_top_floors_breakdown")}</p>
                  <PieChart data={topFloorsBreakdownRpt} colors={PIE_COLORS} />
                </div>
                {/* Bar charts for types */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{rt("report_top_emergency_types")}</p>
                  {topEmergencyTypesRpt.length === 0 ? <p className="text-xs text-slate-400">{rt("report_no_data")}</p>
                    : topEmergencyTypesRpt.map(([tp, cnt]) => <TopBar key={tp} label={tp} count={cnt} max={topEmergencyTypesRpt[0][1]} />)}
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{rt("report_top_types")}</p>
                  {topTypes.length === 0 ? <p className="text-xs text-slate-400">{rt("report_no_data")}</p>
                    : topTypes.map(([tp, cnt]) => <TopBar key={tp} label={tp} count={cnt} max={topTypes[0][1]} />)}
                </div>
              </div>
              </div>
            </div>
            </div>
          );
        })()}

        {/* Tab Selector */}
        <div className="flex gap-1 mb-0 animate-fadeInUp delay-100">
          <button
            onClick={() => { setActiveTab("emergency"); setPageEmergency(1); }}
            className={`px-6 py-2.5 rounded-t-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "emergency"
                ? `bg-white ${isAdmin ? "text-red-600" : "text-indigo-600"} border-t border-x border-slate-200 shadow-sm font-semibold`
                : "bg-slate-200/70 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t("tab_emergency")}
          </button>
          <button
            onClick={() => { setActiveTab("breakdown"); setPageBreakdown(1); }}
            className={`px-6 py-2.5 rounded-t-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "breakdown"
                ? `bg-white ${isAdmin ? "text-emerald-600" : "text-indigo-600"} border-t border-x border-slate-200 shadow-sm font-semibold`
                : "bg-slate-200/70 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t("tab_breakdown")}
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeInUp delay-200 mb-10">
          <div className="overflow-x-auto overflow-y-auto max-h-[440px] custom-scroll">

            {/* Emergency Table */}
            {activeTab === "emergency" && (
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-slate-800">
                  <tr>
                    <th className={thCls}>{t("th_no")}</th>
                    <th className={thCls}>{t("th_timestamp")}</th>
                    <th className={thCls}>{t("emergency_type_label")}</th>
                    <th className={thCls}>
                      <div className="flex items-center gap-1.5">
                        <span>{t("th_floor")}</span>
                        <FloorFilterDropdown
                          floors={floorOptionsEmergency}
                          value={floorFilterEmergency}
                          onChange={f => { setFloorFilterEmergency(f); setPageEmergency(1); }}
                          displayFloor={f => displayFloor(f, t)}
                        />
                      </div>
                    </th>
                    <th className={thCls}>{t("th_description")}</th>
                    {isAdmin && <th className={thCls}>{t("th_email")}</th>}
                    <th className={thCls}>{t("th_photo")}</th>
                    <th className={thCls}>{t("th_status")}</th>
                    <th className={thCls}>{t("th_finished_at")}</th>
                    <th className={thCls}>{t("th_action")}</th>
                    <th className={thCls}>{t("th_remark")}</th>
                    <th className={thCls}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td colSpan={emergencyCols} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin-smooth" />
                          <span className="text-sm text-slate-400">{t("loading")}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && filteredEmergencyRows.length === 0 && (
                    <tr>
                      <td colSpan={emergencyCols} className="py-16 text-center text-sm text-slate-400">{t("no_records")}</td>
                    </tr>
                  )}
                  {!loading && pagedEmergency.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors duration-100">
                      <td className={`${tdCls} text-slate-500 font-mono text-xs whitespace-nowrap`}>{r.id}</td>
                      <td className={`${tdCls} font-mono text-xs text-slate-500 whitespace-nowrap`}>{formatTimestamp(r.created_at)}</td>
                      <td className={tdCls}>
                        {r.emergency_type ? <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">{displayEmergencyType(r.emergency_type, t)}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className={`${tdCls} font-medium whitespace-nowrap`}>{displayFloor(r.floor, t)}</td>
                      <td className={`${tdCls} max-w-xs`}>
                        <span className="line-clamp-2">{r.description}</span>
                      </td>
                      {isAdmin && <td className={`${tdCls} text-xs text-slate-500`}>{r.email}</td>}
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
                        {isAdmin ? (
                          r.status === "Waiting" ? (
                            <button
                              onClick={() => acceptEmergency(r.id)}
                              disabled={updating === r.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
                            >
                              {updating === r.id ? (
                                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin-smooth" />
                              ) : null}
                              {updating === r.id ? "..." : t("btn_accept")}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )
                        ) : (
                          <OperatorActionButtons id={r.id} currentStatus={r.status} onUpdate={updateEmergencyStatus} />
                        )}
                      </td>
                      <td className={`${tdCls} max-w-xs`}>
                        {r.remark ? <span className="line-clamp-2">{r.remark}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className={tdCls}>
                        <button
                          onClick={() => {
                            const isPredefinedE = EMERGENCY_CANONICAL_TYPES.includes(r.emergency_type || "");
                            setEditState({ table: "emergency", id: r.id, floor: r.floor, description: r.description, event_type: isPredefinedE ? (r.emergency_type || "") : (r.emergency_type ? "other" : ""), other_type: isPredefinedE ? "" : (r.emergency_type || ""), email: r.email, status: r.status, original_status: r.status, remark: r.remark ?? "", original_remark: r.remark ?? "" });
                          }}
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
                    {isAdmin && <th className={thCls}>{t("th_type")}</th>}
                    <th className={thCls}>
                      <div className="flex items-center gap-1.5">
                        <span>{t("th_floor")}</span>
                        <FloorFilterDropdown
                          floors={floorOptionsBreakdown}
                          value={floorFilterBreakdown}
                          onChange={f => { setFloorFilterBreakdown(f); setPageBreakdown(1); }}
                          displayFloor={f => displayFloor(f, t)}
                        />
                      </div>
                    </th>
                    <th className={thCls}>{t("th_description")}</th>
                    {isAdmin && <th className={thCls}>{t("th_email")}</th>}
                    <th className={thCls}>{t("th_photo")}</th>
                    <th className={thCls}>{t("th_status")}</th>
                    <th className={thCls}>{t("th_finished_at")}</th>
                    <th className={thCls}>{t("th_action")}</th>
                    <th className={thCls}>{t("th_remark")}</th>
                    <th className={thCls}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td colSpan={breakdownCols} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin-smooth" />
                          <span className="text-sm text-slate-400">{t("loading")}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && filteredBreakdownRows.length === 0 && (
                    <tr>
                      <td colSpan={breakdownCols} className="py-16 text-center text-sm text-slate-400">{t("no_records")}</td>
                    </tr>
                  )}
                  {!loading && pagedBreakdown.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors duration-100">
                      <td className={`${tdCls} text-slate-500 font-mono text-xs whitespace-nowrap`}>{r.id}</td>
                      <td className={`${tdCls} font-mono text-xs text-slate-500 whitespace-nowrap`}>{formatTimestamp(r.created_at)}</td>
                      {isAdmin && (
                        <td className={tdCls}>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{r.breakdown_type}</span>
                        </td>
                      )}
                      <td className={`${tdCls} font-medium whitespace-nowrap`}>{displayFloor(r.floor, t)}</td>
                      <td className={`${tdCls} max-w-xs`}>
                        <span className="line-clamp-2">{r.description}</span>
                      </td>
                      {isAdmin && <td className={`${tdCls} text-xs text-slate-500`}>{r.email}</td>}
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
                        {isAdmin ? (
                          r.status === "Waiting" ? (
                            <button
                              onClick={() => acceptBreakdown(r.id)}
                              disabled={updating === r.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
                            >
                              {updating === r.id ? (
                                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin-smooth" />
                              ) : null}
                              {updating === r.id ? "..." : t("btn_accept")}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )
                        ) : (
                          <OperatorActionButtons id={r.id} currentStatus={r.status} onUpdate={updateBreakdownStatus} />
                        )}
                      </td>
                      <td className={`${tdCls} max-w-xs`}>
                        {r.remark ? <span className="line-clamp-2">{r.remark}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className={tdCls}>
                        <button
                          onClick={() => {
                            const normalizedKey = BREAKDOWN_TYPE_KEYS[r.breakdown_type];
                            const normalized = normalizedKey ? t(normalizedKey) : null;
                            setEditState({ table: "breakdown", id: r.id, floor: r.floor, description: r.description, event_type: normalized ?? (PREDEFINED_TYPES.includes(r.breakdown_type) ? r.breakdown_type : "other"), other_type: normalized ? "" : (PREDEFINED_TYPES.includes(r.breakdown_type) ? "" : r.breakdown_type), email: r.email, status: r.status, original_status: r.status, remark: r.remark ?? "", original_remark: r.remark ?? "" });
                          }}
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
