"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Rank } from "@/lib/ranks";
import { deleteRankAction, moveRankAction, saveRankAction, type RankResult } from "./actions";

type Form = { name: string; abbreviation: string; flags: string[] };
const EMPTY: Form = { name: "", abbreviation: "", flags: [] };
const input = "w-full border border-slate-300 rounded px-2.5 py-1.5 text-[13px] text-slate-900 bg-white";
const lbl = "block text-[12px] font-bold text-slate-700 mb-1";

export function RankManager({ ranks, flags }: { ranks: Rank[]; flags: { code: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (work: () => Promise<RankResult>, confirm?: string, after?: () => void) =>
    start(async () => {
      if (confirm && !window.confirm(confirm)) return;
      const r = await work();
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
      if (r.ok) { after?.(); router.refresh(); }
    });

  const open = (r: Rank | null) => { setMsg(null); setEditing(r ? r.id : "new"); setForm(r ? { name: r.name, abbreviation: r.abbreviation, flags: r.flags } : EMPTY); };
  const toggleFlag = (code: string) => setForm((f) => ({ ...f, flags: f.flags.includes(code) ? f.flags.filter((c) => c !== code) : [...f.flags, code] }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] text-slate-500">Du plus haut au plus bas. Les flags cochés sont donnés automatiquement aux membres du rang, et retirés s&apos;ils changent de rang.</p>
        <button type="button" data-testid="rank-new" onClick={() => open(null)} className="shrink-0 bg-[#0d2644] text-white text-[13px] font-bold px-3 py-1.5 rounded">Ajouter un rang</button>
      </div>
      {msg && <p role="status" data-testid="rank-msg" className={`text-[13px] mb-3 ${msg.ok ? "text-green-800" : "text-red-700"}`}>{msg.text}</p>}

      {editing && (
        <div data-testid="rank-form" className="border border-slate-300 rounded-lg p-4 mb-4 bg-slate-50 grid gap-3 sm:grid-cols-2">
          <div><label className={lbl} htmlFor="r-name">Nom du rang</label><input id="r-name" className={input} maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className={lbl} htmlFor="r-abbr">Abréviation (prévue pour plus tard, non affichée pour l&apos;instant)</label><input id="r-abbr" className={input} maxLength={12} value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} /></div>
          <fieldset className="sm:col-span-2">
            <legend className={lbl}>Flags donnés automatiquement</legend>
            {flags.length === 0 ? <p className="text-[12px] text-slate-500">Aucun flag n&apos;existe encore.</p> : (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {flags.map((f) => (
                  <label key={f.code} className="flex items-center gap-1.5 text-[13px] text-slate-800"><input type="checkbox" checked={form.flags.includes(f.code)} onChange={() => toggleFlag(f.code)} /> <span className="font-mono">{f.code}</span> <span className="text-slate-500">{f.name}</span></label>
                ))}
              </div>
            )}
          </fieldset>
          <div className="sm:col-span-2 flex gap-2">
            <button type="button" data-testid="rank-save" disabled={pending} onClick={() => run(() => saveRankAction(editing === "new" ? null : editing, form), undefined, () => setEditing(null))} className="bg-[#0d2644] text-white text-[13px] font-bold px-4 py-1.5 rounded disabled:opacity-50">Enregistrer</button>
            <button type="button" onClick={() => setEditing(null)} className="border border-slate-300 text-slate-800 text-[13px] px-4 py-1.5 rounded">Annuler</button>
          </div>
        </div>
      )}

      {ranks.length === 0 ? <p className="text-[13px] text-slate-500">Aucun rang pour l&apos;instant.</p> : (
        <ol className="flex flex-col gap-2">
          {ranks.map((r, i) => (
            <li key={r.id} data-testid="rank-row" className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 bg-white">
              <div className="flex flex-col">
                <button type="button" aria-label={`Monter ${r.name}`} data-testid="rank-up" disabled={pending || i === 0} onClick={() => run(() => moveRankAction(r.id, "up"))} className="text-slate-600 disabled:opacity-30 leading-none px-1">▲</button>
                <button type="button" aria-label={`Descendre ${r.name}`} data-testid="rank-down" disabled={pending || i === ranks.length - 1} onClick={() => run(() => moveRankAction(r.id, "down"))} className="text-slate-600 disabled:opacity-30 leading-none px-1">▼</button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-slate-900">{r.name}{r.abbreviation && <span className="ml-2 text-[12px] font-normal text-slate-500">({r.abbreviation})</span>}</p>
                <p className="text-[12px] text-slate-600">{r.members} membre(s){r.flags.length ? <> · flags : <span className="font-mono">{r.flags.join(" ")}</span></> : ""}</p>
              </div>
              <button type="button" onClick={() => open(r)} className="text-[12px] font-bold text-[#0d2644] underline">Modifier</button>
              <button type="button" disabled={pending} onClick={() => run(() => deleteRankAction(r.id), r.members ? `Supprimer « ${r.name} » ? Les ${r.members} membre(s) gardent leur grade affiché mais ne sont plus rattachés à un rang (les flags déjà donnés restent).` : `Supprimer « ${r.name} » ?`)} className="text-[12px] font-bold text-red-700 underline">Supprimer</button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
