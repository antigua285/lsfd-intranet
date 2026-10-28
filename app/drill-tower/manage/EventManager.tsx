"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEventAction, saveEventAction } from "../actions";

export type EventRow = {
  id: string; title: string; description: string; startsAt: string; endsAt: string; location: string; instructor: string;
  mandatory: boolean; canceled: boolean; cohortId: string;
};

const EMPTY: Omit<EventRow, "id"> = { title: "", description: "", startsAt: "", endsAt: "", location: "", instructor: "", mandatory: false, canceled: false, cohortId: "" };
const input = "w-full border border-slate-300 rounded px-2.5 py-1.5 text-[13px] text-slate-900 bg-white";
const label = "block text-[12px] font-bold text-slate-700 mb-1";

export function EventManager({ events, cohorts }: { events: EventRow[]; cohorts: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Omit<EventRow, "id">>(EMPTY);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const open = (e: EventRow | null) => {
    setMsg(null);
    setEditing(e ? e.id : "new");
    setForm(e ? { ...e } : EMPTY);
  };
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = () =>
    start(async () => {
      const r = await saveEventAction(editing === "new" ? null : editing, form);
      if (r.ok) { setMsg({ ok: true, text: r.message ?? "Enregistré." }); setEditing(null); router.refresh(); }
      else setMsg({ ok: false, text: r.error });
    });
  const remove = (id: string) =>
    start(async () => {
      if (!window.confirm("Supprimer cette formation ?")) return;
      const r = await deleteEventAction(id);
      setMsg(r.ok ? { ok: true, text: "Formation supprimée." } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
    });

  return (
    <section aria-label="Calendrier">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-600">Calendrier des formations</h2>
        <button type="button" data-testid="event-new" onClick={() => open(null)} className="bg-[#0d2644] text-white text-[13px] font-bold px-3 py-1.5 rounded">Nouvelle formation</button>
      </div>
      {msg && <p role="status" data-testid="event-msg" className={`text-[13px] mb-3 ${msg.ok ? "text-green-800" : "text-red-700"}`}>{msg.text}</p>}

      {editing && (
        <div data-testid="event-form" className="border border-slate-300 rounded-lg p-4 mb-4 bg-slate-50 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={label} htmlFor="ev-title">Titre</label><input id="ev-title" className={input} value={form.title} maxLength={120} onChange={(e) => set("title", e.target.value)} /></div>
          <div><label className={label} htmlFor="ev-start">Début (heure de Paris)</label><input id="ev-start" type="datetime-local" className={input} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></div>
          <div><label className={label} htmlFor="ev-end">Fin (optionnel)</label><input id="ev-end" type="datetime-local" className={input} value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></div>
          <div><label className={label} htmlFor="ev-loc">Lieu</label><input id="ev-loc" className={input} value={form.location} maxLength={120} onChange={(e) => set("location", e.target.value)} /></div>
          <div><label className={label} htmlFor="ev-instr">Instructeur</label><input id="ev-instr" className={input} value={form.instructor} maxLength={80} onChange={(e) => set("instructor", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={label} htmlFor="ev-desc">Description</label><textarea id="ev-desc" rows={3} className={input} value={form.description} maxLength={1000} onChange={(e) => set("description", e.target.value)} /></div>
          <div>
            <label className={label} htmlFor="ev-cohort">Destinataires</label>
            <select id="ev-cohort" className={input} value={form.cohortId} onChange={(e) => set("cohortId", e.target.value)}>
              <option value="">Toutes les recrues</option>
              {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 justify-end text-[13px] text-slate-800">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.mandatory} onChange={(e) => set("mandatory", e.target.checked)} /> Présence obligatoire</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.canceled} onChange={(e) => set("canceled", e.target.checked)} /> Annulée</label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button type="button" data-testid="event-save" disabled={pending} onClick={save} className="bg-[#0d2644] text-white text-[13px] font-bold px-4 py-1.5 rounded disabled:opacity-50">Enregistrer</button>
            <button type="button" onClick={() => setEditing(null)} className="border border-slate-300 text-slate-800 text-[13px] px-4 py-1.5 rounded">Annuler</button>
          </div>
        </div>
      )}

      {events.length === 0 ? <p className="text-[13px] text-slate-500">Aucune formation.</p> : (
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <li key={e.id} data-testid="manage-event" className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 bg-white">
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] font-bold text-slate-900 ${e.canceled ? "line-through" : ""}`}>{e.title}</p>
                <p className="text-[12px] text-slate-600">{e.startsAt.replace("T", " ")}{e.location ? ` · ${e.location}` : ""}{e.mandatory ? " · obligatoire" : ""}</p>
              </div>
              <button type="button" onClick={() => open(e)} className="text-[12px] font-bold text-[#0d2644] underline">Modifier</button>
              <button type="button" disabled={pending} onClick={() => remove(e.id)} className="text-[12px] font-bold text-red-700 underline">Supprimer</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
