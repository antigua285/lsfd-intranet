"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AIRCRAFT_TYPES, MISSIONS, aircraftLabel, frDate, hoursDecimal, missionLabel, type FlightRow } from "@/lib/airops-shared";
import { deleteFlightAction, saveFlightAction, signFlightAction } from "./actions";

type Draft = Record<"flownOn" | "aircraftType" | "registration" | "from" | "to" | "route" | "depTime" | "arrTime" | "mission" | "total" | "pic" | "sic" | "given" | "received" | "night" | "ifr" | "nvg" | "landDay" | "landNight" | "drops" | "hoists" | "crew" | "remarks", string>;
const dec = (m: number) => (m ? String(m / 60).replace(".", ",") : "");
const empty = (): Draft => ({ flownOn: new Date().toISOString().slice(0, 10), aircraftType: "", registration: "", from: "", to: "", route: "", depTime: "", arrTime: "", mission: "training", total: "", pic: "", sic: "", given: "", received: "", night: "", ifr: "", nvg: "", landDay: "", landNight: "", drops: "", hoists: "", crew: "", remarks: "" });
const fromRow = (f: FlightRow): Draft => ({ flownOn: f.flownOn, aircraftType: f.aircraftType, registration: f.registration, from: f.from, to: f.to, route: f.route, depTime: f.depTime, arrTime: f.arrTime, mission: f.mission,
  total: dec(f.totalMin), pic: dec(f.picMin), sic: dec(f.sicMin), given: dec(f.givenMin), received: dec(f.receivedMin), night: dec(f.nightMin), ifr: dec(f.ifrMin), nvg: dec(f.nvgMin),
  landDay: f.landDay ? String(f.landDay) : "", landNight: f.landNight ? String(f.landNight) : "", drops: f.drops ? String(f.drops) : "", hoists: f.hoists ? String(f.hoists) : "", crew: f.crew, remarks: f.remarks });

const inp = "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] bg-white";
const lab = "block text-[10.5px] font-bold uppercase tracking-wide text-slate-600 mb-0.5";

