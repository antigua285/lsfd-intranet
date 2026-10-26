import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { notFound, redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { UUID_PATTERN } from "@/lib/validation";
import { getNotebook, getTemplate, isMissingProbationTableError, listComments, type Comment, type NotebookRow, type TemplateCategory } from "@/lib/probation";
import { NotebookView } from "./NotebookView";

export const metadata = { title: "Carnet de probation | LSFD Intranet" };

export default function NotebookPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  let nb: NotebookRow | null = null;
  let template: TemplateCategory[] = [];
  let comments: Comment[] = [];
  try {
    nb = await getNotebook(id);
    // Un carnet n'est lisible que par la TD (archivé ou non) et par son propriétaire tant qu'il est actif.
    if (!nb || !(isTrainer(ctx) || (nb.userId === ctx.user.id && !nb.archivedAt))) notFound();
    [template, comments] = await Promise.all([getTemplate(), listComments(id)]);
  } catch (error) {
    if (!isMissingProbationTableError(error)) throw error;
    return <p className="text-[13px] text-slate-600">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</p>;
  }
  const trainer = isTrainer(ctx);
  const archived = !!nb.archivedAt;
  return (
    <>
      <Breadcrumb
        items={
          trainer
            ? [{ label: "Formation", href: "/training" }, { label: "Espace TD", href: "/training/td" }, { label: "Probation", href: "/training/probation" }, ...(archived ? [{ label: "Archives", href: "/training/probation/archives" }] : []), { label: nb.ownerName }]
            : [{ label: "Formation", href: "/training" }, { label: "Mon carnet de probation" }]
        }
      />
      <NotebookView
        notebook={{ id: nb.id, ownerName: nb.ownerName, checked: nb.checked, createdAt: nb.createdAt, archivedAt: nb.archivedAt, archivedBy: nb.archivedBy }}
        categories={archived && nb.snapshot ? nb.snapshot.categories : template}
        comments={comments}
        trainer={trainer}
        canTick={trainer && !archived && nb.userId !== ctx.user.id}
        selfNotebook={nb.userId === ctx.user.id}
        currentUserId={ctx.user.id}
        isAdmin={ctx.user.isAdmin}
      />
    </>
  );
}
