"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { createForm, deleteForm, isMissingFormsTableError, updateForm } from "@/lib/forms";
import { TEMPLATES } from "@/lib/forms-templates";
import { parseFormInput } from "@/lib/forms-validation";
import { UUID_PATTERN } from "@/lib/validation";

export type SaveFormResult = { ok: true; id: string } | { ok: false; error: string };

const MISSING = "La base n'est pas à jour : lance `npm run db:setup` depuis ton PC, puis réessaie.";

function refresh() {
  revalidatePath("/forms");
  revalidatePath("/admin/forms");
}

/** Crée (id = null) ou met à jour un formulaire. Tout est revérifié côté serveur. */
export async function saveFormAction(id: string | null, raw: unknown): Promise<SaveFormResult> {
  await assertAdmin();
  const parsed = parseFormInput(raw);
  if (!parsed.ok) return parsed;
  try {
    if (id === null) {
      const created = await createForm(parsed.value);
      refresh();
      return { ok: true, id: created };
    }
    if (!UUID_PATTERN.test(id)) return { ok: false, error: "Formulaire invalide." };
    const updated = await updateForm(id, parsed.value);
    if (!updated) return { ok: false, error: "Ce formulaire n'existe plus." };
    refresh();
    return { ok: true, id };
  } catch (error) {
    if (isMissingFormsTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}

export async function createFromTemplateAction(key: string): Promise<SaveFormResult> {
  await assertAdmin();
  if (key !== "test" && key !== "hydrant") return { ok: false, error: "Modèle inconnu." };
  try {
    const id = await createForm(TEMPLATES[key].input);
    refresh();
    return { ok: true, id };
  } catch (error) {
    if (isMissingFormsTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}

export async function deleteFormAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return { ok: false, error: "Formulaire invalide." };
  try {
    const removed = await deleteForm(id);
    refresh();
    revalidatePath("/admin/reports");
    return removed ? { ok: true } : { ok: false, error: "Ce formulaire n'existe plus." };
  } catch (error) {
    if (isMissingFormsTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}
