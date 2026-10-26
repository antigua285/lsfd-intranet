"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startPracticalAction } from "./actions";

export type PracticalExam = { id: string; title: string; criteria: number };
export type PracticalUser = { id: string; label: string };

const INPUT = "border border-slate-300 rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#0d2644]";

/** Ouvre une évaluation pratique : choix de l'examen (et du membre, sauf s'il est imposé), puis grille de correction. */
export function StartPractical({ exams, users, fixedUser, from }: { exams: PracticalExam[]; users?: PracticalUser[]; fixedUser?: PracticalUser; from?: string }) {
  const router = useRouter();
  const [examId, setExamId] = useState(exams[0]?.id ?? "");
  const [userId, setUserId] = useState(fixedUser?.id ?? "");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (exams.length === 0) return <p className="text-[13px] text-slate-500">Aucun examen pratique disponible pour toi.</p>;
  const needle = search.trim().toLowerCase();
  const shown = (users ?? []).filter((u) => !needle || u.label.toLowerCase().includes(needle)).slice(0, 200);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const r = await startPracticalAction(examId, userId);
      if (!r.ok) return setError(r.error);
      router.push(`/training/exams/review/${r.attemptId}${from ? `?from=${from}` : ""}`);
    } catch {
      setError("L'action a échoué (session expirée ?).");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="start-practical" className="flex flex-col gap-3">
      <label className="text-[12px] text-slate-600">Examen pratique
        <select aria-label="Examen pratique" className={`${INPUT} w-full mt-0.5`} value={examId} onChange={(e) => setExamId(e.target.value)}>
          {exams.map((e) => <option key={e.id} value={e.id}>{e.title} ({e.criteria} critère{e.criteria > 1 ? "s" : ""})</option>)}
        </select>
      </label>
      {fixedUser ? (
        <p className="text-[13px]">Membre évalué : <strong>{fixedUser.label}</strong></p>
      ) : (
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-slate-600">Membre à évaluer
            <input aria-label="Rechercher un membre" placeholder="Rechercher un nom…" className={`${INPUT} w-full mt-0.5`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select aria-label="Membre à évaluer" size={6} className={`${INPUT} w-full`} value={userId} onChange={(e) => setUserId(e.target.value)}>
            {shown.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
      )}
      {error && <p role="alert" className="text-[12px] text-red-700">{error}</p>}
      <button type="button" disabled={busy || !examId || !userId} onClick={start}
        className="self-start bg-[#0d2644] text-white text-[12px] font-bold uppercase tracking-wide rounded px-5 py-2 hover:bg-[#143a66] disabled:opacity-50">
        {busy ? "Ouverture…" : "Commencer l'évaluation"}
      </button>
    </div>
  );
}
