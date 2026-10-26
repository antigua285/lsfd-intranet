"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteArchivedAction, restoreAction } from "../actions";

export function ArchiveActions({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const btn = "text-[12px] font-bold border border-slate-300 rounded px-2.5 py-1 hover:bg-slate-50 disabled:opacity-50";

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError("");
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) return setError(r.error);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span role="alert" className="text-[12px] text-red-700">{error}</span>}
      <button type="button" className={btn} disabled={pending} data-testid="restore" onClick={() => run(() => restoreAction(id))}>Restaurer</button>
      {isAdmin && (
        <button type="button" className={`${btn} text-red-700`} disabled={pending} data-testid="delete-archived" onClick={() => { if (window.confirm("Supprimer définitivement ce carnet et ses commentaires ? Action irréversible.")) run(() => deleteArchivedAction(id)); }}>Supprimer</button>
      )}
    </div>
  );
}
