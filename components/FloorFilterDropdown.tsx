"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface FloorFilterDropdownProps {
  floors: string[];
  value: string;
  onChange: (floor: string) => void;
  displayFloor: (floor: string) => string;
}

export default function FloorFilterDropdown({ floors, value, onChange, displayFloor }: FloorFilterDropdownProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const active = value !== "";

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
    <div className="relative inline-block normal-case font-normal" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title={t("filter_by_floor")}
        aria-label={t("filter_by_floor")}
        className={`relative inline-flex items-center justify-center w-5 h-5 rounded-md transition-colors ${
          active ? "text-blue-400" : "text-slate-400 hover:text-white"
        }`}
      >
        <svg viewBox="0 0 10 6" className={`w-2.5 h-2.5 transition-transform duration-200 ${open ? "-rotate-180" : ""}`} fill="currentColor">
          <path d="M0 0L5 6L10 0Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 mt-2 w-44 max-h-72 overflow-y-auto rounded-xl bg-white shadow-2xl ring-1 ring-black/5 py-1.5 text-left animate-fadeInUp custom-scroll">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs transition-colors ${
              value === "" ? "text-indigo-600 font-semibold bg-indigo-50" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t("filter_all_floors")}
            {value === "" && (
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {floors.length > 0 && <div className="h-px bg-slate-100 my-1 mx-2" />}

          {floors.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => { onChange(f); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs transition-colors ${
                value === f ? "text-indigo-600 font-semibold bg-indigo-50" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="truncate">{displayFloor(f)}</span>
              {value === f && (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
