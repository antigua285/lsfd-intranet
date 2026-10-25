"use client";

import { useRef, useState } from "react";
import { FormPaper } from "@/components/FormPaper";
import { downloadPdf, downloadPng, fileBaseName } from "@/lib/export-paper";
import type { Submission } from "@/lib/forms-types";

/** Rapport sur « papier officiel » + boutons de téléchargement PDF et PNG. */
export function ReportViewer({ submission }: { submission: Submission }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "pdf" | "png") {
    if (!paperRef.current) return;
    setBusy(kind);
    setError(null);
    try {
      const base = fileBaseName(submission.formTitle, submission.id);
      if (kind === "pdf") await downloadPdf(paperRef.current, base);
      else await downloadPng(paperRef.current, base);
    } catch {
      setError("Le téléchargement a échoué. Réessaie, ou essaie un autre navigateur.");
    } finally {
      setBusy(null);
    }
  }

  const btn =
    "bg-[#0d2644] text-white text-[12px] font-bold uppercase tracking-wide rounded px-4 py-2 hover:bg-[#143a66] disabled:opacity-50 transition-colors";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button type="button" className={btn} disabled={busy !== null} onClick={() => run("pdf")}>
          {busy === "pdf" ? "Création du PDF…" : "Télécharger en PDF"}
        </button>
        <button type="button" className={btn} disabled={busy !== null} onClick={() => run("png")}>
          {busy === "png" ? "Création de l'image…" : "Télécharger en PNG"}
        </button>
        {error && <span role="alert" className="text-[13px] text-red-700">{error}</span>}
      </div>
      <div className="overflow-x-auto bg-slate-200 rounded p-4">
        <div className="shadow-lg w-fit mx-auto">
          <FormPaper ref={paperRef} content={submission.snapshot} answers={submission.answers} labels={submission.labels} />
        </div>
      </div>
    </div>
  );
}
