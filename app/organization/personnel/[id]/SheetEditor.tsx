"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { DB_STATUSES, EMPLOYMENT_STATUSES, ageFrom, fmtDate, labelOf, type Perms, type Sheet } from "@/lib/personnel-shared";
import { addRowAction, deleteRowAction, endAssignmentAction, saveBaseAction, saveEmploymentAction, savePersonalAction, type RowKind, type SheetResult } from "../actions";

const input = "w-full border border-slate-300 rounded px-2.5 py-1.5 text-[13px] text-slate-900 bg-white";
const lbl = "block text-[12px] font-bold text-slate-700 mb-1";
const btn = "bg-[#0d2644] text-white text-[12px] font-bold px-3 py-1.5 rounded disabled:opacity-50";
const link = "text-[12px] font-bold underline";

const Confidential = () => <i data-testid="confidential" className="text-slate-500">CONFIDENTIEL</i>;

function Section({ n, title, children, action }: { n: number; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section aria-label={title} className="bg-white border border-slate-200 rounded shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 rounded-t flex items-center gap-3">
        <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide flex-1">{n} · {title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-slate-500 text-[13px]">{label}</dt>
      <dd className="text-slate-900 text-[14px]">{children}</dd>
    </>
  );
}
const Dl = ({ children }: { children: ReactNode }) => <dl className="grid grid-cols-[11rem_1fr] gap-x-4 gap-y-1.5">{children}</dl>;

