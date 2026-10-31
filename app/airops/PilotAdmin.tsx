"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AIR_RANKS, QUALIFICATIONS, type PilotRow } from "@/lib/airops-shared";
import { deleteLogbookAction, savePilotAction, setRankAction } from "./actions";

const inp = "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] bg-white";
const lab = "block text-[10.5px] font-bold uppercase tracking-wide text-slate-600 mb-0.5";

/** Gestion du carnet par le commandement (AIROPSCMD) : rang interne, qualifications, fiche pilote. */
export function PilotAdmin({ pilot }: { pilot: PilotRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rank, setRank] = useState(pilot.airRank);
  const [note, setNote] = useState("");
  const [callsign, setCallsign] = useState(pilot.callsign);
  const [licenseNo, setLicenseNo] = useState(pilot.licenseNo);
  const [medicalUntil, setMedical] = useState(pilot.medicalUntil ?? "");
  const [notes, setNotes] = useState(pilot.notes);
  const [quals, setQuals] = useState<string[]>(pilot.qualifications);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const done = (r: { ok: boolean; message?: string; error?: string }) => { setMsg(r.ok ? { ok: true, text: r.message ?? "" } : { ok: false, text: r.error ?? "" }); if (r.ok) router.refresh(); };

  return (
    <div className="border border-slate-300 rounded bg-white p-4 space-y-4" data-testid="pilot-admin">
      <h3 className="text-[13px] font-bold uppercase text-slate-700">Commandement Air Operations</h3>
      <div className="space-y-2">
        <label className="block"><span className={lab}>Rang interne</span>
          <select value={rank} onChange={(e) => setRank(e.target.value)} data-testid="rank-select" className={inp}>{AIR_RANKS.map((r) => <option key={r.key} value={r.key}>{r.level}. {r.label} ({r.abbr})</option>)}</select></label>
        <label className="block"><span className={lab}>Motif (visible dans l&apos;historique)</span><input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="ex. Validation du contrôle de compétence" className={inp} /></label>
        <button type="button" disabled={pending || rank === pilot.airRank} data-testid="rank-save" onClick={() => start(async () => done(await setRankAction(pilot.id, { rank, note })))} className="min-h-9 px-3 rounded bg-[#0d2644] text-white text-[13px] font-bold disabled:opacity-40">Enregistrer le rang</button>
      </div>
      <hr className="border-slate-200" />
      <div className="grid grid-cols-2 gap-2">
        <label><span className={lab}>Indicatif</span><input value={callsign} maxLength={20} onChange={(e) => setCallsign(e.target.value)} data-testid="pilot-callsign" className={inp} /></label>
        <label><span className={lab}>N° de licence</span><input value={licenseNo} maxLength={30} onChange={(e) => setLicenseNo(e.target.value)} className={inp} /></label>
        <label className="col-span-2"><span className={lab}>Visite médicale valide jusqu&apos;au</span><input type="date" value={medicalUntil} onChange={(e) => setMedical(e.target.value)} className={inp} /></label>
      </div>
      <fieldset>
        <legend className={lab}>Qualifications</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
          {QUALIFICATIONS.map((q) => (
            <label key={q.key} className="flex items-center gap-2 text-[12.5px] min-h-8">
              <input type="checkbox" checked={quals.includes(q.key)} onChange={(e) => setQuals((l) => (e.target.checked ? [...l, q.key] : l.filter((x) => x !== q.key)))} data-testid={`qual-${q.key}`} className="w-4 h-4" />{q.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block"><span className={lab}>Notes du commandement</span><textarea rows={3} value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} className={inp} /></label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} data-testid="pilot-save" onClick={() => start(async () => done(await savePilotAction(pilot.id, { callsign, licenseNo, medicalUntil, notes, qualifications: quals })))} className="min-h-9 px-3 rounded bg-[#0d2644] text-white text-[13px] font-bold">Enregistrer la fiche</button>
        <button type="button" disabled={pending} onClick={() => start(async () => {
          if (!window.confirm("Supprimer ce carnet et tous ses vols ? Cette action est définitive.")) return;
          const r = await deleteLogbookAction(pilot.id);
          if (r.ok) router.replace("/airops"); else done(r);
        })} className="min-h-9 px-3 rounded border border-red-300 text-red-700 text-[13px] ml-auto">Supprimer le carnet</button>
      </div>
      {msg && <p role="status" data-testid="pilot-msg" className={`text-[12.5px] ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}
    </div>
  );
}
