"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import {
  assignOrgHolder,
  createOrgNode,
  deleteOrgNode,
  isMissingTableError,
  moveOrgNode,
  seedOrgIfEmpty,
  updateOrgNode,
  type OrgResult,
} from "@/lib/org";
import { isMoveAction, parseOrgFields } from "@/lib/org-types";
import { UUID_PATTERN, parseShortText } from "@/lib/validation";

/** Résultat renvoyé à l'éditeur : un message d'erreur, ou rien si tout s'est bien passé. */
export type OrgActionResult = { error?: string };

// Chaque action revérifie que l'appelant est modérateur : une action peut être
// appelée sans passer par la page, la page seule ne protège donc pas.

const MISSING_TABLE =
  "La base n'est pas à jour : lance `npm run db:setup` depuis ton PC, puis réessaie.";

function done(result: OrgResult): OrgActionResult {
  if (!result.ok) return { error: result.error };
  revalidatePath("/organization");
  revalidatePath("/organization/edit");
  return {};
}

async function guarded(task: () => Promise<OrgResult>): Promise<OrgActionResult> {
  await assertAdmin();
  try {
    return done(await task());
  } catch (error) {
    if (isMissingTableError(error)) return { error: MISSING_TABLE };
    throw error;
  }
}

function isId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export async function addOrgNodeAction(
  parentId: string | null,
  title: string
): Promise<OrgActionResult> {
  if (parentId !== null && !isId(parentId)) return { error: "Élément parent invalide." };
  const parsed = parseShortText(typeof title === "string" ? title : "", "Le titre", 100);
  if (!parsed.ok) return { error: parsed.error };
  return guarded(() => createOrgNode(parentId, parsed.value));
}

export async function saveOrgNodeAction(
  id: string,
  fields: { title: string; role: string; holderName: string; note: string }
): Promise<OrgActionResult> {
  if (!isId(id)) return { error: "Élément invalide." };
  const parsed = parseOrgFields(fields ?? {});
  if (!parsed.ok) return { error: parsed.error };
  return guarded(() => updateOrgNode(id, parsed.value));
}

export async function assignOrgHolderAction(
  id: string,
  userId: string | null
): Promise<OrgActionResult> {
  if (!isId(id)) return { error: "Élément invalide." };
  if (userId !== null && !isId(userId)) return { error: "Compte invalide." };
  return guarded(() => assignOrgHolder(id, userId));
}

export async function moveOrgNodeAction(id: string, action: string): Promise<OrgActionResult> {
  if (!isId(id)) return { error: "Élément invalide." };
  if (!isMoveAction(action)) return { error: "Déplacement invalide." };
  return guarded(() => moveOrgNode(id, action));
}

export async function deleteOrgNodeAction(id: string): Promise<OrgActionResult> {
  if (!isId(id)) return { error: "Élément invalide." };
  return guarded(() => deleteOrgNode(id));
}

/**
 * Importe l'organigramme du PDF si (et seulement si) il est vide.
 * Utilisée directement par un bouton de formulaire : ne renvoie rien.
 */
export async function importOrgTemplateAction(): Promise<void> {
  const result = await guarded(async () => {
    await seedOrgIfEmpty();
    return { ok: true };
  });
  if (result.error) throw new Error(result.error);
}