/** Carnet de vol : tableau de type papier (une ligne par vol) + saisie. */
export function Logbook({ pilotId, flights, canAdd, isCmd, isMine }: { pilotId: string; flights: FlightRow[]; canAdd: boolean; isCmd: boolean; isMine: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [d, setD] = useState<Draft>(empty());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof Draft, v: string) => setD((x) => ({ ...x, [k]: v }));
  const mayEdit = (f: FlightRow) => isCmd || (isMine && !f.signedAt);

  const open = (f: FlightRow | null) => { setD(f ? fromRow(f) : empty()); setEditing(f ? f.id : "new"); setMsg(null); };
  const save = () => start(async () => {
    const r = await saveFlightAction(pilotId, editing === "new" ? null : editing, d);
    if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
    setMsg({ ok: true, text: r.message }); setEditing(null); router.refresh();
  });
  const del = (f: FlightRow) => start(async () => {
    if (!window.confirm(`Supprimer le vol du ${frDate(f.flownOn)} ?`)) return;
    const r = await deleteFlightAction(pilotId, f.id);
    setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error }); router.refresh();
  });
  const sign = (f: FlightRow, s: boolean) => start(async () => {
    const r = await signFlightAction(f.id, s);
    setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error }); router.refresh();
  });

  const total = flights.reduce((s, f) => s + f.totalMin, 0);
  return (
    <section data-testid="logbook">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-bold uppercase text-slate-700">Vols enregistrés</h3>
        {canAdd && editing === null && <button type="button" onClick={() => open(null)} data-testid="flight-add" className="min-h-9 px-3 rounded bg-[#0d2644] text-white text-[13px] font-bold">+ Ajouter un vol</button>}
      </div>
      {msg && <p role="status" data-testid="logbook-msg" className={`mb-2 text-[13px] ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}

      {editing !== null && (
        <div className="mb-4 border-2 border-slate-800 bg-white" data-testid="flight-form">
          <h4 className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1">{editing === "new" ? "Nouvelle ligne du carnet" : "Modifier la ligne"}</h4>
          <div className="grid grid-cols-6 gap-x-3 gap-y-2.5 p-3">
            <label className="col-span-3 sm:col-span-1"><span className={lab}>Date *</span><input type="date" value={d.flownOn} onChange={(e) => set("flownOn", e.target.value)} data-testid="f-date" className={inp} /></label>
            <label className="col-span-3 sm:col-span-2"><span className={lab}>Aéronef *</span>
              <select value={d.aircraftType} onChange={(e) => set("aircraftType", e.target.value)} data-testid="f-aircraft" className={inp}>
                <option value="">Choisir…</option>{AIRCRAFT_TYPES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select></label>
            <label className="col-span-3 sm:col-span-1"><span className={lab}>Immatriculation</span><input value={d.registration} maxLength={12} onChange={(e) => set("registration", e.target.value)} className={`${inp} uppercase`} /></label>
            <label className="col-span-3 sm:col-span-2"><span className={lab}>Mission *</span>
              <select value={d.mission} onChange={(e) => set("mission", e.target.value)} className={inp}>{MISSIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select></label>
            <label className="col-span-3 sm:col-span-1"><span className={lab}>Départ</span><input value={d.from} maxLength={40} onChange={(e) => set("from", e.target.value)} data-testid="f-from" className={inp} /></label>
            <label className="col-span-3 sm:col-span-1"><span className={lab}>Arrivée</span><input value={d.to} maxLength={40} onChange={(e) => set("to", e.target.value)} className={inp} /></label>
            <label className="col-span-3 sm:col-span-1"><span className={lab}>Heure départ</span><input type="time" value={d.depTime} onChange={(e) => set("depTime", e.target.value)} data-testid="f-dep" className={inp} /></label>
            <label className="col-span-3 sm:col-span-1"><span className={lab}>Heure arrivée</span><input type="time" value={d.arrTime} onChange={(e) => set("arrTime", e.target.value)} data-testid="f-arr" className={inp} /></label>
            <label className="col-span-6 sm:col-span-3"><span className={lab}>Route / points de passage</span><input value={d.route} maxLength={300} onChange={(e) => set("route", e.target.value)} className={inp} /></label>
            {([["total", "Temps total"], ["pic", "Commandant"], ["sic", "Co-pilote"], ["given", "Instr. donnée"], ["received", "Instr. reçue"], ["night", "Nuit"], ["ifr", "IFR"], ["nvg", "NVG"]] as const).map(([k, l]) => (
              <label key={k} className="col-span-3 sm:col-span-1"><span className={lab}>{l} (h)</span><input inputMode="decimal" placeholder="1,5 ou 1:30" value={d[k]} onChange={(e) => set(k, e.target.value)} data-testid={`f-${k}`} className={inp} /></label>
            ))}
            {([["landDay", "Atterr. jour"], ["landNight", "Atterr. nuit"], ["drops", "Largages"], ["hoists", "Treuillages"]] as const).map(([k, l]) => (
              <label key={k} className="col-span-3 sm:col-span-1"><span className={lab}>{l}</span><input inputMode="numeric" value={d[k]} onChange={(e) => set(k, e.target.value)} data-testid={`f-${k}`} className={inp} /></label>
            ))}
            <label className="col-span-6 sm:col-span-3"><span className={lab}>Équipage / passagers</span><input value={d.crew} maxLength={200} onChange={(e) => set("crew", e.target.value)} className={inp} /></label>
            <label className="col-span-6"><span className={lab}>Remarques</span><textarea rows={2} value={d.remarks} maxLength={600} onChange={(e) => set("remarks", e.target.value)} className={inp} /></label>
          </div>
          <p className="px-3 text-[11.5px] text-slate-500">Si le temps total est vide, il est calculé à partir des heures de départ et d&apos;arrivée.</p>
          <div className="flex gap-2 p-3">
            <button type="button" onClick={save} disabled={pending} data-testid="flight-save" className="min-h-10 px-4 rounded bg-[#0d2644] text-white text-[13px] font-bold disabled:opacity-50">Enregistrer</button>
            <button type="button" onClick={() => setEditing(null)} className="min-h-10 px-4 rounded border border-slate-300 text-[13px]">Annuler</button>
          </div>
        </div>
      )}

      {flights.length === 0 ? (
        <p className="text-[13px] text-slate-500 border border-dashed border-slate-300 rounded p-5 text-center">Aucun vol enregistré dans ce carnet.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-300 bg-white">
          <table className="w-full text-[12.5px] whitespace-nowrap" data-testid="flight-table">
            <thead className="bg-slate-100 text-[10.5px] uppercase tracking-wide text-slate-600 border-b-2 border-slate-800">
              <tr>
                <th className="px-2 py-1.5 text-left">Date</th><th className="px-2 py-1.5 text-left">Aéronef</th><th className="px-2 py-1.5 text-left">De → À</th><th className="px-2 py-1.5 text-left">Mission</th>
                <th className="px-2 py-1.5 text-right">Total</th><th className="px-2 py-1.5 text-right">PIC</th><th className="px-2 py-1.5 text-right">SIC</th><th className="px-2 py-1.5 text-right">Instr.</th>
                <th className="px-2 py-1.5 text-right">Nuit</th><th className="px-2 py-1.5 text-right">IFR</th><th className="px-2 py-1.5 text-right">NVG</th><th className="px-2 py-1.5 text-right">Atterr. J/N</th>
                <th className="px-2 py-1.5 text-left">Contresigné</th><th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {flights.map((f) => (
                <tr key={f.id} data-testid="flight-row" className="hover:bg-slate-50 align-top">
                  <td className="px-2 py-1.5">{frDate(f.flownOn)}</td>
                  <td className="px-2 py-1.5 font-sans">{aircraftLabel(f.aircraftType)}{f.registration && <span className="text-slate-500"> · {f.registration}</span>}</td>
                  <td className="px-2 py-1.5 font-sans" title={f.route}>{f.from || "—"} → {f.to || "—"}</td>
                  <td className="px-2 py-1.5 font-sans">{missionLabel(f.mission)}</td>
                  <td className="px-2 py-1.5 text-right font-bold">{hoursDecimal(f.totalMin)}</td>
                  <td className="px-2 py-1.5 text-right">{f.picMin ? hoursDecimal(f.picMin) : ""}</td><td className="px-2 py-1.5 text-right">{f.sicMin ? hoursDecimal(f.sicMin) : ""}</td>
                  <td className="px-2 py-1.5 text-right">{f.givenMin || f.receivedMin ? `${hoursDecimal(f.givenMin)}/${hoursDecimal(f.receivedMin)}` : ""}</td>
                  <td className="px-2 py-1.5 text-right">{f.nightMin ? hoursDecimal(f.nightMin) : ""}</td><td className="px-2 py-1.5 text-right">{f.ifrMin ? hoursDecimal(f.ifrMin) : ""}</td><td className="px-2 py-1.5 text-right">{f.nvgMin ? hoursDecimal(f.nvgMin) : ""}</td>
                  <td className="px-2 py-1.5 text-right">{f.landDay}/{f.landNight}</td>
                  <td className="px-2 py-1.5 font-sans">{f.signedBy ? <span className="text-emerald-700 font-bold" title={f.signedAt ?? ""}>✔ {f.signedBy}</span> : <span className="text-slate-400">—</span>}</td>
                  <td className="px-2 py-1.5 font-sans text-right space-x-1">
                    {isCmd && (f.signedBy ? <button type="button" disabled={pending} onClick={() => sign(f, false)} className="px-2 py-1 border border-slate-300 rounded text-[11.5px]">Retirer</button> : <button type="button" disabled={pending} onClick={() => sign(f, true)} data-testid="flight-sign" className="px-2 py-1 border border-emerald-700 text-emerald-800 rounded text-[11.5px] font-bold">Contresigner</button>)}
                    {mayEdit(f) && <button type="button" disabled={pending} onClick={() => open(f)} data-testid="flight-edit" className="px-2 py-1 border border-slate-300 rounded text-[11.5px]">Modifier</button>}
                    {mayEdit(f) && <button type="button" disabled={pending} onClick={() => del(f)} className="px-2 py-1 border border-red-300 text-red-700 rounded text-[11.5px]">Suppr.</button>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-800 font-mono font-bold text-[12.5px]">
              <tr><td colSpan={4} className="px-2 py-1.5 text-right font-sans uppercase text-[11px]">Total reporté</td><td className="px-2 py-1.5 text-right">{hoursDecimal(total)}</td><td colSpan={9} /></tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
