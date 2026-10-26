import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { closeExpiredAttempts, isMissingExamsTableError, listAssignedExams } from "@/lib/exams";
import { formatPoints, totalPoints, type ExamRecord } from "@/lib/exams-types";

export const metadata = { title: "Examens | LSFD Intranet" };

export default function ExamsPage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Link href="/training" className="text-[12px] text-slate-500 hover:underline">← Formation</Link>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Examens</h1>
      <p className="text-sm text-slate-500 mb-6">Les examens qui t&apos;ont été assignés. Pour commencer, saisis la clé d&apos;accès donnée par ton formateur.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  let exams: (ExamRecord & { attemptsUsed: number })[] = [];
  try {
    await closeExpiredAttempts();
    exams = await listAssignedExams(ctx.user.id);
  } catch (error) {
    if (!isMissingExamsTableError(error)) throw error;
    return (
      <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
        <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
        {ctx.user.isAdmin ? <>Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</> : "Cette page n'est pas encore disponible."}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4 text-[13px] font-bold">
        <Link href="/training/exams/mine" className="text-[#0d2644] hover:underline">Mes examens →</Link>
        {isTrainer(ctx) && <Link href="/training/exams/review" className="text-[#0d2644] hover:underline">Correction →</Link>}
        {isTrainer(ctx) && <Link href="/training/exams/manage" className="text-[#0d2644] hover:underline">Clés et assignation →</Link>}
      </div>
      {exams.length === 0 ? (
        <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucun examen ne t&apos;a été assigné pour le moment.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {exams.filter((e) => e.questions.length > 0 && e.hasKey).map((exam) => (
            <li key={exam.id}>
              <Link href={`/training/exams/${exam.id}`} className="block border border-slate-200 rounded-lg p-4 hover:border-[#0d2644] hover:bg-slate-50 transition-colors">
                <p className="text-[15px] font-bold text-slate-800">{exam.title}</p>
                <p className="text-[12px] text-slate-500 mt-1">
                  {exam.questions.length} question(s) · {formatPoints(totalPoints(exam.questions))} pts · {exam.durationMinutes ? `${exam.durationMinutes} min` : "sans limite de temps"}
                </p>
                <p className="text-[12px] mt-1 font-bold text-[#0d2644]">{exam.attemptsUsed === 0 ? "À passer" : `${exam.attemptsUsed} / ${exam.maxAttempts} tentative(s)`}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
