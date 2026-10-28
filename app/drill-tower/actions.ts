"use server";

import { revalidatePath } from "next/cache";
import { assertTrainer } from "@/lib/access";
import { addMember, createCohort, createEvent, deleteCohort, deleteEvent, graduateCohort, graduateMember, isMissingDrillTableError, parseCohortInput, parseEventInput, removeMember, updateEvent } from "@/lib/drill";
import { UUID_PATTERN } from "@/lib/validation";

export type DrillResult = { ok: true; message?: string } | { ok: false; error: string };

const MISSING = "La base n'est pas à jour : lance `npm run db:setup` depuis ton PC.";
const refresh = () => {
  revalidatePath("/drill-tower");
  revalidatePath("/drill-tower/manage");
  revalidatePath("/training/probation");
};
const isId = (v: unknown): v is string => typeof v === "string" && UUID_PATTERN.test(v);

async function guarded(work: () => Promise<DrillResult>): Promise<DrillResult> {
  try {
    const result = await work();
    if (result.ok) refresh();
    return result;
  } catch (error) {
    if (isMissingDrillTableError(error)) return { ok: false, error: MISSING };
    if ((error as { code?: string })?.code === "23503") return { ok: false, error: "Promotion introuvable." };
    throw error;
  }
}

/** Crée (id = null) ou modifie une formation du calendrier. Réservé à la TD et aux modérateurs. */
export async function saveEventAction(id: string | null, raw: unknown): Promise<DrillResult> {
  const ctx = await assertTrainer();
  return guarded(async () => {
    const parsed = parseEventInput(raw);
    if (!parsed.ok) return parsed;
    if (id === null) {
      await createEvent(parsed.value, ctx.user.id);
      return { ok: true, message: "Formation ajoutée au calendrier." };
    }
    if (!isId(id)) return { ok: false, error: "Formation invalide." };
    return (await updateEvent(id, parsed.value)) ? { ok: true, message: "Formation modifiée." } : { ok: false, error: "Cette formation n'existe plus." };
  });
}

export async function deleteEventAction(id: string): Promise<DrillResult> {
  await assertTrainer();
  return guarded(async () => {
    if (!isId(id)) return { ok: false, error: "Formation invalide." };
    return (await deleteEvent(id)) ? { ok: true } : { ok: false, error: "Cette formation n'existe plus." };
  });
}

export async function createCohortAction(raw: unknown): Promise<DrillResult> {
  await assertTrainer();
  return guarded(async () => {
    const parsed = parseCohortInput(raw);
    if (!parsed.ok) return parsed;
    await createCohort(parsed.value);
    return { ok: true, message: "Promotion créée." };
  });
}

export async function deleteCohortAction(id: string): Promise<DrillResult> {
  await assertTrainer();
  return guarded(async () => {
    if (!isId(id)) return { ok: false, error: "Promotion invalide." };
    return (await deleteCohort(id)) ? { ok: true } : { ok: false, error: "Cette promotion n'existe plus." };
  });
}

/** Ajoute une recrue à une promotion : elle reçoit le flag DTRECRUIT et accède à la Drill Tower. */
export async function addMemberAction(cohortId: string, userId: string): Promise<DrillResult> {
  await assertTrainer();
  return guarded(async () => {
    if (!isId(cohortId) || !isId(userId)) return { ok: false, error: "Demande invalide." };
    const r = await addMember(cohortId, userId);
    return r.ok ? { ok: true, message: "Recrue ajoutée." } : r;
  });
}

export async function removeMemberAction(userId: string): Promise<DrillResult> {
  await assertTrainer();
  return guarded(async () => {
    if (!isId(userId)) return { ok: false, error: "Demande invalide." };
    await removeMember(userId);
    return { ok: true };
  });
}

/** Diplôme une recrue : elle quitte la Drill Tower et passe en probation (flag PROB, carnet créé). */
export async function graduateMemberAction(userId: string): Promise<DrillResult> {
  await assertTrainer();
  return guarded(async () => {
    if (!isId(userId)) return { ok: false, error: "Demande invalide." };
    return (await graduateMember(userId)) ? { ok: true, message: "Recrue diplômée : passage en probation." } : { ok: false, error: "Cette recrue n'est plus en académie." };
  });
}

export async function graduateCohortAction(cohortId: string): Promise<DrillResult> {
  await assertTrainer();
  return guarded(async () => {
    if (!isId(cohortId)) return { ok: false, error: "Promotion invalide." };
    const n = await graduateCohort(cohortId);
    return n === null ? { ok: false, error: "Promotion introuvable ou déjà diplômée." } : { ok: true, message: `Promotion diplômée : ${n} recrue(s) passée(s) en probation.` };
  });
}
