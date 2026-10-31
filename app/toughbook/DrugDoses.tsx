"use client";

import { useState } from "react";
import { ADULT_DRUGS, SITUATIONS, ZONES, adultDoseVolume, fr, igelSize, pedRows } from "@/lib/drug-doses";

export type DrugPreset = { zone?: string; nonce: number };

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** LSC EMS Drug Doses : doses adulte et pédiatriques (zones de couleur / poids), calculées en mg et en mL. */
export function DrugDoses({ preset, onOpenApp }: { preset?: DrugPreset; onOpenApp?: (key: string) => void }) {
  const [mode, setMode] = useState<"adult" | "child">("adult");
  const [view, setView] = useState<"drugs" | "situations">("drugs");
  const [q, setQ] = useState("");
  const [zone, setZone] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [seenNonce, setSeenNonce] = useState(0);

  // Préréglage venu de RAPID (zone de couleur de la fiche pédiatrique) : appliqué une seule fois par demande.
  if (preset && preset.nonce !== seenNonce) {
    setSeenNonce(preset.nonce);
    if (preset.zone) { setZone(preset.zone); setCustom(""); setMode("child"); }
  }

  const z = ZONES.find((x) => x.id === zone) ?? null;
  const customKg = Number(custom.replace(",", "."));
  const hasCustom = custom.trim() !== "" && Number.isFinite(customKg) && customKg > 0;
  const kg = hasCustom ? customKg : z?.kg ?? null;
  const isAdultZone = !hasCustom && z?.adult;

  const needle = norm(q.trim());
  const drugs = ADULT_DRUGS.filter((d) => !needle || norm(`${d.name} ${d.indication} ${d.doses.map((x) => x.route).join(" ")}`).includes(needle));
  const situations = SITUATIONS.filter((s) => !needle || norm(`${s.situation} ${s.drug} ${s.dose}`).includes(needle));

  return (
    <div className="h-full flex flex-col bg-white text-slate-900">
      <div className="shrink-0 flex items-center gap-1.5 bg-[#0f5b63] text-white px-2 py-1 text-[13px]">
        <strong className="tracking-wide truncate flex-1 min-w-0">LSC EMS Drug Doses</strong>
        {onOpenApp && <button type="button" data-testid="drugs-open-rapid" onClick={() => onOpenApp("medic")} className="min-h-9 px-2.5 rounded border border-white/50 text-[12px]">RAPID ↗</button>}
      </div>
      <div className="shrink-0 grid grid-cols-2 border-b border-slate-300 text-[13px]" role="tablist" aria-label="Public">
        <button type="button" role="tab" aria-selected={mode === "adult"} data-testid="drug-mode-adult" onClick={() => setMode("adult")} className={`min-h-10 font-semibold ${mode === "adult" ? "bg-slate-800 text-white" : "bg-slate-100"}`}>Adulte</button>
        <button type="button" role="tab" aria-selected={mode === "child"} data-testid="drug-mode-child" onClick={() => setMode("child")} className={`min-h-10 font-semibold ${mode === "child" ? "bg-slate-800 text-white" : "bg-slate-100"}`}>Enfant</button>
      </div>

      {mode === "adult" ? (
        <div className="flex-1 min-h-0 overflow-auto" data-testid="drug-adult">
          <div className="sticky top-0 z-[1] bg-white/95 backdrop-blur px-2 pt-2 pb-1.5 border-b border-slate-200 space-y-1.5">
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Médicament, indication, voie…" aria-label="Rechercher" data-testid="drug-search" className="w-full min-h-10 rounded-md border border-slate-300 px-3 text-[14px]" />
            <div className="inline-flex rounded-md border border-slate-300 overflow-hidden text-[12.5px]" role="group" aria-label="Affichage">
              <button type="button" aria-pressed={view === "drugs"} onClick={() => setView("drugs")} className={`min-h-9 px-3 ${view === "drugs" ? "bg-slate-800 text-white" : "bg-white"}`}>Médicaments</button>
              <button type="button" aria-pressed={view === "situations"} data-testid="drug-view-situations" onClick={() => setView("situations")} className={`min-h-9 px-3 border-l border-slate-300 ${view === "situations" ? "bg-slate-800 text-white" : "bg-white"}`}>Par situation</button>
            </div>
          </div>
          {view === "drugs" ? (
            <ul className="p-2 space-y-1.5">
              {drugs.map((d) => (
                <li key={d.key} data-testid="drug-card" className="rounded-md border border-slate-200 border-l-[3px] border-l-[#0f5b63] bg-white px-2.5 py-1.5">
                  <p className="text-[13.5px] font-semibold leading-tight">{d.name}</p>
                  <p className="text-[11.5px] text-slate-500 leading-tight">{d.indication}</p>
                  <ul className="mt-1 space-y-0.5">
                    {d.doses.map((x, i) => (
                      <li key={i} className="text-[13px] leading-snug">
                        <span className="font-semibold">{x.label}</span> <span className="text-slate-600">· {x.route}</span>
                        {adultDoseVolume(x) && <span className="ml-1 inline-block rounded bg-teal-50 border border-teal-200 px-1.5 text-[11.5px] text-teal-900">{adultDoseVolume(x)}</span>}
                      </li>
                    ))}
                  </ul>
                  {d.repeat && <p className="text-[12px] text-slate-700 mt-0.5">{d.repeat}</p>}
                  <p className="text-[11.5px] text-amber-800 mt-0.5">⚠ {d.ci}</p>
                </li>
              ))}
              {drugs.length === 0 && <li className="p-3 text-[13px] text-slate-500">Aucun médicament trouvé.</li>}
            </ul>
          ) : (
            <ul className="p-2 space-y-1">
              {situations.map((s) => (
                <li key={s.situation} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
                  <p className="text-[13px] font-semibold leading-tight">{s.situation}</p>
                  <p className="text-[12.5px] text-slate-700">{s.drug} : <b>{s.dose}</b></p>
                </li>
              ))}
            </ul>
          )}
          <p className="px-3 pb-3 text-[11px] text-slate-500">Doses adulte du livre 3 (tableaux 3.7-A et 3.7-B). Volumes calculés avec une concentration standard : toujours vérifier celle de l&apos;ampoule.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto" data-testid="drug-child">
          <div className="p-2">
            <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">Zone de couleur de la réglette</p>
            <div className="grid grid-cols-5 gap-1.5">
              {ZONES.map((x) => (
                <button key={x.id} type="button" data-testid={`drug-zone-${x.id}`} aria-pressed={zone === x.id && !hasCustom} onClick={() => { setZone(x.id); setCustom(""); }}
                  style={{ background: x.hex, color: x.text }} className={`min-h-14 rounded-md border text-center px-0.5 py-1 leading-tight ${zone === x.id && !hasCustom ? "ring-2 ring-offset-1 ring-slate-900 border-slate-900" : "border-slate-400"}`}>
                  <span className="block text-[12px] font-bold">{x.name}</span>
                  <span className="block text-[10px]">{x.kgRange}</span>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-2 text-[13px]">
              <span className="font-semibold">Ou poids connu</span>
              <input type="text" inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="kg" aria-label="Poids connu en kilogrammes" data-testid="drug-weight" className="w-24 min-h-10 rounded-md border border-slate-300 px-2 text-[14px]" />
              <span className="text-slate-500">kg</span>
            </label>
          </div>

          {!kg ? (
            <p className="px-3 pb-3 text-[13px] text-slate-600">Choisir la zone de couleur de la réglette (ruban basé sur la taille) ou saisir le poids pour afficher les doses en mg et en mL.</p>
          ) : isAdultZone ? (
            <div className="mx-2 mb-3 rounded-md border border-slate-300 bg-slate-50 p-3 text-[13px]" data-testid="drug-noir">
              <p className="font-semibold">Zone noire : ≥ 13 ans, plus de 36 kg</p>
              <p>Doses adulte. <button type="button" className="underline font-semibold" onClick={() => setMode("adult")}>Ouvrir les doses adulte</button></p>
            </div>
          ) : (
            <div className="px-2 pb-3" data-testid="drug-ped-rows">
              <div className="rounded-md border border-slate-300 bg-slate-50 p-2 text-[12.5px] mb-2" data-testid="drug-ped-summary">
                <p className="font-bold text-[13.5px]">{hasCustom ? `Poids saisi : ${fr(kg)} kg` : `${z!.name} · ${z!.kgRange} · ${z!.age}`}</p>
                {!hasCustom && z && (
                  <p className="text-slate-700">Poids retenu {fr(kg)} kg · FC {z.fc}/min · FR {z.fr}/min · TAS {z.tas} mmHg</p>
                )}
                <p className="text-slate-700">i-gel : {igelSize(kg)} · Choc : {fr(kg * 2, 0)} J puis {fr(kg * 4, 0)} J</p>
              </div>
              <ul className="space-y-1">
                {pedRows(kg).map((r) => (
                  <li key={r.name} data-testid="drug-ped-row" className="rounded-md border border-slate-200 border-l-[3px] border-l-[#0f5b63] bg-white px-2.5 py-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[13px] font-semibold leading-tight">{r.name}</p>
                      <p className="text-[11.5px] text-slate-500 whitespace-nowrap">{r.route}</p>
                    </div>
                    <p className="text-[14px] font-bold leading-snug" data-testid="drug-ped-dose">{r.dose}</p>
                    {r.volume && <p className="text-[12px] text-teal-900">{r.volume}</p>}
                    {r.note && <p className="text-[11.5px] text-slate-500">{r.note}</p>}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11.5px] text-slate-600">Chaque dose pédiatrique est relue à voix haute avant l&apos;injection ; une dose adulte ne se donne jamais à un enfant. Volumes avec une concentration standard : vérifier celle de l&apos;ampoule.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
