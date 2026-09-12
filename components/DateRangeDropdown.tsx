"use client";

import { useEffect, useRef, useState } from "react";

export type DateRange = "today" | "7d" | "30d" | "all";
const DATE_RANGES: DateRange[] = ["today", "7d", "30d", "all"];

interface DateRangeDropdownProps {
  value: DateRange;
  onChange: (r: DateRange) => void;
  translator: (k: string) => string;
}

export default function DateRangeDropdown({ value, onChange, translator }: DateRangeDropdownProps) {
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
    <div className="relative inline-block shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          open ? "border-indigo-300 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="whitespace-nowrap">{translator(`range_${value}`)}</span>
        <svg viewBox="0 0 10 6" className={`w-2 h-2 transition-transform duration-200 ${open ? "-rotate-180" : ""}`} fill="currentColor">
          <path d="M0 0L5 6L10 0Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 top-full right-0 mt-2 w-36 rounded-xl bg-white shadow-2xl ring-1 ring-black/5 py-1.5 text-left animate-fadeInUp">
          {DATE_RANGES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { onChange(r); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs transition-colors ${
                value === r ? "text-indigo-600 font-semibold bg-indigo-50" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {translator(`range_${r}`)}
              {value === r && (
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