export function SheetEditor({ sheet, perms, ranks, today }: { sheet: Sheet; perms: Perms; ranks: { id: string; name: string }[]; today: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<"base" | "personal" | "employment" | null>(null);
  const [adding, setAdding] = useState<RowKind | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const { isSelf, isStaff, canConfidential } = perms;
  const canEditPersonal = isSelf || isStaff;

  const run = (work: () => Promise<SheetResult>, done?: () => void, confirm?: string) =>
    start(async () => {
      if (confirm && !window.confirm(confirm)) return;
      const r = await work();
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
      if (r.ok) { done?.(); router.refresh(); }
    });
  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const field = (k: string, label: string, type = "text", extra: Record<string, unknown> = {}) => (
    <div key={k}><label className={lbl} htmlFor={`f-${k}`}>{label}</label><input id={`f-${k}`} type={type} className={input} value={draft[k] ?? ""} onChange={(e) => set(k, e.target.value)} {...extra} /></div>
  );
  const startEdit = (which: "base" | "personal" | "employment") => {
    setMsg(null); setAdding(null); setEditing(which);
    if (which === "base") setDraft({ dbStatus: sheet.dbStatus });
    if (which === "personal") setDraft({ firstName: sheet.firstName, lastName: sheet.lastName, badge: sheet.badge, birthDate: sheet.birthDate ?? "", languages: sheet.languages, phone: sheet.phone ?? "", phone2: sheet.phone2 ?? "", address: sheet.address ?? "" });
    if (which === "employment") setDraft({ employmentStatus: sheet.employmentStatus, hiredOn: sheet.hiredOn ?? "", bureau: sheet.bureau, station: sheet.station, rankId: sheet.rankId ?? "" });
  };
  const startAdd = (kind: RowKind) => { setMsg(null); setEditing(null); setAdding(kind); setDraft({}); };
  const formButtons = (onSave: () => void) => (
    <div className="flex gap-2 mt-3">
      <button type="button" data-testid="sheet-save" disabled={pending} onClick={onSave} className={btn}>Enregistrer</button>
      <button type="button" onClick={() => { setEditing(null); setAdding(null); }} className="border border-slate-300 text-slate-800 text-[12px] px-3 py-1.5 rounded">Annuler</button>
    </div>
  );
  const editBtn = (which: "base" | "personal" | "employment", allowed: boolean) => allowed && editing !== which ? <button type="button" data-testid={`edit-${which}`} onClick={() => startEdit(which)} className={`${link} text-[#0d2644]`}>Modifier</button> : null;
  const addBtn = (kind: RowKind, allowed: boolean) => allowed && adding !== kind ? <button type="button" data-testid={`add-${kind}`} onClick={() => startAdd(kind)} className={`${link} text-[#0d2644]`}>Ajouter</button> : null;
  const addRow = (kind: RowKind) => run(() => addRowAction(sheet.userId, kind, draft), () => { setAdding(null); setDraft({}); });
  const delRow = (kind: RowKind, id: string) => run(() => deleteRowAction(sheet.userId, kind, id), undefined, "Supprimer cette ligne ?");
  const delBtn = (kind: RowKind, id: string, allowed: boolean) => allowed ? <button type="button" disabled={pending} aria-label="Supprimer la ligne" data-testid={`del-${kind}`} onClick={() => delRow(kind, id)} className={`${link} text-red-700`}>Supprimer</button> : null;

  const age = sheet.birthDate ? ageFrom(sheet.birthDate, today) : null;

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="flex items-center gap-4 mb-1">
        <Avatar src={sheet.avatarUrl} firstName={sheet.firstName} lastName={sheet.lastName} className="w-20 h-20 text-2xl" />
        <div>
          <h1 data-testid="sheet-name" className="text-xl font-bold text-slate-900">{sheet.firstName} {sheet.lastName}</h1>
          <p className="text-[13px] text-slate-600">{sheet.grade} · {sheet.station}</p>
          <p className="text-[12px] font-mono text-slate-500">{sheet.fpId}</p>
        </div>
      </div>

      {msg && <p role="status" data-testid="sheet-msg" className={`text-[13px] ${msg.ok ? "text-green-800" : "text-red-700"}`}>{msg.text}</p>}

      <Section n={0} title="Base" action={editBtn("base", canEditPersonal)}>
        {editing === "base" ? (
          <div>
            <label className={lbl} htmlFor="f-dbStatus">Statut de la fiche</label>
            <select id="f-dbStatus" className={input} value={draft.dbStatus ?? ""} onChange={(e) => set("dbStatus", e.target.value)}>
              {DB_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {formButtons(() => run(() => saveBaseAction(sheet.userId, draft), () => setEditing(null)))}
          </div>
        ) : (
          <Dl>
            <Row label="Photo">{sheet.avatarUrl ? "Définie" : "Aucune"} <span className="text-[12px] text-slate-500">(modifiable par un modérateur)</span></Row>
            <Row label="Statut de la fiche"><span data-testid="db-status" className={sheet.dbStatus === "actif" ? "font-bold text-green-800" : "font-bold text-amber-700"}>{labelOf(DB_STATUSES, sheet.dbStatus)}</span></Row>
            <Row label="ID"><span className="font-mono">{sheet.fpId}</span></Row>
          </Dl>
        )}
      </Section>

      <Section n={1} title="Informations personnelles" action={editBtn("personal", canEditPersonal)}>
        {editing === "personal" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {isStaff ? <>{field("firstName", "Prénom", "text", { maxLength: 60 })}{field("lastName", "Nom", "text", { maxLength: 60 })}</> : null}
            {field("badge", "Numéro de badge", "text", { maxLength: 20 })}
            {field("birthDate", "Date de naissance", "date")}
            <div className="sm:col-span-2">{field("languages", "Langues parlées", "text", { maxLength: 120, placeholder: "Ex. Anglais, Espagnol" })}</div>
            {field("phone", "Numéro de téléphone", "tel", { maxLength: 30 })}
            {field("phone2", "Numéro de téléphone 2", "tel", { maxLength: 30 })}
            <div className="sm:col-span-2">{field("address", "Adresse (confidentielle)", "text", { maxLength: 200 })}</div>
            <div className="sm:col-span-2">{formButtons(() => run(() => savePersonalAction(sheet.userId, draft), () => setEditing(null)))}</div>
          </div>
        ) : (
          <Dl>
            <Row label="Nom Prénom">{sheet.lastName} {sheet.firstName}</Row>
            <Row label="Numéro de badge">{sheet.badge || "—"}</Row>
            <Row label="Date de naissance">{sheet.birthDate ? <>{fmtDate(sheet.birthDate)} <span data-testid="age" className="text-slate-500">({age} ans)</span></> : "—"}</Row>
            <Row label="Langues parlées">{sheet.languages || "—"}</Row>
            <Row label="Téléphone">{sheet.phone || "—"}</Row>
            <Row label="Téléphone 2">{sheet.phone2 || "—"}</Row>
            <Row label="Adresse">{sheet.address === null ? <Confidential /> : sheet.address || "—"}</Row>
          </Dl>
        )}
      </Section>

      <Section n={2} title="Informations sur l'emploi" action={editBtn("employment", isStaff)}>
        {editing === "employment" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={lbl} htmlFor="f-employmentStatus">Statut actuel</label>
              <select id="f-employmentStatus" className={input} value={draft.employmentStatus ?? ""} onChange={(e) => set("employmentStatus", e.target.value)}>{EMPLOYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            {field("hiredOn", "Date de recrutement", "date")}
            <div><label className={lbl} htmlFor="f-rankId">Rang</label>
              {ranks.length ? (
                <select id="f-rankId" className={input} value={draft.rankId ?? ""} onChange={(e) => set("rankId", e.target.value)}>
                  {!sheet.rankId && <option value="">Non classé ({sheet.grade})</option>}
                  {ranks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              ) : <p className="text-[12px] text-slate-500">Aucun rang configuré (Administration &gt; Rangs).</p>}</div>
            {field("station", "Station", "text", { maxLength: 60 })}
            {field("bureau", "Bureau", "text", { maxLength: 60 })}
            <div className="sm:col-span-2">{formButtons(() => run(() => saveEmploymentAction(sheet.userId, draft), () => setEditing(null)))}</div>
          </div>
        ) : (
          <Dl>
            <Row label="Statut actuel">{labelOf(EMPLOYMENT_STATUSES, sheet.employmentStatus)}</Row>
            <Row label="Date de recrutement">{fmtDate(sheet.hiredOn)}</Row>
            <Row label="Rang">{sheet.grade}</Row>
            <Row label="Station">{sheet.station}</Row>
            <Row label="Bureau">{sheet.bureau}</Row>
          </Dl>
        )}
      </Section>

      <Section n={3} title="Historique" action={addBtn("history", isStaff)}>
        {adding === "history" && (
          <div className="grid gap-3 sm:grid-cols-3 mb-3 bg-slate-50 border border-slate-200 rounded p-3">
            {field("date", "Date", "date")}{field("rank", "Rang", "text", { maxLength: 60 })}{field("assignment", "Affectation", "text", { maxLength: 120 })}
            <div className="sm:col-span-3">{formButtons(() => addRow("history"))}</div>
          </div>
        )}
        {sheet.history.length === 0 ? <p className="text-[13px] text-slate-500">Aucune ligne.</p> : (
          <table className="w-full text-[13px] text-slate-900"><thead><tr className="text-left text-slate-500"><th className="font-bold pb-1">Date</th><th className="font-bold pb-1">Rang</th><th className="font-bold pb-1">Affectation</th><th /></tr></thead>
            <tbody>{sheet.history.map((h) => <tr key={h.id} data-testid="row-history" className="border-t border-slate-100"><td className="py-1.5">{fmtDate(h.date)}</td><td>{h.rank || "—"}</td><td>{h.assignment || "—"}</td><td className="text-right">{delBtn("history", h.id, isStaff)}</td></tr>)}</tbody></table>
        )}
      </Section>

      <Section n={4} title="Affectations" action={addBtn("assignments", isStaff)}>
        {adding === "assignments" && (
          <div className="grid gap-3 sm:grid-cols-3 mb-3 bg-slate-50 border border-slate-200 rounded p-3">
            {field("unit", "Unité", "text", { maxLength: 80 })}{field("startedOn", "Date rejoint", "date")}{field("endedOn", "Date de fin (vide = en cours)", "date")}
            <div className="sm:col-span-3">{formButtons(() => addRow("assignments"))}</div>
          </div>
        )}
        {sheet.assignments.length === 0 ? <p className="text-[13px] text-slate-500">Aucune ligne.</p> : (
          <table className="w-full text-[13px] text-slate-900"><thead><tr className="text-left text-slate-500"><th className="font-bold pb-1">Unité</th><th className="font-bold pb-1">Rejoint</th><th className="font-bold pb-1">Fin</th><th /></tr></thead>
            <tbody>{sheet.assignments.map((a) => (
              <tr key={a.id} data-testid="row-assignments" className="border-t border-slate-100"><td className="py-1.5">{a.unit}</td><td>{fmtDate(a.startedOn)}</td>
                <td>{a.endedOn ? fmtDate(a.endedOn) : <span className="font-bold text-green-800">En cours</span>}</td>
                <td className="text-right whitespace-nowrap">
                  {isStaff && !a.endedOn && <button type="button" disabled={pending} data-testid="end-assignment" onClick={() => run(() => endAssignmentAction(sheet.userId, a.id, today))} className={`${link} text-[#0d2644] mr-3`}>Terminer aujourd&apos;hui</button>}
                  {delBtn("assignments", a.id, isStaff)}</td></tr>))}</tbody></table>
        )}
      </Section>

      <Section n={5} title="Discipline" action={canConfidential ? addBtn("discipline", isStaff) : null}>
        {sheet.discipline === null ? <p className="text-[13px]"><Confidential /></p> : (
          <>
            {adding === "discipline" && (
              <div className="grid gap-3 sm:grid-cols-2 mb-3 bg-slate-50 border border-slate-200 rounded p-3">
                {field("date", "Date", "date")}{field("sanction", "Sanction", "text", { maxLength: 100 })}
                <div className="sm:col-span-2">{field("details", "Détails", "text", { maxLength: 500 })}</div>
                <div className="sm:col-span-2">{formButtons(() => addRow("discipline"))}</div>
              </div>
            )}
            {sheet.discipline.length === 0 ? <p className="text-[13px] text-slate-500">Aucune sanction.</p> : (
              <ul className="flex flex-col gap-2">{sheet.discipline.map((d) => (
                <li key={d.id} data-testid="row-discipline" className="flex gap-3 text-[13px] text-slate-900 border-t border-slate-100 pt-2"><span className="w-36 shrink-0 text-slate-600">{fmtDate(d.date)}</span><span className="flex-1"><strong>{d.sanction}</strong>{d.details ? ` — ${d.details}` : ""}</span>{delBtn("discipline", d.id, isStaff)}</li>))}</ul>
            )}
          </>
        )}
      </Section>

      <Section n={6} title="Contacts d'urgence" action={canConfidential ? addBtn("contacts", canEditPersonal) : null}>
        {sheet.contacts === null ? <p className="text-[13px]"><Confidential /></p> : (
          <>
            {adding === "contacts" && (
              <div className="grid gap-3 sm:grid-cols-3 mb-3 bg-slate-50 border border-slate-200 rounded p-3">
                {field("name", "Prénom Nom", "text", { maxLength: 100 })}{field("address", "Adresse", "text", { maxLength: 200 })}{field("phone", "Téléphone", "tel", { maxLength: 30 })}
                <div className="sm:col-span-3">{formButtons(() => addRow("contacts"))}</div>
              </div>
            )}
            {sheet.contacts.length === 0 ? <p className="text-[13px] text-slate-500">Aucun contact.</p> : (
              <ul className="grid gap-3 sm:grid-cols-2">{sheet.contacts.map((c) => (
                <li key={c.id} data-testid="row-contacts" className="border border-slate-200 rounded p-3 text-[13px] text-slate-900"><p className="font-bold">{c.name}</p><p>{c.phone}</p>{c.address && <p className="text-slate-600">{c.address}</p>}<div className="mt-1">{delBtn("contacts", c.id, canEditPersonal)}</div></li>))}</ul>
            )}
          </>
        )}
      </Section>
    </div>
  );
}
