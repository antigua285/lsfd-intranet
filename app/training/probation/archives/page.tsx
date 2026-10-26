import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { computeProgress, isMissingProbationTableError, listNotebooks, type NotebookRow } from "@/lib/probation";
import { ArchiveActions } from "./ArchiveActions";

export const metadata = { title: "Archives de probation | LSFD Intranet" };

export default function ArchivesPage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Link href="/training/probation" className="text-[12px] text-slate-500 hover:underline">← Probation</Link>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Archives</h1>
      <p className="text-sm text-slate-500 mb-6">Carnets archivés : consultables et restaurables, jamais perdus sans action explicite d&apos;un modérateur.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  if (!isTrainer(ctx)) notFound();
  let notebooks: NotebookRow[] = [];
  try {
    notebooks = await listNotebooks(true);
  } catch (error) {
    if (!isMissingProbationTableError(error)) throw error;
    return <p className="text-[13px] text-slate-600">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</p>;
  }
  if (notebooks.length === 0) return <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucun carnet archivé.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {notebooks.map((nb) => {
        const p = computeProgress(nb.snapshot?.categories ?? [], nb.checked);
        return (
          <li key={nb.id} data-testid="archived-row" className="border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-3">
            <Link href={`/training/probation/${nb.id}`} className="flex-1 min-w-[200px]">
              <span className="text-[15px] font-bold text-slate-800 hover:underline">{nb.ownerName}</span>
              <span className="block text-[12px] text-slate-500">
                Archivé le {new Date(nb.archivedAt!).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}{nb.archivedBy && ` par ${nb.archivedBy}`} · {p.done}/{p.total} ({Math.floor(p.percent)} %){p.eligible && " · éligible phase deux"}
              </span>
            </Link>
            <ArchiveActions id={nb.id} isAdmin={ctx.user.isAdmin} />
          </li>
        );
      })}
    </ul>
  );
}
