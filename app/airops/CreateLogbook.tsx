"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLogbookAction } from "./actions";

/** Ouverture d'un carnet de vol pour un compte (AIROPSCMD). */
export function CreateLogbook({ candidates }: { candidates: { id: string; name: string; grade: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [userId, setUserId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  if (candidates.length === 0) return null;
  const go = () => start(async () => {
    const r = await createLogbookAction(userId);
    if (!r.ok) { setErr(r.error); return; }
    setErr(null);
    router.push(r.id ? `/airops/pilots/${r.id}` : "/airops");
  });
  return (
    <div className="flex flex-wrap items-end gap-2 mb-4 p-3 border border-slate-200 rounded bg-slate-50" data-testid="create-logbook">
      <label className="flex-1 min-w-56 text-[12px] font-bold text-slate-700">Ouvrir un carnet de vol
        <select value={userId} onChange={(e) => setUserId(e.target.value)} data-testid="logbook-user" className="mt-1 w-full border border-slate-300 rounded px-2 py-2 text-[13px] bg-white font-normal">
          <option value="">Choisir un compte…</option>
          {candidates.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.grade}</option>)}
        </select>
      </label>
      <button type="button" onClick={go} disabled={!userId || pending} data-testid="logbook-create" className="min-h-10 px-4 rounded bg-[#0d2644] text-white text-[13px] font-bold disabled:opacity-40">Ouvrir le carnet</button>
      {err && <p role="alert" className="w-full text-[12.5px] text-red-700">{err}</p>}
    </div>
  );
}
