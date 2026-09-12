"use client";

export interface BarSeriesDef {
  key: string;
  label: string;
  color: string;
}

export interface BarChartDatum {
  label: string;
  [seriesKey: string]: number | string;
}

interface BarChartProps {
  data: BarChartDatum[];
  series: BarSeriesDef[];
  emptyLabel: string;
  height?: number;
}

export default function BarChart({ data, series, emptyLabel, height = 200 }: BarChartProps) {
  const max = Math.max(1, ...data.flatMap(d => series.map(s => Number(d[s.key]) || 0)));
  const barsAreaHeight = height - 26;

  if (data.length === 0 || series.length === 0) {
    return <p className="text-xs text-slate-400 py-14 text-center">{emptyLabel}</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto pb-1 custom-scroll" style={{ height }}>
        <div className="flex items-end gap-4 w-max mx-auto" style={{ height }}>
          {data.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="flex items-end gap-1" style={{ height: barsAreaHeight }}>
                {series.map(s => {
                  const value = Number(d[s.key]) || 0;
                  const pct = value > 0 ? Math.max(3, (value / max) * 100) : 0;
                  return (
                    <div key={s.key} className="flex flex-col items-center justify-end" style={{ width: 16, height: "100%" }}>
                      {value > 0 && <span className="text-[10px] text-slate-500 font-semibold mb-1 tabular-nums">{value}</span>}
                      <div
                        className="w-full rounded-t-md transition-all duration-500 ease-out"
                        style={{ height: `${pct}%`, backgroundColor: s.color }}
                        title={`${s.label}: ${value}`}
                      />
                    </div>
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      {series.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100">
          {series.map(s => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
