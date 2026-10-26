import { Suspense } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { isMissingExamsTableError, listExams } from "@/lib/exams";
import { formatPoints, totalPoints, type ExamRecord } from "@/lib/exams-types";
import { DeleteExamButton } from "./ExamsListActions";

export const metadata = { title: "Examens | LSFD Intranet" };

export default function AdminExamsPage() {
  return (
    <div className="max-w-5xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <h1 className="text-xl font-bold text-slate-800 uppercase">Administration</h1>
      <p className="text-sm text-slate-500 mb-4">Création et gestion des examens. Réservé aux modérateurs.</p>
      <AdminNav current="/admin/exams" />
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireAdmin();
  let exams: ExamRecord[] = [];
  try {
    exams = await listExams();
  } catch (error) {
    if (!isMissingExamsTableError(error)) throw error;
    return (
      <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
        <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
        Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC (une seule fois), puis recharge cette page.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/exams/new" className="bg-[#0d2644] text-white text-[12px] font-bold uppercase tracking-wide rounded px-4 py-2 hover:bg-[#143a66]">Nouvel examen</Link>
        <Link href="/training/exams/review" className="text-[12px] text-[#0d2644] font-bold hover:underline">Panneau de correction →</Link>
      </div>
      {exams.length === 0 ? (
        <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucun examen.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded">
          {exams.map((exam) => (
            <li key={exam.id} data-testid="exam-row" className="flex items-center gap-4 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-800 truncate">{exam.title}</p>
                <p className="text-[12px] text-slate-500">
                  {exam.questions.length} question(s) · {formatPoints(totalPoints(exam.questions))} pts · {exam.durationMinutes ? `${exam.durationMinutes} min` : "sans chrono"} · {exam.published ? "Publié" : "Brouillon"}{exam.hasKey ? "" : " · sans clé"}
                </p>
              </div>
              <Link href={`/admin/exams/${exam.id}`} className="text-[12px] text-[#0d2644] font-bold hover:underline">Modifier</Link>
              <DeleteExamButton id={exam.id} title={exam.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
