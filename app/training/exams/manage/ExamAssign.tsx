"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignExamAction, unassignExamAction } from "./actions";

export type AssignedRow = { userId: string; name: string; grade: string; station: string; label: string };
export type UserChoice = { id: string; label: string };

/** Clé d'accès (copiable) + assignation d'un examen. */
export function ExamAssign({ examId, accessKey, legacyKey, assigned, users }: {
  examId: string; accessKey: string | null; legacyKey: boolean; assigned: AssignedRow[]; users: UserChoice[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const taken = new Set(assigned.map((a) => a.userId));
  const needle = search.trim().toLowerCase();
  const choices = users.filter((u) => !taken.has(u.id) && (!needle || u.label.toLowerCase().includes(needle)));

  async function copy(what: string, text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(what); window.setTimeout(() => setCopied(null), 1500); } catch { /* presse-papiers indisponible */ }
  }
  async function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) {
    setBusy(true); setMessage(null);
    try {
      const r = await work();
      setMessage(r.ok ? { ok: true, text: success } : { ok: false, text: r.error });
      if (r.ok) { setUserId(""); router.refresh(); }
    } catch { setMessage({ ok: false, text: "L'action a échoué (session expirée ?)." }); }
    finally { setBusy(false); }
  }

  const BTN = "border border-slate-300 text-slate-700 text-[12px] font-bold rounded px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40";
  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-500">Clé d&apos;accès :</span>
        {accessKey ? (
          <>
            <code data-testid="exam-key" className="bg-slate-100 border border-slate-200 rounded px-2 py-1 text-[14px] font-bold tracking-wide">{accessKey}</code>
            <button type="button" className={BTN} onClick={() => copy("key", accessKey)}>{copied === "key" ? "Copié ✓" : "Copier"}</button>
          </>
        ) : (
          <span className="text-amber-700">{legacyKey ? "ancienne clé illisible : un modérateur doit en saisir une nouvelle dans l'éditeur" : "aucune clé définie"}</span>
        )}
        <button type="button" className={BTN} onClick={() => copy("link", `${window.location.origin}/training/exams/${examId}`)}>{copied === "link" ? "Lien copié ✓" : "Copier le lien de l'examen"}</button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[12px] text-slate-600">Chercher un membre
          <input aria-label="Chercher un membre" className="block border border-slate-300 rounded px-2 py-1.5 text-[13px]" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="text-[12px] text-slate-600">Assigner à
          <select aria-label="Membre à assigner" className="block border border-slate-300 rounded px-2 py-1.5 text-[13px] min-w-56" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— choisir —</option>
            {choices.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </label>
        <button type="button" disabled={busy || !userId} className="bg-[#0d2644] text-white text-[12px] font-bold uppercase tracking-wide rounded px-4 py-2 disabled:opacity-40"
          onClick={() => run(() => assignExamAction(examId, userId), "Examen assigné.")}>Assigner</button>
        {message && <span role={message.ok ? "status" : "alert"} className={message.ok ? "text-green-700" : "text-red-700"}>{message.text}</span>}
      </div>

      {assigned.length === 0 ? (
        <p className="text-slate-500">Personne n&apos;a encore cet examen.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded">
          {assigned.map((a) => (
            <li key={a.userId} data-testid="assigned-row" className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 min-w-0 truncate"><strong>{a.name}</strong> <span className="text-slate-500">· {a.grade} | {a.station}</span></span>
              <span className="text-[12px] text-slate-600">{a.label}</span>
              <button type="button" disabled={busy} className="text-[12px] text-red-700 hover:underline" onClick={() => run(() => unassignExamAction(examId, a.userId), "Assignation retirée.")}>Retirer</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
