import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { isMissingAccessTableError, listFlags, type Flag } from "@/lib/access";
import { getExam, getExamKey, isMissingExamsTableError } from "@/lib/exams";
import type { ExamRecord } from "@/lib/exams-types";
import { UUID_PATTERN } from "@/lib/validation";
import { ExamBuilder } from "../ExamBuilder";

export const metadata = { title: "Éditeur d'examen | LSFD Intranet" };

export default function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-5xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <h1 className="text-xl font-bold text-slate-800 uppercase">Administration</h1>
      <p className="text-sm text-slate-500 mb-4">Éditeur d&apos;examen.</p>
      <AdminNav current="/admin/exams" />
      <Breadcrumb items={[{ label: "Administration", href: "/admin" }, { label: "Examens", href: "/admin/exams" }, { label: "Éditeur d'examen" }]} />
      <Suspense fallback={<p className="text-sm text-slate-500 mt-3">Chargement…</p>}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  let exam: ExamRecord | null = null;
  let currentKey: string | null = null;
  if (id !== "new") {
    if (!UUID_PATTERN.test(id)) notFound();
    try {
      exam = await getExam(id);
      if (exam) currentKey = (await getExamKey(id)).plain;
    } catch (error) {
      if (!isMissingExamsTableError(error)) throw error;
    }
    if (!exam) notFound();
  }
  let allFlags: Flag[] = [];
  try {
    allFlags = await listFlags();
  } catch (error) {
    if (!isMissingAccessTableError(error)) throw error;
  }
  const initial = exam ?? { title: "Nouvel examen", description: "", durationMinutes: null, thresholdPercent: null, maxAttempts: 1, published: false, hasKey: false, manageFlags: [], kind: "written" as const, currentKey: null, questions: [] };
  return (
    <div className="mt-3">
      <ExamBuilder key={exam?.id ?? "new"} examId={exam?.id ?? null} initial={{ ...initial, currentKey, questionsCount: initial.questions.length }} allFlags={allFlags.map((f) => ({ code: f.code, name: f.name }))} />
    </div>
  );
}
