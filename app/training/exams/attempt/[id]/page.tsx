import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { notFound, redirect } from "next/navigation";
import { ExamQuestionHead } from "@/components/ExamQuestionHead";
import { getAccessContext, isTrainer } from "@/lib/access";
import { closeExpiredAttempts, getAttempt, isMissingExamsTableError, canManageExamId } from "@/lib/exams";
import { VERDICT_LABEL, answerLines, formatPoints, totalPoints, type Attempt } from "@/lib/exams-types";
import { UUID_PATTERN } from "@/lib/validation";

export const metadata = { title: "Mon examen | LSFD Intranet" };

export default function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-3xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Breadcrumb items={[{ label: "Formation", href: "/training" }, { label: "Examens", href: "/training/exams" }, { label: "Mes examens", href: "/training/exams/mine" }, { label: "Résultat" }]} />
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
  let attempt: Attempt | null = null;
  try {
    await closeExpiredAttempts();
    attempt = await getAttempt(id);
  } catch (error) {
    if (!isMissingExamsTableError(error)) throw error;
  }
  if (!attempt) notFound();
  const mine = attempt.userId === ctx.user.id;
  if (!mine) {
    // Les formateurs relisent depuis le panneau de correction.
    if (isTrainer(ctx) && (await canManageExamId(ctx, attempt.examId))) redirect(`/training/exams/review/${attempt.id}`);
    notFound();
  }
  if (attempt.status === "in_progress") redirect(`/training/exams/take/${attempt.id}`);

  if (attempt.status === "submitted") {
    // Écran d'attente : aucune note, aucune correction automatique.
    return (
      <div className="mt-6 border border-slate-200 rounded-lg p-8 text-center" data-testid="exam-waiting">
        <h1 className="text-lg font-bold text-slate-800 uppercase">{attempt.examTitle}</h1>
        <p className="text-[15px] text-slate-700 mt-3">Ton examen a bien été transmis.</p>
        <p className="text-[13px] text-slate-500 mt-1">Il sera corrigé par la Training Division. Tu pourras consulter ton résultat dans « Mes examens » dès qu&apos;il sera envoyé.</p>
      </div>
    );
  }

  const { snapshot } = attempt;
  const got = Math.round(snapshot.questions.reduce((n, q) => n + (attempt.grades[q.id]?.points ?? 0), 0) * 100) / 100;
  const max = totalPoints(snapshot.questions);
  return (
    <>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">{attempt.examTitle}</h1>
      <div data-testid="exam-result" className="mt-3 border border-slate-300 rounded-lg p-4 flex flex-wrap items-center gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Résultat</p>
          <p className={`text-xl font-bold ${attempt.verdict === "pass" ? "text-green-700" : "text-red-700"}`}>{attempt.verdict ? VERDICT_LABEL[attempt.verdict] : "—"}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Points</p>
          <p className="text-xl font-bold text-slate-800">{formatPoints(got)} / {formatPoints(max)}</p>
        </div>
        <div className="text-[12px] text-slate-500">{snapshot.kind === "practical" ? "Évalué par" : "Corrigé par"} {attempt.graderName || "la Training Division"}</div>
      </div>
      {attempt.comment && (
        <p className="mt-3 border-l-4 border-[#0d2644] bg-slate-50 px-3 py-2 text-[13px] whitespace-pre-wrap"><strong>Commentaire de l&apos;examinateur : </strong>{attempt.comment}</p>
      )}
      <ol className="mt-6 flex flex-col gap-6">
        {snapshot.questions.map((q, position) => {
          if (q.type === "heading") return <li key={q.id} className="list-none"><h2 className="text-[15px] font-bold uppercase text-slate-800 border-b-2 border-slate-800 pb-1">{q.prompt}</h2></li>;
          if (q.type === "note") return <li key={q.id} className="list-none text-[13px] italic text-slate-700 whitespace-pre-wrap">{q.prompt}</li>;
          const index = snapshot.questions.slice(0, position).filter((x) => x.type !== "heading" && x.type !== "note").length;
          const grade = attempt.grades[q.id];
          const lines = answerLines(q, attempt.answers[q.id]);
          return (
            <li key={q.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
              <ExamQuestionHead question={q} index={index} showPoints={false} />
              {q.eliminatory && <p className="text-[11px] font-bold uppercase text-red-700">Critère éliminatoire</p>}
              {q.checklist && q.checklist.length > 0 && (
                <ul data-testid="result-checklist" className="flex flex-col gap-1 text-[14px]">
                  {q.checklist.map((item) => {
                    const done = Array.isArray(attempt.answers[q.id]) && (attempt.answers[q.id] as string[]).includes(item.id);
                    return (
                      <li key={item.id} className="flex items-start gap-2">
                        <span aria-hidden className={`font-bold ${done ? "text-green-700" : "text-slate-400"}`}>{done ? "☑" : "☐"}</span>
                        <span>{item.label}<span className="sr-only">{done ? " (validé)" : " (non validé)"}</span></span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {snapshot.kind !== "practical" && <div className="text-[14px]">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Ta réponse</p>
                {lines.length ? lines.map((l, i) => <p key={i} className="whitespace-pre-wrap">{lines.length > 1 ? "• " : ""}{l}</p>) : <p className="text-slate-400">(pas de réponse)</p>}
              </div>}
              <p className="text-[13px] font-bold">{formatPoints(grade?.points ?? 0)} / {formatPoints(q.points)} pt{q.points > 1 ? "s" : ""}</p>
              {grade?.comment && <p className="text-[13px] bg-slate-50 border-l-4 border-slate-400 px-3 py-1.5 whitespace-pre-wrap">{grade.comment}</p>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
