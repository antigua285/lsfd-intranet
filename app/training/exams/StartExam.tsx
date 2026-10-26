"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startExamAction } from "./actions";

export function StartExam({ examId, resume = false }: { examId: string; resume?: boolean }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await startExamAction(examId, key);
      if (!result.ok) return setError(result.error);
      router.push(`/training/exams/take/${result.attemptId}`);
    } catch {
      setError("Impossible de démarrer (session expirée ?).");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={start} className="flex flex-col gap-3">
      {resume ? (
        <p className="text-[13px] text-slate-700">Un passage est déjà en cours : tu peux le reprendre là où tu t&apos;étais arrêté.</p>
      ) : (
        <label className="text-[13px] font-bold text-slate-700">Clé d&apos;accès
          <input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} maxLength={64}
            className="block w-full max-w-xs mt-1 border border-slate-300 rounded px-3 py-2 text-[14px] font-normal focus:outline-none focus:border-[#0d2644]" />
        </label>
      )}
      {error && <p role="alert" className="text-[13px] text-red-700">{error}</p>}
      <button type="submit" disabled={busy || (!resume && !key.trim())} className="self-start bg-[#0d2644] text-white text-[13px] font-bold uppercase tracking-wide rounded px-5 py-2 hover:bg-[#143a66] disabled:opacity-50">
        {busy ? "Vérification…" : resume ? "Reprendre l'examen" : "Commencer l'examen"}
      </button>
    </form>
  );
}
