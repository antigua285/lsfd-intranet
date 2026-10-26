import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { closeExpiredAttempts, isMissingExamsTableError, listAttempts } from "@/lib/exams";
import { STATUS_LABEL, VERDICT_LABEL, type AttemptStatus, type AttemptSummary } from "@/lib/exams-types";

export const metadata = { title: "Correction des examens | LSFD Intranet" };

type SP = Promise<{ [key: string]: string | string[] | undefined }>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function ReviewPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="max-w-5xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Link href="/training/exams" className="text-[12px] text-slate-500 hover:underline">← Examens</Link>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Correction des examens</h1>
      <p className="text-sm text-slate-500 mb-4">Réservé à la Training Division et aux modérateurs.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: SP }) {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  if (!isTrainer(ctx)) notFound();
  const sp = await searchParams;
  const status: AttemptStatus | undefined = first(sp.status) === "sent" ? "sent" : first(sp.status) === "all" ? undefined : "submitted";
  const search = first(sp.q).trim().slice(0, 100);
  let rows: AttemptSummary[] = [];
  try {
    await closeExpiredAttempts();
    rows = await listAttempts({ status, search: search || undefined });
  } catch (error) {
    if (!isMissingExamsTableError(error)) throw error;
  }
  const tab = (value: string, label: string, active: boolean) => (
    <Link href={`/training/exams/review?status=${value}${search ? `&q=${encodeURIComponent(search)}` : ""}`} aria-current={active ? "page" : undefined}
      className={`px-3 py-1.5 rounded text-[13px] ${active ? "bg-[#0d2644] text-white font-bold" : "text-slate-700 hover:bg-slate-100"}`}>{label}</Link>
  );
  const current = first(sp.status) === "sent" ? "sent" : first(sp.status) === "all" ? "all" : "submitted";
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {tab("submitted", "À corriger", current === "submitted")}
        {tab("sent", "Résultats envoyés", current === "sent")}
        {tab("all", "Tous", current === "all")}
        <form method="get" className="ml-auto flex gap-2">
          <input type="hidden" name="status" value={current} />
          <input name="q" defaultValue={search} placeholder="Candidat ou examen…" aria-label="Rechercher" className="border border-slate-300 rounded px-2 py-1.5 text-[13px]" />
          <button className="bg-[#0d2644] text-white text-[12px] font-bold uppercase rounded px-3">Chercher</button>
        </form>
      </div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucun passage.</p>
      ) : (
        <table className="w-full text-[13px] border border-slate-200">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-600">
            <tr><th className="p-2">Rendu le</th><th className="p-2">Examen</th><th className="p-2">Candidat</th><th className="p-2">État</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} data-testid="review-row" className="hover:bg-slate-50">
                <td className="p-2 whitespace-nowrap">
                  <Link href={`/training/exams/review/${r.id}`} className="text-[#0d2644] font-bold hover:underline">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </Link>
                </td>
                <td className="p-2">{r.examTitle}</td>
                <td className="p-2">{r.candidate.name} <span className="text-slate-500">({r.candidate.grade})</span></td>
                <td className="p-2">
                  <span className={`text-[11px] font-bold rounded px-2 py-0.5 ${r.status === "submitted" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[r.status]}</span>
                  {r.status === "sent" && r.verdict && <span className="ml-2 text-[11px] text-slate-600">{VERDICT_LABEL[r.verdict]}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
