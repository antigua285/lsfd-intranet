"use server";

import { revalidatePath } from "next/cache";
import { assertTrainer } from "@/lib/access";
import {
  addComment,
  archiveNotebook,
  computeProgress,
  deleteArchivedNotebook,
  deleteComment,
  getNotebook,
  getTemplate,
  isMissingProbationTableError,
  itemIds,
  parseComment,
  parseTemplate,
  restoreNotebook,
  saveTemplate,
  setTick,
  type Comment,
  type Progress,
} from "@/lib/probation";
import { UUID_PATTERN } from "@/lib/validation";

type Fail = { ok: false; error: string };
const MISSING: Fail = { ok: false, error: "La base n'est pas à jour : un modérateur doit lancer `npm run db:setup`." };
const GONE: Fail = { ok: false, error: "Ce carnet n'existe plus ou est archivé." };

function refresh(id?: string) {
  revalidatePath("/training/probation");
  revalidatePath("/training/probation/archives");
  if (id) revalidatePath(`/training/probation/${id}`);
}

function name(ctx: Awaited<ReturnType<typeof assertTrainer>>): string {
  return `${ctx.user.firstName} ${ctx.user.lastName}`;
}

export async function toggleTickAction(notebookId: string, itemId: string, checked: boolean): Promise<{ ok: true; progress: Progress; by: string; at: string } | Fail> {
  const ctx = await assertTrainer();
  if (typeof notebookId !== "string" || !UUID_PATTERN.test(notebookId) || typeof itemId !== "string" || typeof checked !== "boolean") return { ok: false, error: "Requête invalide." };
  try {
    const nb = await getNotebook(notebookId);
    if (!nb || nb.archivedAt) return GONE;
    if (nb.userId === ctx.user.id) return { ok: false, error: "Tu ne peux pas valider tes propres compétences." };
    const template = await getTemplate();
    if (!itemIds(template).includes(itemId)) return { ok: false, error: "Cette compétence n'existe plus : recharge la page." };
    if (!(await setTick(notebookId, itemId, checked, name(ctx)))) return GONE;
    const fresh = await getNotebook(notebookId);
    refresh(notebookId);
    return { ok: true, progress: computeProgress(template, fresh?.checked ?? {}), by: name(ctx), at: new Date().toISOString() };
  } catch (error) {
    if (isMissingProbationTableError(error)) return MISSING;
    throw error;
  }
}

export async function addCommentAction(notebookId: string, raw: unknown): Promise<{ ok: true; comment: Comment } | Fail> {
  const ctx = await assertTrainer();
  if (typeof notebookId !== "string" || !UUID_PATTERN.test(notebookId)) return { ok: false, error: "Carnet invalide." };
  const body = parseComment(raw);
  if (!body.ok) return body;
  try {
    const comment = await addComment(notebookId, ctx.user.id, name(ctx), body.value);
    if (!comment) return GONE;
    refresh(notebookId);
    return { ok: true, comment };
  } catch (error) {
    if (isMissingProbationTableError(error)) return MISSING;
    throw error;
  }
}

export async function deleteCommentAction(notebookId: string, commentId: string): Promise<{ ok: true } | Fail> {
  const ctx = await assertTrainer();
  if (typeof commentId !== "string" || !UUID_PATTERN.test(commentId)) return { ok: false, error: "Commentaire invalide." };
  try {
    if (!(await deleteComment(commentId, ctx.user.id, ctx.user.isAdmin))) return { ok: false, error: "Tu ne peux supprimer que tes propres commentaires." };
    if (typeof notebookId === "string" && UUID_PATTERN.test(notebookId)) refresh(notebookId);
    return { ok: true };
  } catch (error) {
    if (isMissingProbationTableError(error)) return MISSING;
    throw error;
  }
}

export async function archiveAction(id: string): Promise<{ ok: true } | Fail> {
  const ctx = await assertTrainer();
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Carnet invalide." };
  try {
    if (!(await archiveNotebook(id, name(ctx)))) return GONE;
    refresh(id);
    return { ok: true };
  } catch (error) {
    if (isMissingProbationTableError(error)) return MISSING;
    throw error;
  }
}

export async function restoreAction(id: string): Promise<{ ok: true } | Fail> {
  await assertTrainer();
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Carnet invalide." };
  try {
    const r = await restoreNotebook(id);
    if (!r.ok) return r;
    refresh(id);
    return { ok: true };
  } catch (error) {
    if (isMissingProbationTableError(error)) return MISSING;
    throw error;
  }
}

/** Suppression définitive d'un carnet archivé : réservé aux modérateurs. */
export async function deleteArchivedAction(id: string): Promise<{ ok: true } | Fail> {
  const ctx = await assertTrainer();
  if (!ctx.user.isAdmin) return { ok: false, error: "Seul un modérateur peut supprimer définitivement un carnet." };
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Carnet invalide." };
  try {
    if (!(await deleteArchivedNotebook(id))) return { ok: false, error: "Seul un carnet archivé peut être supprimé." };
    refresh(id);
    return { ok: true };
  } catch (error) {
    if (isMissingProbationTableError(error)) return MISSING;
    throw error;
  }
}

export async function saveTemplateAction(raw: unknown): Promise<{ ok: true } | Fail> {
  await assertTrainer();
  const parsed = parseTemplate(raw);
  if (!parsed.ok) return parsed;
  try {
    await saveTemplate(parsed.value);
    revalidatePath("/training/probation", "layout");
    return { ok: true };
  } catch (error) {
    if (isMissingProbationTableError(error)) return MISSING;
    throw error;
  }
}
