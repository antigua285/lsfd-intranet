import { Suspense } from "react";
import { TrailFromParams } from "@/components/TrailFromParams";
import { notFound, redirect } from "next/navigation";
import { canManageWith, getAccessContext, isTrainer } from "@/lib/access";
import { isMissingExamsTableError, listExams } from "@/lib/exams";
import { listUsers } from "@/lib/users";
import { StartPractical, type PracticalExam } from "./StartPractical";

export const metadata = { title: "Examens pratiques | LSFD Intranet" };

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

export default function PracticalPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="max-w-3xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={null}>
        <TrailFromParams page="practical" searchParams={searchParams} />
      </Suspense>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Examens pratiques</h1>
      <p className="text-sm text-slate-500 mb-6">
        L&apos;instructeur ouvre la grille pour un membre, note chaque critère, donne le résultat puis l&apos;envoie. Réservé à la Training Division et aux modérateurs.
      </p>
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
  let exams: PracticalExam[] = [];
  try {
    exams = (await listExams())
      .filter((e) => e.kind === "practical" && e.published && e.questions.length > 0 && canManageWith(ctx, e.manageFlags))
      .map((e) => ({ id: e.id, title: e.title, criteria: e.questions.length }));
  } catch (error) {
    if (!isMissingExamsTableError(error)) throw error;
    return <p className="text-[13px] text-slate-600">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</p>;
  }
  const users = (await listUsers()).filter((u) => u.id !== ctx.user.id || ctx.user.isAdmin).map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName} — ${u.grade}` }));
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <StartPractical exams={exams} users={users} />
      {ctx.user.isAdmin && <p className="text-[12px] text-slate-500 mt-4">Créer ou modifier un examen pratique : Admin → Examens (type « Pratique »).</p>}
    </div>
  );
}
