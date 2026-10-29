"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CAL_CATEGORIES, WEEKDAYS, catOf, eventDays, monthTitle, type CalCategory, type CalEvent } from "@/lib/calendar-shared";
import { dateToParisLocal, fmtDay, fmtRange } from "@/lib/drill-shared";
import { deleteCalendarEventAction, saveCalendarEventAction } from "./actions";

type Week = { key: string; day: number; inMonth: boolean }[];
type Form = { title: string; category: CalCategory; description: string; location: string; allDay: boolean; startsAt: string; endsAt: string };

const NAVY = "#0d2644";
const input = "w-full border border-slate-300 rounded px-2.5 py-1.5 text-[13px] text-slate-900 bg-white";
const lbl = "block text-[12px] font-bold text-slate-700 mb-1";

function emptyForm(date: string): Form {
  return { title: "", category: "evenement", description: "", location: "", allDay: false, startsAt: `${date}T18:00`, endsAt: "" };
}

function timeLabel(e: CalEvent) {
  return e.allDay ? "Toute la journée" : fmtRange(e);
}

export function CalendarView({ year, month, weeks, events, today, canEdit, showAcademy, prevHref, nextHref, todayHref, defaultDate }: {
  year: number; month: number; weeks: Week[]; events: CalEvent[]; today: string; canEdit: boolean; showAcademy: boolean;
  prevHref: string; nextHref: string; todayHref: string; defaultDate: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(emptyForm(defaultDate));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const cats = CAL_CATEGORIES.filter((c) => c.key !== "academie" || showAcademy);
  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (hidden.has(e.category)) continue;
      for (const d of eventDays(e)) map.set(d, [...(map.get(d) ?? []), e]);
    }
    return map;
  }, [events, hidden]);
  const current = events.find((e) => `${e.source}:${e.id}` === selected) ?? null;

  const toggle = (k: string) => setHidden((h) => { const n = new Set(h); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = (date: string) => { setMsg(null); setEditing("new"); setForm(emptyForm(date)); };
  const openEdit = (e: CalEvent) => {
    setMsg(null); setEditing(e.id);
    setForm({ title: e.title, category: e.category, description: e.description, location: e.location, allDay: e.allDay,
      startsAt: e.allDay ? dateToParisLocal(e.startsAt).slice(0, 10) : dateToParisLocal(e.startsAt),
      endsAt: e.endsAt ? (e.allDay ? dateToParisLocal(e.endsAt).slice(0, 10) : dateToParisLocal(e.endsAt)) : "" });
  };
  const toggleAllDay = (on: boolean) => setForm((f) => ({ ...f, allDay: on, startsAt: on ? f.startsAt.slice(0, 10) : `${f.startsAt.slice(0, 10)}T18:00`, endsAt: f.endsAt ? (on ? f.endsAt.slice(0, 10) : `${f.endsAt.slice(0, 10)}T20:00`) : "" }));

  const save = () => start(async () => {
    const r = await saveCalendarEventAction(editing === "new" ? null : editing, form);
    if (r.ok) { setMsg({ ok: true, text: r.message }); setEditing(null); router.refresh(); } else setMsg({ ok: false, text: r.error });
  });
  const remove = (e: CalEvent) => start(async () => {
    if (!window.confirm(`Supprimer « ${e.title} » ?`)) return;
    const r = await deleteCalendarEventAction(e.id);
    setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
    if (r.ok) { setSelected(null); router.refresh(); }
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Link href={prevHref} aria-label="Mois précédent" data-testid="cal-prev" className="border border-slate-300 rounded px-3 py-1.5 text-[14px] font-bold" style={{ color: NAVY }}>‹</Link>
        <Link href={nextHref} aria-label="Mois suivant" data-testid="cal-next" className="border border-slate-300 rounded px-3 py-1.5 text-[14px] font-bold" style={{ color: NAVY }}>›</Link>
        <Link href={todayHref} data-testid="cal-today" className="border border-slate-300 rounded px-3 py-1.5 text-[13px] font-bold" style={{ color: NAVY }}>Aujourd&apos;hui</Link>
        <h2 data-testid="cal-title" className="text-[20px] font-bold ml-2 flex-1" style={{ color: NAVY }}>{monthTitle(year, month)}</h2>
        {canEdit && <button type="button" data-testid="cal-new" onClick={() => openNew(today)} className="text-white text-[13px] font-bold px-3 py-1.5 rounded" style={{ background: NAVY }}>Ajouter un événement</button>}
      </div>

      <ul className="flex flex-wrap gap-2 mb-3" aria-label="Catégories">
        {cats.map((c) => {
          const off = hidden.has(c.key);
          return (
            <li key={c.key}>
              <button type="button" onClick={() => toggle(c.key)} aria-pressed={!off} title={c.hint} data-testid={`legend-${c.key}`}
                className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[12px] font-bold ${off ? "border-slate-200 text-slate-400 bg-white" : "border-slate-300 text-slate-800 bg-white"}`}>
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: off ? "#cbd5e1" : c.color }} />{c.label}
              </button>
            </li>
          );
        })}
      </ul>

      {msg && <p role="status" data-testid="cal-msg" className={`text-[13px] mb-3 ${msg.ok ? "text-green-800" : "text-red-700"}`}>{msg.text}</p>}

      {editing && (
        <div data-testid="cal-form" className="border border-slate-300 rounded-lg p-4 mb-4 bg-slate-50 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={lbl} htmlFor="c-title">Titre</label><input id="c-title" className={input} value={form.title} maxLength={120} onChange={(e) => set("title", e.target.value)} /></div>
          <div>
            <label className={lbl} htmlFor="c-cat">Catégorie</label>
            <select id="c-cat" className={input} value={form.category} onChange={(e) => set("category", e.target.value as CalCategory)}>
              {CAL_CATEGORIES.filter((c) => c.manual).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-slate-800 self-end pb-2"><input type="checkbox" checked={form.allDay} onChange={(e) => toggleAllDay(e.target.checked)} /> Toute la journée</label>
          <div><label className={lbl} htmlFor="c-start">Début {form.allDay ? "(jour)" : "(heure de Paris)"}</label><input id="c-start" type={form.allDay ? "date" : "datetime-local"} className={input} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></div>
          <div><label className={lbl} htmlFor="c-end">Fin (optionnel)</label><input id="c-end" type={form.allDay ? "date" : "datetime-local"} className={input} value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={lbl} htmlFor="c-loc">Lieu</label><input id="c-loc" className={input} value={form.location} maxLength={120} onChange={(e) => set("location", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={lbl} htmlFor="c-desc">Description</label><textarea id="c-desc" rows={3} className={input} value={form.description} maxLength={1000} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="sm:col-span-2 flex gap-2">
            <button type="button" data-testid="cal-save" disabled={pending} onClick={save} className="text-white text-[13px] font-bold px-4 py-1.5 rounded disabled:opacity-50" style={{ background: NAVY }}>Enregistrer</button>
            <button type="button" onClick={() => setEditing(null)} className="border border-slate-300 text-slate-800 text-[13px] px-4 py-1.5 rounded">Annuler</button>
          </div>
        </div>
      )}

      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white" data-testid="cal-grid" role="grid" aria-label={monthTitle(year, month)}>
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-300" role="row">
          {WEEKDAYS.map((d) => <div key={d} role="columnheader" className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-500 py-2">{d}</div>)}
        </div>
        {weeks.map((w, i) => (
          <div key={i} className="grid grid-cols-7" role="row">
            {w.map((d, j) => {
              const list = byDay.get(d.key) ?? [];
              const isToday = d.key === today;
              return (
                <div key={d.key} role="gridcell" data-testid="cal-day" data-date={d.key}
                  className={`group min-h-[92px] sm:min-h-[112px] p-1 border-slate-200 ${j < 6 ? "border-r" : ""} ${i < weeks.length - 1 ? "border-b" : ""} ${d.inMonth ? "bg-white" : "bg-slate-50"}`}>
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex items-center justify-center min-w-7 h-7 px-1 rounded-full text-[16px] font-bold ${isToday ? "text-white" : ""}`}
                      style={isToday ? { background: NAVY } : { color: NAVY, opacity: d.inMonth ? 1 : 0.4 }}>{d.day}</span>
                    {canEdit && <button type="button" aria-label={`Ajouter un événement le ${d.key}`} onClick={() => openNew(d.key)} className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-500 text-[16px] leading-none px-1">+</button>}
                  </div>
                  <ul className="flex flex-col gap-0.5 mt-0.5">
                    {list.slice(0, 3).map((e) => {
                      const c = catOf(e.category);
                      return (
                        <li key={`${e.source}:${e.id}`}>
                          <button type="button" data-testid="cal-event" data-cat={e.category} onClick={() => setSelected(`${e.source}:${e.id}`)} title={e.title}
                            className={`w-full text-left truncate text-[11px] font-bold rounded px-1.5 py-0.5 border-l-4 ${e.canceled ? "line-through opacity-60" : ""}`}
                            style={{ background: `${c.color}1f`, borderColor: c.color, color: c.color }}>
                            {!e.allDay && <span className="font-normal">{new Date(e.startsAt).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" })} </span>}{e.title}
                          </button>
                        </li>
                      );
                    })}
                    {list.length > 3 && (
                      <li><button type="button" onClick={() => setSelected(`${list[3].source}:${list[3].id}`)} className="text-[11px] font-bold text-slate-600 px-1">+ {list.length - 3} autre(s)</button></li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {current && (
        <aside data-testid="cal-detail" className="mt-4 border-2 rounded-lg p-4 bg-white" style={{ borderColor: catOf(current.category).color }}>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold uppercase" style={{ color: catOf(current.category).color }}>{catOf(current.category).label}{current.canceled ? " · annulée" : ""}</p>
              <p className="text-[17px] font-bold text-slate-900">{current.title}</p>
              <p className="text-[13px] text-slate-700 mt-1">{fmtDay(current.startsAt)} · {timeLabel(current)}</p>
              {current.location && <p className="text-[13px] text-slate-700">Lieu : <strong>{current.location}</strong></p>}
              {current.extra && <p className="text-[12px] text-slate-600">{current.extra}</p>}
              {current.description && <p className="text-[13px] text-slate-800 mt-2 whitespace-pre-wrap">{current.description}</p>}
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-[12px] text-slate-500 underline">Fermer</button>
          </div>
          {canEdit && current.source === "cal" && (
            <div className="flex gap-3 mt-3">
              <button type="button" data-testid="cal-edit" onClick={() => openEdit(current)} className="text-[12px] font-bold underline" style={{ color: NAVY }}>Modifier</button>
              <button type="button" data-testid="cal-delete" disabled={pending} onClick={() => remove(current)} className="text-[12px] font-bold text-red-700 underline">Supprimer</button>
            </div>
          )}
          {current.source === "drill" && <p className="text-[12px] text-slate-500 mt-3">Cette formation se modifie depuis la Drill Tower (Gérer).</p>}
        </aside>
      )}
    </div>
  );
}
