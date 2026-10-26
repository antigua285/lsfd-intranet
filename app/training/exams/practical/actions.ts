"use server";

import { revalidatePath } from "next/cache";
import { assertTrainer } from "@/lib/access";
import { canManageExamId, createPracticalAttempt, getExam, isMissingExamsTableError } from "@/lib/exams";
import { getUserById } from "@/lib/users";
import { UUID_PATTERN } from "@/lib/validation";

export type StartPracticalResult = { ok: true; attemptId: string } | { ok: false; error: string };

/** L'instructeur ouvre un examen pratique pour un membre : la grille s'ouvre dans le panneau de correction. */
export async function startPracticalAction(examId: string, userId: string): Promise<StartPracticalResult> {
  const ctx = await assertTrainer();
  if (typeof examId !== "string" || !UUID_PATTERN.test(examId) || typeof userId !== "string" || !UUID_PATTERN.test(userId)) {
    return { ok: false, error: "Demande invalide." };
  }
  try {
    const exam = await getExam(examId);
    if (!exam || exam.kind !== "practical") return { ok: false, error: "Examen pratique introuvable." };
    if (!exam.published || exam.questions.length === 0) return { ok: false, error: "Cet examen pratique n'est pas encore prêt (publié, avec au moins un critère)." };
    if (!(await canManageExamId(ctx, examId))) return { ok: false, error: "Cet examen est réservé à d'autres formateurs." };
    const user = await getUserById(userId);
    if (!user) return { ok: false, error: "Ce compte n'existe plus." };
    if (user.id === ctx.user.id && !ctx.user.isAdmin) return { ok: false, error: "Tu ne peux pas t'évaluer toi-même." };
    const attemptId = await createPracticalAttempt(exam, user.id, {
      name: `${user.firstName} ${user.lastName}`,
      username: user.username,
      grade: user.grade,
      station: user.station,
    });
    revalidatePath("/training/exams/review");
    revalidatePath("/training/td");
    revalidatePath("/training/probation");
    return { ok: true, attemptId };
  } catch (error) {
    if (isMissingExamsTableError(error)) return { ok: false, error: "La base n'est pas à jour : lance `npm run db:setup`." };
    throw error;
  }
}
