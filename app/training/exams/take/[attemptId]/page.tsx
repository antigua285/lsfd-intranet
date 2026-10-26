import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access";
import { closeExpiredAttempts, getAttempt, isMissingExamsTableError } from "@/lib/exams";
import { toPublicQuestions } from "@/lib/exams-validation";
import type { Attempt } from "@/lib/exams-types";
import { UUID_PATTERN } from "@/lib/validation";
import { ExamTaker } from "../../ExamTaker";

export const metadata = { title: "Examen en cours | LSFD Intranet" };

export default function TakePage({ params }: { params: Promise<{ attemptId: string }> }) {
  return (
    <div className="max-w-3xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ attemptId: string }> }) {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  const { attemptId } = await params;
  if (!UUID_PATTERN.test(attemptId)) notFound();
  let attempt: Attempt | null = null;
  try {
    await closeExpiredAttempts();
    attempt = await getAttempt(attemptId);
  } catch (error) {
    if (!isMissingExamsTableError(error)) throw error;
  }
  if (!attempt || attempt.userId !== ctx.user.id) notFound();
  if (attempt.status !== "in_progress") redirect(`/training/exams/attempt/${attempt.id}`);

  return (
    <ExamTaker
      attemptId={attempt.id}
      title={attempt.snapshot.title}
      candidate={attempt.candidate}
      // Jamais les bonnes réponses : uniquement la version publique des questions.
      questions={toPublicQuestions(attempt.snapshot.questions)}
      initialAnswers={attempt.answers}
      deadlineMs={attempt.deadline ? new Date(attempt.deadline).getTime() : null}
      // heure du serveur : sert à corriger l'écart d'horloge du navigateur pour le chronomètre
      // eslint-disable-next-line react-hooks/purity
      serverNowMs={Date.now()}
    />
  );
}
