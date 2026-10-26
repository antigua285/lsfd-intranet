import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { getTemplate, isMissingProbationTableError, type TemplateCategory } from "@/lib/probation";
import { TemplateEditor } from "./TemplateEditor";

export const metadata = { title: "Modèle de probation | LSFD Intranet" };

export default function TemplatePage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Link href="/training/probation" className="text-[12px] text-slate-500 hover:underline">← Probation</Link>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Modèle de probation</h1>
      <p className="text-sm text-slate-500 mb-6">Catégories et checklists communes à tous les carnets. Supprimer une compétence la retire aussi du calcul de progression.</p>
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
  let template: TemplateCategory[] = [];
  try {
    template = await getTemplate();
  } catch (error) {
    if (!isMissingProbationTableError(error)) throw error;
    return <p className="text-[13px] text-slate-600">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</p>;
  }
  return <TemplateEditor initial={template} />;
}
