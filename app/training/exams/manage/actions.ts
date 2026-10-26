"use server";

import { revalidatePath } from "next/cache";
import { assertTrainer } from "@/lib/access";
import { assignExam, canManageExamId, getExam, isMissingExamsTableError, unassignExam } from "@/lib/exams";
import { getUserById } from "@/lib/users";
import { UUID_PATTERN } from "@/lib/validation";

type Result = { ok: true } | { ok: false; error: string };

function refresh() {
  revalidatePath("/training/exams/manage");
  revalidatePath("/training/exams");
  revalidatePath("/training");
}

async function check(ctx: Awaited<ReturnType<typeof assertTrainer>>, examId: string, userId: string): Promise<string | null> {
  if (typeof examId !== "string" || !UUID_PATTERN.test(examId) || typeof userId !== "string" || !UUID_PATTERN.test(userId)) return "Demande invalide.";
  const exam = await getExam(examId);
  if (!exam) return "Cet examen n'existe plus.";
  if (exam.kind === "practical") return "Un examen pratique n'est pas assigné : l'instructeur l'ouvre depuis « Examens pratiques ».";
  if (!(await canManageExamId(ctx, examId))) return "Cet examen est réservé à d'autres formateurs.";
  if (!(await getUserById(userId))) return "Ce compte n'existe plus.";
  return null;
}

/** Assigne un examen à un membre : il le retrouve dans sa liste « Examens ». */
export async function assignExamAction(examId: string, userId: string): Promise<Result> {
  const ctx = await assertTrainer();
  try {
    const problem = await check(ctx, examId, userId);
    if (problem) return { ok: false, error: problem };
    await assignExam(examId, userId, ctx.user.id);
    refresh();
    return { ok: true };
  } catch (error) {
    if (isMissingExamsTableError(error)) return { ok: false, error: "La base n'est pas à jour : lance `npm run db:setup`." };
    throw error;
  }
}

export async function unassignExamAction(examId: string, userId: string): Promise<Result> {
  const ctx = await assertTrainer();
  const problem = await check(ctx, examId, userId);
  if (problem) return { ok: false, error: problem };
  await unassignExam(examId, userId);
  refresh();
  return { ok: true };
}
