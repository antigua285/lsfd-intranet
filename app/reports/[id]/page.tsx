import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access";
import { getSubmission, isMissingFormsTableError } from "@/lib/forms";
import type { Submission } from "@/lib/forms-types";
import { UUID_PATTERN } from "@/lib/validation";
import { ReportAdminControls } from "../ReportAdminControls";
import { ReportViewer } from "../ReportViewer";

export const metadata = { title: "Rapport | LSFD Intranet" };

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-5xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <ReportContent params={params} />
      </Suspense>
    </div>
  );
}

async function ReportContent({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  const me = ctx.user;
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  let submission: Submission | null = null;
  try {
    submission = await getSubmission(id);
  } catch (error) {
    if (!isMissingFormsTableError(error)) throw error;
  }
  // Visible par : les modérateurs, son auteur, et les détenteurs d'un flag du formulaire.
  const isHolder = !!submission && submission.formFlags.some((flag) => ctx.flags.includes(flag));
  if (!submission || (!me.isAdmin && submission.submittedBy !== me.id && !isHolder)) notFound();

  const sentAt = new Date(submission.createdAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  return (
    <>
      <Link href={me.isAdmin ? "/admin/reports" : "/forms"} className="text-[12px] text-slate-500 hover:underline">
        ← {me.isAdmin ? "Rapports reçus" : "Rapports & formulaires"}
      </Link>
      <div className="mt-2 mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 uppercase">{submission.formTitle}</h1>
          <p className="text-sm text-slate-500">
            Envoyé par {submission.submitterName} le {sentAt}
            {me.isAdmin && (
              <span className={`ml-2 text-[11px] font-bold rounded px-2 py-0.5 ${submission.status === "new" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                {submission.status === "new" ? "Nouveau" : "Traité"}
              </span>
            )}
          </p>
        </div>
        {me.isAdmin && <ReportAdminControls id={submission.id} status={submission.status} />}
      </div>

      {submission.effects.length > 0 && (
        <section aria-label="Mises à jour de la carte" className="mb-4 border border-slate-200 rounded bg-slate-50 p-3 text-[13px]">
          <p className="text-[12px] font-bold uppercase tracking-wide text-slate-600 mb-1">Mises à jour de la carte</p>
          <ul className="list-disc pl-5">
            {submission.effects.map((effect) => (
              <li key={effect.actionId} className={effect.ok ? "text-slate-700" : "text-red-700"}>{effect.message}</li>
            ))}
          </ul>
        </section>
      )}

      <ReportViewer submission={submission} />
    </>
  );
}
