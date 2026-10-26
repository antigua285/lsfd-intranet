"use server";

import { revalidatePath } from "next/cache";
import { assertTrainer } from "@/lib/access";
import { canManageExamId, getAttempt, reopenResult, saveGrading, sendResult } from "@/lib/exams";
import { parseComment, parseGrades } from "@/lib/exams-validation";
import type { Grade, Verdict } from "@/lib/exams-types";
import { UUID_PATTERN } from "@/lib/validation";

type Result = { ok: true } | { ok: false; error: string };
export type GradingPayload = { grades: Record<string, Grade>; verdict: Verdict | null; comment: string };

function refresh(id: string) {
  revalidatePath("/training/exams/review");
  revalidatePath(`/training/exams/review/${id}`);
  revalidatePath("/training/exams/mine");
  revalidatePath(`/training/exams/attempt/${id}`);
}

async function persist(id: string, payload: GradingPayload, requireComplete: boolean): Promise<Result> {
  const ctx = await assertTrainer();
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Passage invalide." };
  const attempt = await getAttempt(id);
  if (!attempt) return { ok: false, error: "Ce passage n'existe plus." };
  if (!(await canManageExamId(ctx, attempt.examId))) return { ok: false, error: "Cet examen est réservé à d'autres formateurs." };
  if (attempt.status !== "submitted") return { ok: false, error: attempt.status === "sent" ? "Résultat déjà envoyé : rouvre la correction pour le modifier." : "L'examen est encore en cours." };

  const grades = parseGrades(attempt.snapshot, payload?.grades);
  if (!grades.ok) return grades;
  const comment = parseComment(payload?.comment);
  if (!comment.ok) return comment;
  const verdict: Verdict | null = payload?.verdict === "pass" || payload?.verdict === "fail" ? payload.verdict : null;

  if (requireComplete) {
    const missing = attempt.snapshot.questions.filter((q) => grades.value[q.id]?.points == null);
    if (missing.length) return { ok: false, error: `${missing.length} question(s) n'ont pas de note.` };
    if (!verdict) return { ok: false, error: "Choisis le résultat : réussi ou non réussi." };
  }
  const saved = await saveGrading(id, { grades: grades.value, verdict, comment: comment.value, graderId: ctx.user.id, graderName: `${ctx.user.firstName} ${ctx.user.lastName}` });
  return saved ? { ok: true } : { ok: false, error: "Enregistrement impossible." };
}

export async function saveGradingAction(id: string, payload: GradingPayload): Promise<Result> {
  const result = await persist(id, payload, false);
  if (result.ok) refresh(id);
  return result;
}

/** Enregistre la correction puis l'envoie au candidat (tout doit être noté). */
export async function sendResultAction(id: string, payload: GradingPayload): Promise<Result> {
  const result = await persist(id, payload, true);
  if (!result.ok) return result;
  if (!(await sendResult(id))) return { ok: false, error: "Envoi impossible." };
  refresh(id);
  return { ok: true };
}

export async function reopenResultAction(id: string): Promise<Result> {
  const ctx = await assertTrainer();
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Passage invalide." };
  const attempt = await getAttempt(id);
  if (!attempt || !(await canManageExamId(ctx, attempt.examId))) return { ok: false, error: "Passage introuvable ou réservé à d'autres formateurs." };
  if (!(await reopenResult(id))) return { ok: false, error: "Impossible de rouvrir." };
  refresh(id);
  return { ok: true };
}
