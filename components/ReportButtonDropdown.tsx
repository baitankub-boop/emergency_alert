"use client";

import { useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/LanguageContext";

interface ReportButtonDropdownProps {
  active: boolean;
  onClose: () => void;
  onSelect: (lang: Language) => void;
  label: string;
}

export default function ReportButtonDropdown({ active, onClose, onSelect, label }: ReportButtonDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={wrapRef}>
      <button
        type="button"
        onClick={() => { if (active) { onClose(); } else { setOpen(o => !o); } }}
        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all border ${
          active || open ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
        }`}
      >
        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="whitespace-nowrap">{label}</span>
        {!active && (
          <svg viewBox="0 0 10 6" className={`w-2 h-2 transition-transform duration-200 ${open ? "-rotate-180" : ""}`} fill="currentColor">
            <path d="M0 0L5 6L10 0Z" />
          </svg>
        )}
      </button>

      {open && !active && (
        <div className="absolute z-30 top-full right-0 mt-2 w-40 rounded-xl bg-white shadow-2xl ring-1 ring-black/5 py-1.5 animate-fadeInUp">
          <button
            type="button"
            onClick={() => { onSelect("th"); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="text-base leading-none">🇹🇭</span> ไทย
          </button>
          <button
            type="button"
            onClick={() => { onSelect("en"); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="text-base leading-none">🇬🇧</span> English
          </button>
        </div>
      )}
    </div>
  );
}
