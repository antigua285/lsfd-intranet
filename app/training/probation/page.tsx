import { Suspense } from "react";
import NextLink from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LinkButton } from "@/components/LinkButton";
import { redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { computeProgress, getNotebookOfUser, getTemplate, isMissingProbationTableError, listNotebooks, syncNotebooks, type NotebookRow, type TemplateCategory } from "@/lib/probation";

export const metadata = { title: "Probation | LSFD Intranet" };

const NOTICE = <p className="text-[13px] text-slate-600">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</p>;

export default function ProbationPage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={null}>
        <TrailTrainerAware />
      </Suspense>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Probation</h1>
      <Suspense fallback={<p className="text-sm text-slate-500 mt-4">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function TrailTrainerAware() {
  const ctx = await getAccessContext();
  const trainer = !!ctx && isTrainer(ctx);
  return <Breadcrumb items={trainer ? [{ label: "Formation", href: "/training" }, { label: "Espace TD", href: "/training/td" }, { label: "Probation" }] : [{ label: "Formation", href: "/training" }, { label: "Probation" }]} />;
}

async function Content() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  let notebooks: NotebookRow[] = [];
  let template: TemplateCategory[] = [];
  let own: NotebookRow | null = null;
  try {
    await syncNotebooks();
    if (isTrainer(ctx)) [notebooks, template] = await Promise.all([listNotebooks(false), getTemplate()]);
    else own = await getNotebookOfUser(ctx.user.id);
  } catch (error) {
    if (!isMissingProbationTableError(error)) throw error;
    return NOTICE;
  }
  if (!isTrainer(ctx)) {
    if (own) redirect(`/training/probation/${own.id}`);
    return <p data-testid="no-notebook" className="text-[13px] text-slate-500 border border-slate-200 rounded p-4 mt-4">Tu n&apos;as pas de carnet de probation. Il est créé automatiquement lorsque le flag <b>PROB</b> t&apos;est attribué.</p>;
  }
  return (
    <>
      <p className="text-sm text-slate-500 mb-4">Carnets des pompiers en probation. Les carnets sont créés automatiquement avec le flag <b>PROB</b>.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        <LinkButton href="/training/probation/template">Modifier le modèle</LinkButton>
        <LinkButton href="/training/probation/archives">Voir les archives</LinkButton>
      </div>
      {notebooks.length === 0 ? (
        <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucun carnet actif. Attribue le flag <b>PROB</b> à un compte (Admin → Utilisateurs) pour en créer un.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notebooks.map((nb) => {
            const p = computeProgress(template, nb.checked);
            return (
              <li key={nb.id}>
                <NextLink href={`/training/probation/${nb.id}`} data-testid="notebook-row" className="block border border-slate-200 rounded-lg p-3 hover:border-[#0d2644]">
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-bold text-slate-800 flex-1">{nb.ownerName}</span>
                    {p.eligible && <span className="text-[11px] font-bold rounded bg-green-100 text-green-800 px-2 py-0.5">Éligible phase deux</span>}
                    <span className="text-[13px] text-slate-600">{p.done}/{p.total} · {Math.floor(p.percent)} %</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded mt-2"><div className="h-full rounded bg-[#0d2644]" style={{ width: `${p.percent}%` }} /></div>
                </NextLink>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
