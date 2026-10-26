"use server";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access";
import { TRAINING_FLAG, createCard, deleteCard, isMissingFlashcardsTableError, parseCardInput, updateCard, type Flashcard } from "@/lib/flashcards";
import { UUID_PATTERN } from "@/lib/validation";

export type CardResult = { ok: true; card?: Flashcard } | { ok: false; error: string };

const MISSING = "La base n'est pas à jour : un modérateur doit lancer `npm run db:setup`.";

/** Modérateurs et détenteurs du flag TD : relu en base à chaque appel. */
async function assertTrainer() {
  const ctx = await getAccessContext();
  if (!ctx || (!ctx.user.isAdmin && !ctx.flags.includes(TRAINING_FLAG))) throw new Error("Accès refusé.");
}

function refresh() {
  revalidatePath("/training/cards");
  revalidatePath("/training/cards/manage");
}

export async function saveCardAction(id: string | null, raw: unknown): Promise<CardResult> {
  await assertTrainer();
  const parsed = parseCardInput(raw);
  if (!parsed.ok) return parsed;
  try {
    if (id === null) {
      const card = await createCard(parsed.value);
      refresh();
      return { ok: true, card };
    }
    if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Carte invalide." };
    const card = await updateCard(id, parsed.value);
    if (!card) return { ok: false, error: "Cette carte n'existe plus." };
    refresh();
    return { ok: true, card };
  } catch (error) {
    if (isMissingFlashcardsTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}

export async function deleteCardAction(id: string): Promise<CardResult> {
  await assertTrainer();
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Carte invalide." };
  try {
    if (!(await deleteCard(id))) return { ok: false, error: "Cette carte n'existe plus." };
    refresh();
    return { ok: true };
  } catch (error) {
    if (isMissingFlashcardsTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}
