import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { notFound, redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access";
import { closeExpiredAttempts, countAttempts, getExam, isAssigned, isMissingExamsTableError } from "@/lib/exams";
import { formatPoints, totalPoints } from "@/lib/exams-types";
import { UUID_PATTERN } from "@/lib/validation";
import { StartExam } from "../StartExam";

export const metadata = { title: "Examen | LSFD Intranet" };

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-2xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Breadcrumb items={[{ label: "Formation", href: "/training" }, { label: "Examens", href: "/training/exams" }, { label: "Passer l'examen" }]} />
      <Suspense fallback={<p className="text-sm text-slate-500 mt-3">Chargement…</p>}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  let exam, counts;
  try {
    await closeExpiredAttempts();
    exam = await getExam(id);
    if (exam && (await isAssigned(id, ctx.user.id))) counts = await countAttempts(id, ctx.user.id);
  } catch (error) {
    if (isMissingExamsTableError(error)) notFound();
    throw error;
  }
  if (!exam || !counts || !exam.published || !exam.hasKey || exam.questions.length === 0) notFound();
  const { user } = ctx;
  const left = Math.max(0, exam.maxAttempts - counts.total);
  return (
    <>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">{exam.title}</h1>
      {exam.description && <p className="text-[14px] text-slate-700 whitespace-pre-wrap mt-2">{exam.description}</p>}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] mt-4 border border-slate-200 rounded p-3">
        <dt className="text-slate-500">Questions</dt><dd>{exam.questions.length}</dd>
        <dt className="text-slate-500">Total</dt><dd>{formatPoints(totalPoints(exam.questions))} points</dd>
        <dt className="text-slate-500">Durée</dt><dd>{exam.durationMinutes ? `${exam.durationMinutes} minutes (chronomètre dès le départ)` : "Sans limite de temps"}</dd>
        <dt className="text-slate-500">Tentatives</dt><dd>{counts.total} / {exam.maxAttempts}</dd>
      </dl>

      <section aria-label="En-tête du candidat" className="mt-4 border border-slate-300 rounded p-3 text-[13px]">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Candidat (repris de ton profil)</p>
        <p><strong>{user.firstName} {user.lastName}</strong></p>
        <p className="text-slate-600">{user.grade} | {user.station}</p>
      </section>

      <div className="mt-5">
        {counts.inProgressId ? (
          <StartExam examId={exam.id} resume />
        ) : left > 0 ? (
          <StartExam examId={exam.id} />
        ) : (
          <p className="text-[13px] text-slate-600 border border-slate-200 rounded p-3">Tu as utilisé toutes tes tentatives pour cet examen. Retrouve tes résultats dans « Mes examens ».</p>
        )}
      </div>
    </>
  );
}
