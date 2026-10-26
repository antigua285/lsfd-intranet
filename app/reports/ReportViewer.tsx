"use client";

import { useEffect, useRef, useState } from "react";
import { FormPaper, PAPER_HEIGHT, PAPER_MARGIN, PAPER_WIDTH } from "@/components/FormPaper";
import { downloadPdf, downloadPng, fileBaseName, planPages } from "@/lib/export-paper";
import type { Submission } from "@/lib/forms-types";

/** Rapport sur « papier officiel » + boutons de téléchargement PDF et PNG. */
export function ReportViewer({ submission }: { submission: Submission }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Découpage en pages Letter, calculé sur un exemplaire invisible du papier (les images chargées changent la hauteur).
  const [pages, setPages] = useState<{ from: number; to: number }[] | null>(null);

  useEffect(() => {
    const el = paperRef.current;
    if (!el) return;
    const compute = () => {
      const box = el.getBoundingClientRect();
      const rows = [...el.querySelectorAll<HTMLElement>("[data-row]")].map((r) => {
        const b = r.getBoundingClientRect();
        return { top: b.top - box.top, bottom: b.bottom - box.top };
      });
      const next = planPages(rows, el.scrollHeight);
      setPages((prev) => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    const observer = new ResizeObserver(compute); // se déclenche aussi au premier affichage
    observer.observe(el);
    void document.fonts?.ready.then(compute);
    return () => observer.disconnect();
  }, []);

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
      {/* Exemplaire invisible : sert à mesurer le découpage et à fabriquer les PDF / PNG. */}
      <div aria-hidden style={{ height: 0, overflow: "hidden" }}>
        <FormPaper ref={paperRef} testId="form-paper-source" content={submission.snapshot} answers={submission.answers} labels={submission.labels} />
      </div>
      <div className="overflow-x-auto bg-slate-200 rounded p-4">
        {!pages && <p className="text-[13px] text-slate-500 text-center py-8">Mise en page…</p>}
        <div className="flex flex-col items-center gap-5 w-fit mx-auto">
          {pages?.map((page, index) => (
            <div key={index} data-testid="report-page">
              <div className="bg-white shadow-lg relative overflow-hidden" style={{ width: PAPER_WIDTH, height: PAPER_HEIGHT }}>
                <div style={{ position: "absolute", left: 0, top: index === 0 ? 0 : PAPER_MARGIN, width: PAPER_WIDTH, height: page.to - page.from, overflow: "hidden" }}>
                  <div style={{ marginTop: -page.from }}>
                    <FormPaper content={submission.snapshot} answers={submission.answers} labels={submission.labels} />
                  </div>
                </div>
              </div>
              {pages.length > 1 && <p className="text-center text-[12px] text-slate-600 mt-1.5">Page {index + 1} / {pages.length}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
