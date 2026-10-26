import { Suspense } from "react";
import { TrailFromParams } from "@/components/TrailFromParams";
import { notFound, redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { closeExpiredAttempts, getAttempt, isMissingExamsTableError, canManageExamId } from "@/lib/exams";
import type { Attempt } from "@/lib/exams-types";
import { UUID_PATTERN } from "@/lib/validation";
import { ExamGrader } from "../../ExamGrader";

export const metadata = { title: "Correction | LSFD Intranet" };

export default function ReviewAttemptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={null}>
        <TrailFromParams page="review-detail" searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p className="text-sm text-slate-500 mt-3">Chargement…</p>}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  if (!isTrainer(ctx)) notFound();
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  let attempt: Attempt | null = null;
  try {
    await closeExpiredAttempts();
    attempt = await getAttempt(id);
  } catch (error) {
    if (!isMissingExamsTableError(error)) throw error;
  }
  if (!attempt || attempt.status === "in_progress") notFound();
  if (!(await canManageExamId(ctx, attempt.examId))) notFound();
  return <ExamGrader attempt={attempt} />;
}
