"use client";

import { useState } from "react";
import { GCS_CATEGORIES, TOOLS, gcsResult, type GcsSelection, type ToolKey } from "@/lib/medic-tools";

const TONE: Record<string, string> = {
  none: "bg-slate-100 text-slate-600 border-slate-300",
  ok: "bg-green-100 text-green-900 border-green-400",
  light: "bg-yellow-100 text-yellow-900 border-yellow-400",
  mid: "bg-orange-100 text-orange-900 border-orange-400",
  bad: "bg-red-100 text-red-900 border-red-500",
};

function Glasgow() {
  const [sel, setSel] = useState<GcsSelection>({});
  const res = gcsResult(sel);
  return (
    <div className="h-full flex flex-col" data-testid="tool-gcs">
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="grid gap-3 md:grid-cols-3">
          {GCS_CATEGORIES.map((c) => (
            <fieldset key={c.key} className="min-w-0">
              <legend className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">{c.title}</legend>
              <div className="flex flex-col gap-1">
                {c.options.map((o) => {
                  const on = sel[c.key] === o.score;
                  return (
                    <button key={o.score} type="button" aria-pressed={on} data-testid={`gcs-${c.key}${o.score}`} onClick={() => setSel((s) => ({ ...s, [c.key]: o.score }))}
                      className={`flex items-center gap-2 min-h-10 rounded border px-2 py-1 text-left ${on ? "border-red-700 bg-red-50 ring-1 ring-red-700" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
                      <span className={`shrink-0 w-6 h-6 rounded text-[13px] font-bold flex items-center justify-center ${on ? "bg-red-700 text-white" : "bg-slate-200 text-slate-700"}`}>{o.score}</span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-tight">{o.label}</span>
                        {o.hint && <span className="block text-[11px] text-slate-500 leading-tight">{o.hint}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
      <div className={`shrink-0 border-t p-2 flex items-center gap-3 ${TONE[res.tone]}`} aria-live="polite" data-testid="gcs-result">
        <div className="text-center leading-none">
          <div className="text-[26px] font-bold tabular-nums" data-testid="gcs-total">{res.total ?? "—"}</div>
          <div className="text-[10px] uppercase">/ 15</div>
        </div>
        <div className="flex-1 min-w-0 text-[12.5px]">
          <p className="font-semibold">{res.total !== null ? `${res.text} · ${res.severity}` : res.severity}</p>
          {res.advice && <p className="leading-snug">{res.advice}</p>}
        </div>
        <button type="button" onClick={() => setSel({})} className="shrink-0 min-h-9 px-3 rounded border border-slate-400 bg-white/80 text-[13px]">Effacer</button>
      </div>
    </div>
  );
}

/** Panneau d'un outil, affiché au-dessus de l'application sans perdre l'état du guide. */
export function MedicToolPanel({ tool, onClose }: { tool: ToolKey; onClose: () => void }) {
  const def = TOOLS.find((t) => t.key === tool)!;
  return (
    <div className="absolute inset-0 z-10 bg-white text-slate-900 flex flex-col" role="dialog" aria-label={def.title}>
      <div className="shrink-0 flex items-center gap-2 bg-slate-800 text-white px-2 py-1">
        <strong className="flex-1 truncate text-[13px]">{def.title}</strong>
        <button type="button" onClick={onClose} className="min-h-9 px-3 rounded bg-white/15 text-[13px]" data-testid="tool-close">Fermer</button>
      </div>
      <div className="flex-1 min-h-0">{tool === "gcs" && <Glasgow />}</div>
    </div>
  );
}
