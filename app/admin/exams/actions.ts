"use server";

import { revalidatePath } from "next/cache";
import { unknownFlags } from "@/lib/access";
import { assertAdmin } from "@/lib/auth";
import { createExam, deleteExam, isMissingExamsTableError, getExam, updateExam } from "@/lib/exams";
import { parseExamInput } from "@/lib/exams-validation";
import { UUID_PATTERN } from "@/lib/validation";

export type SaveExamResult = { ok: true; id: string } | { ok: false; error: string };

const MISSING = "La base n'est pas à jour : lance `npm run db:setup` depuis ton PC, puis réessaie.";

function refresh() {
  revalidatePath("/admin/exams");
  revalidatePath("/training/exams");
}

/** Crée (id = null) ou met à jour un examen. */
export async function saveExamAction(id: string | null, raw: unknown): Promise<SaveExamResult> {
  await assertAdmin();
  const parsed = parseExamInput(raw);
  if (!parsed.ok) return parsed;
  const input = parsed.value;
  try {
    const unknown = await unknownFlags(input.manageFlags);
    if (unknown.length) return { ok: false, error: `Flag inconnu : ${unknown.join(", ")}.` };
    let existing = null;
    if (id !== null) {
      if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Examen invalide." };
      existing = await getExam(id);
      if (!existing) return { ok: false, error: "Cet examen n'existe plus." };
    }
    if (input.published && !input.newKey && !existing?.hasKey) return { ok: false, error: "Définis une clé d'accès avant de publier l'examen." };
    if (input.published && input.questions.length === 0) return { ok: false, error: "Ajoute au moins une question avant de publier." };
    if (id === null) {
      const created = await createExam(input);
      refresh();
      return { ok: true, id: created };
    }
    await updateExam(id, input);
    refresh();
    return { ok: true, id };
  } catch (error) {
    if (isMissingExamsTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}

export async function deleteExamAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Examen invalide." };
  try {
    const removed = await deleteExam(id);
    refresh();
    return removed ? { ok: true } : { ok: false, error: "Cet examen n'existe plus." };
  } catch (error) {
    if (isMissingExamsTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}
