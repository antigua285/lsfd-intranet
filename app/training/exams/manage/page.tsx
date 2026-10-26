import { Suspense } from "react";
import { TrailFromParams } from "@/components/TrailFromParams";
import { notFound, redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { isMissingExamsTableError, listAssignments, listExamKeys, listExams, type Assignment } from "@/lib/exams";
import { STATUS_LABEL, type ExamRecord } from "@/lib/exams-types";
import { listUsers } from "@/lib/users";
import { ExamAssign } from "./ExamAssign";

export const metadata = { title: "Clés et assignation | LSFD Intranet" };

export default function ManageExamsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={null}>
        <TrailFromParams page="manage" searchParams={searchParams} />
      </Suspense>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Clés et assignation</h1>
      <p className="text-sm text-slate-500 mb-6">Retrouve la clé de chaque examen et assigne-le à un membre. Réservé à la Training Division et aux modérateurs.</p>
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
  let exams: ExamRecord[] = [];
  let keys = new Map<string, string | null>();
  let assignments = new Map<string, Assignment[]>();
  try {
    [exams, keys, assignments] = await Promise.all([listExams(), listExamKeys(), listAssignments()]);
  } catch (error) {
    if (!isMissingExamsTableError(error)) throw error;
    return <p className="text-[13px] text-slate-600">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</p>;
  }
  const users = (await listUsers()).map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName} — ${u.grade}` }));
  if (exams.length === 0) return <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucun examen n&apos;a été créé.</p>;
  return (
    <ul className="flex flex-col gap-5">
      {exams.map((exam) => (
        <li key={exam.id} data-testid="manage-exam" className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-[15px] font-bold text-slate-800 flex-1">{exam.title}</h2>
            <span className={`text-[11px] font-bold rounded px-2 py-0.5 ${exam.published ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>{exam.published ? "Publié" : "Brouillon"}</span>
          </div>
          {(!exam.published || exam.questions.length === 0 || !exam.hasKey) && (
            <p data-testid="exam-not-ready" className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
              Les candidats ne pourront pas le passer tant que : {[!exam.published && "il n'est pas publié", exam.questions.length === 0 && "il n'a aucune question", !exam.hasKey && "il n'a pas de clé d'accès"].filter(Boolean).join(", ")}. (Modification : Admin → Examens.)
            </p>
          )}
          <ExamAssign
            examId={exam.id}
            accessKey={keys.get(exam.id) ?? null}
            legacyKey={exam.hasKey && !keys.get(exam.id)}
            users={users}
            assigned={(assignments.get(exam.id) ?? []).map((a) => ({
              userId: a.userId, name: a.name, grade: a.grade, station: a.station,
              label: a.status ? STATUS_LABEL[a.status] : "Pas commencé",
            }))}
          />
        </li>
      ))}
    </ul>
  );
}
