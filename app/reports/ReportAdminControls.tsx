"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteReportAction, setReportStatusAction } from "@/app/admin/reports/actions";

export function ReportAdminControls({ id, status }: { id: string; status: "new" | "reviewed" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    const result = await setReportStatusAction(id, status === "new" ? "reviewed" : "new");
    setBusy(false);
    if (!result.ok) return setError(result.error ?? "Erreur.");
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Supprimer définitivement ce rapport ?")) return;
    setBusy(true);
    const result = await deleteReportAction(id);
    setBusy(false);
    if (!result.ok) return setError(result.error ?? "Erreur.");
    router.push("/admin/reports");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} onClick={toggle} className="border border-slate-300 text-slate-700 text-[12px] font-bold uppercase tracking-wide rounded px-3 py-1.5 hover:bg-slate-100 disabled:opacity-50">
        {status === "new" ? "Marquer comme traité" : "Remettre en « nouveau »"}
      </button>
      <button type="button" disabled={busy} onClick={remove} className="border border-red-300 text-red-700 text-[12px] font-bold uppercase tracking-wide rounded px-3 py-1.5 hover:bg-red-50 disabled:opacity-50">
        Supprimer
      </button>
      {error && <span role="alert" className="text-[12px] text-red-700">{error}</span>}
    </div>
  );
}
