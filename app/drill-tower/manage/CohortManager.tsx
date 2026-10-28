"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CohortWithMembers } from "@/lib/drill-shared";
import { addMemberAction, createCohortAction, deleteCohortAction, graduateCohortAction, graduateMemberAction, removeMemberAction, type DrillResult } from "../actions";

const input = "border border-slate-300 rounded px-2.5 py-1.5 text-[13px] text-slate-900 bg-white";

export function CohortManager({ cohorts, users }: { cohorts: CohortWithMembers[]; users: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [pick, setPick] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (work: () => Promise<DrillResult>, confirm?: string) =>
    start(async () => {
      if (confirm && !window.confirm(confirm)) return;
      const r = await work();
      setMsg(r.ok ? { ok: true, text: r.message ?? "Fait." } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
    });

  const inAcademy = new Set(cohorts.flatMap((c) => c.members.filter((m) => !m.graduatedAt).map((m) => m.userId)));

  return (
    <section aria-label="Promotions">
      <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-600 mb-3">Promotions et recrues</h2>
      {msg && <p role="status" data-testid="cohort-msg" className={`text-[13px] mb-3 ${msg.ok ? "text-green-800" : "text-red-700"}`}>{msg.text}</p>}
      <form className="flex flex-wrap items-end gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await createCohortAction({ name, startsOn }); if (r.ok) { setName(""); setStartsOn(""); } return r; }); }}>
        <div><label className="block text-[12px] font-bold text-slate-700 mb-1" htmlFor="co-name">Nouvelle promotion</label><input id="co-name" className={input} value={name} maxLength={60} placeholder="Ex. Promotion Novembre" onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="block text-[12px] font-bold text-slate-700 mb-1" htmlFor="co-date">Début</label><input id="co-date" type="date" className={input} value={startsOn} onChange={(e) => setStartsOn(e.target.value)} /></div>
        <button type="submit" disabled={pending} data-testid="cohort-create" className="bg-[#0d2644] text-white text-[13px] font-bold px-3 py-1.5 rounded disabled:opacity-50">Créer</button>
      </form>

      {cohorts.length === 0 ? <p className="text-[13px] text-slate-500">Aucune promotion.</p> : (
        <div className="flex flex-col gap-4">
          {cohorts.map((c) => (
            <div key={c.id} data-testid="cohort" className="border border-slate-200 rounded-lg p-4 bg-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <p className="text-[15px] font-bold text-slate-900 flex-1">{c.name}{c.graduatedAt ? " · diplômée" : ""}</p>
                {!c.graduatedAt && c.members.some((m) => !m.graduatedAt) && (
                  <button type="button" disabled={pending} data-testid="cohort-graduate" onClick={() => run(() => graduateCohortAction(c.id), `Diplômer toute la promotion « ${c.name} » ? Les recrues passent en probation.`)} className="text-[12px] font-bold text-green-800 underline">Diplômer la promotion</button>
                )}
                <button type="button" disabled={pending} onClick={() => run(() => deleteCohortAction(c.id), `Supprimer la promotion « ${c.name} » ?`)} className="text-[12px] font-bold text-red-700 underline">Supprimer</button>
              </div>
              <ul className="flex flex-col gap-1.5 mb-3">
                {c.members.length === 0 && <li className="text-[13px] text-slate-500">Aucune recrue.</li>}
                {c.members.map((m) => (
                  <li key={m.userId} data-testid="cohort-member" className="flex items-center gap-3 text-[13px] text-slate-900">
                    <span className="flex-1">{m.name} <span className="text-slate-500">· {m.grade}</span>{m.graduatedAt ? <span className="text-green-800 font-bold"> · diplômé(e)</span> : null}</span>
                    {!m.graduatedAt && <button type="button" disabled={pending} data-testid="member-graduate" onClick={() => run(() => graduateMemberAction(m.userId))} className="text-[12px] font-bold text-green-800 underline">Diplômer</button>}
                    {!m.graduatedAt && <button type="button" disabled={pending} onClick={() => run(() => removeMemberAction(m.userId), `Retirer ${m.name} de l'académie ?`)} className="text-[12px] font-bold text-red-700 underline">Retirer</button>}
                  </li>
                ))}
              </ul>
              {!c.graduatedAt && (
                <div className="flex gap-2">
                  <select aria-label={`Ajouter une recrue à ${c.name}`} data-testid="member-pick" className={`${input} flex-1`} value={pick[c.id] ?? ""} onChange={(e) => setPick((p) => ({ ...p, [c.id]: e.target.value }))}>
                    <option value="">Ajouter une recrue…</option>
                    {users.filter((u) => !inAcademy.has(u.id)).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <button type="button" disabled={pending || !pick[c.id]} data-testid="member-add" onClick={() => run(async () => { const r = await addMemberAction(c.id, pick[c.id]); if (r.ok) setPick((p) => ({ ...p, [c.id]: "" })); return r; })} className="bg-[#0d2644] text-white text-[13px] font-bold px-3 py-1.5 rounded disabled:opacity-50">Ajouter</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
