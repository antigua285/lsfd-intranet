"use server";

import { revalidatePath } from "next/cache";
import { assertTrainer, canManageWith, unknownFlags } from "@/lib/access";
import { applyAccessToTopic, createCard, deleteCard, getCard, isMissingFlashcardsTableError, parseCardInput, updateCard, type Flashcard } from "@/lib/flashcards";
import { UUID_PATTERN } from "@/lib/validation";

/** `affected` : cartes du même thème dont les accès ont aussi été mis à jour (case « appliquer au thème »). */
export type CardResult = { ok: true; card?: Flashcard; affected?: string[] } | { ok: false; error: string };

const MISSING = "La base n'est pas à jour : un modérateur doit lancer `npm run db:setup`.";
const FORBIDDEN = "Cette carte est réservée à d'autres formateurs.";

function refresh() {
  revalidatePath("/training/cards");
  revalidatePath("/training/cards/manage");
  revalidatePath("/training/td");
}

export async function saveCardAction(id: string | null, raw: unknown): Promise<CardResult> {
  const ctx = await assertTrainer();
  const parsed = parseCardInput(raw);
  if (!parsed.ok) return parsed;
  const input = parsed.value;
  try {
    const unknown = await unknownFlags([...input.flags, ...input.manageFlags]);
    if (unknown.length) return { ok: false, error: `Flag inconnu : ${unknown.join(", ")}.` };
    // Un formateur ne peut pas se verrouiller lui-même hors d'une carte.
    if (!ctx.user.isAdmin && input.manageFlags.length > 0 && !canManageWith(ctx, input.manageFlags)) {
      return { ok: false, error: "Choisis pour « Gérée par » au moins un flag que tu possèdes, sinon tu ne pourrais plus modifier cette carte." };
    }
    if (id !== null) {
      if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Carte invalide." };
      const existing = await getCard(id);
      if (!existing) return { ok: false, error: "Cette carte n'existe plus." };
      if (!canManageWith(ctx, existing.manageFlags)) return { ok: false, error: FORBIDDEN };
    }
    const saved = id === null ? await createCard(input) : await updateCard(id, input);
    if (!saved) return { ok: false, error: "Cette carte n'existe plus." };
    const affected = input.applyToTopic ? await applyAccessToTopic(ctx, saved.topic, input.flags, input.manageFlags) : [];
    refresh();
    return { ok: true, card: { ...saved, editable: true }, affected };
  } catch (error) {
    if (isMissingFlashcardsTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}

export async function deleteCardAction(id: string): Promise<CardResult> {
  const ctx = await assertTrainer();
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Carte invalide." };
  try {
    const existing = await getCard(id);
    if (!existing) return { ok: false, error: "Cette carte n'existe plus." };
    if (!canManageWith(ctx, existing.manageFlags)) return { ok: false, error: FORBIDDEN };
    if (!(await deleteCard(id))) return { ok: false, error: "Cette carte n'existe plus." };
    refresh();
    return { ok: true };
  } catch (error) {
    if (isMissingFlashcardsTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}
