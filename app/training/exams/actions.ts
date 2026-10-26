"use server";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access";
import { closeExpiredAttempts, countAttempts, createAttempt, getAttempt, getExam, getExamKey, isAssigned, isMissingExamsTableError, saveDraft, submitAttempt } from "@/lib/exams";
import { parseAnswers } from "@/lib/exams-validation";
import { timingSafeEqual } from "node:crypto";
import { verifyPassword } from "@/lib/password";
import { UUID_PATTERN } from "@/lib/validation";

const MISSING = "La base n'est pas à jour : un modérateur doit lancer `npm run db:setup`.";

async function requireCtx() {
  const ctx = await getAccessContext();
  if (!ctx) throw new Error("Session expirée, reconnecte-toi.");
  return ctx;
}

export type StartResult = { ok: true; attemptId: string } | { ok: false; error: string };

/** Démarre (ou reprend) un examen : la clé d'accès est vérifiée côté serveur. */
export async function startExamAction(examId: string, key: string): Promise<StartResult> {
  const { user } = await requireCtx();
  if (typeof examId !== "string" || !UUID_PATTERN.test(examId)) return { ok: false, error: "Examen invalide." };
  try {
    await closeExpiredAttempts();
    const exam = await getExam(examId);
    if (!exam || !exam.published || !exam.hasKey || exam.questions.length === 0) return { ok: false, error: "Cet examen n'est pas disponible." };
    if (!(await isAssigned(examId, user.id))) return { ok: false, error: "Cet examen ne t'est pas assigné." };
    const { total, inProgressId } = await countAttempts(examId, user.id);
    if (inProgressId) return { ok: true, attemptId: inProgressId }; // reprise : la clé a déjà été donnée
    if (total >= exam.maxAttempts) return { ok: false, error: "Tu as utilisé toutes tes tentatives pour cet examen." };

    const { plain, hash } = await getExamKey(examId);
    const given = typeof key === "string" ? key.trim() : "";
    let valid = false;
    if (plain) {
      const a = Buffer.from(given), b = Buffer.from(plain);
      valid = a.length === b.length && timingSafeEqual(a, b);
    } else if (hash) {
      valid = await verifyPassword(given, hash); // anciens examens : clé stockée chiffrée uniquement
    }
    if (!valid) {
      await new Promise((resolve) => setTimeout(resolve, 600)); // freine les essais en rafale
      return { ok: false, error: "Clé d'accès incorrecte." };
    }
    const attemptId = await createAttempt(exam, user.id, {
      name: `${user.firstName} ${user.lastName}`,
      username: user.username,
      grade: user.grade,
      station: user.station,
    });
    revalidatePath("/training/exams");
    return { ok: true, attemptId };
  } catch (error) {
    if (isMissingExamsTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}

export type DraftResult = { ok: true } | { ok: false; expired?: boolean; error: string };

/** Sauvegarde automatique du brouillon pendant l'examen. */
export async function saveDraftAction(attemptId: string, rawAnswers: unknown): Promise<DraftResult> {
  const { user } = await requireCtx();
  if (typeof attemptId !== "string" || !UUID_PATTERN.test(attemptId)) return { ok: false, error: "Passage invalide." };
  const attempt = await getAttempt(attemptId);
  if (!attempt || attempt.userId !== user.id || attempt.status !== "in_progress") return { ok: false, error: "Ce passage n'est plus en cours.", expired: true };
  const saved = await saveDraft(attemptId, user.id, parseAnswers(attempt.snapshot, rawAnswers));
  return saved ? { ok: true } : { ok: false, expired: true, error: "Le temps est écoulé." };
}

/** Rend l'examen. Aucune note n'est renvoyée au candidat. */
export async function submitAttemptAction(attemptId: string, rawAnswers: unknown): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireCtx();
  if (typeof attemptId !== "string" || !UUID_PATTERN.test(attemptId)) return { ok: false, error: "Passage invalide." };
  const attempt = await getAttempt(attemptId);
  if (!attempt || attempt.userId !== user.id) return { ok: false, error: "Passage introuvable." };
  if (attempt.status !== "in_progress") return { ok: true }; // déjà rendu (ex. temps écoulé)
  await submitAttempt(attemptId, user.id, parseAnswers(attempt.snapshot, rawAnswers));
  revalidatePath("/training/exams");
  revalidatePath("/training/exams/review");
  return { ok: true };
}
