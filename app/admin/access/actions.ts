"use server";

import { revalidatePath } from "next/cache";
import { APP_MODULES } from "@/config/navigation";
import {
  createFlag,
  deleteFlag,
  isMissingAccessTableError,
  listModuleRules,
  setModuleFlags,
  setModuleOrder,
  setUserFlags,
  unknownFlags,
  updateFlag,
} from "@/lib/access";
import { moduleKey, orderModules, parseFlagCodes, parseFlagInput } from "@/lib/access-rules";
import { assertAdmin } from "@/lib/auth";
import { UUID_PATTERN } from "@/lib/validation";

export type AccessResult = { ok: true } | { ok: false; error: string };

const MISSING = "La base n'est pas à jour : lance `npm run db:setup` depuis ton PC, puis réessaie.";

function refresh() {
  revalidatePath("/admin/access");
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

async function guarded(work: () => Promise<AccessResult>): Promise<AccessResult> {
  await assertAdmin();
  try {
    return await work();
  } catch (error) {
    if (isMissingAccessTableError(error)) return { ok: false, error: MISSING };
    throw error;
  }
}

export async function createFlagAction(raw: { code: string; name: string; description: string }): Promise<AccessResult> {
  return guarded(async () => {
    const parsed = parseFlagInput(raw ?? {});
    if (!parsed.ok) return parsed;
    if (!(await createFlag(parsed.value))) return { ok: false, error: `Le flag ${parsed.value.code} existe déjà.` };
    refresh();
    return { ok: true };
  });
}

export async function updateFlagAction(raw: { code: string; name: string; description: string }): Promise<AccessResult> {
  return guarded(async () => {
    const parsed = parseFlagInput(raw ?? {});
    if (!parsed.ok) return parsed;
    if (!(await updateFlag(parsed.value))) return { ok: false, error: "Ce flag n'existe plus." };
    refresh();
    return { ok: true };
  });
}

export async function deleteFlagAction(code: string): Promise<AccessResult> {
  return guarded(async () => {
    const parsed = parseFlagCodes([code]);
    if (!parsed.ok) return parsed;
    const result = await deleteFlag(parsed.value[0]);
    if (result.ok) refresh();
    return result;
  });
}

/** Flags qui ouvrent une catégorie (vide = catégorie ouverte à tous). */
export async function saveModuleFlagsAction(key: string, rawFlags: unknown): Promise<AccessResult> {
  return guarded(async () => {
    if (!APP_MODULES.some((m) => moduleKey(m) === key)) return { ok: false, error: "Catégorie inconnue." };
    const flags = parseFlagCodes(rawFlags);
    if (!flags.ok) return flags;
    const unknown = await unknownFlags(flags.value);
    if (unknown.length) return { ok: false, error: `Flag inconnu : ${unknown.join(", ")}.` };
    await setModuleFlags(key, flags.value);
    refresh();
    return { ok: true };
  });
}

export async function moveModuleAction(key: string, direction: "up" | "down"): Promise<AccessResult> {
  return guarded(async () => {
    const keys = orderModules(APP_MODULES, await listModuleRules()).map((m) => moduleKey(m));
    const index = keys.indexOf(key);
    if (index === -1) return { ok: false, error: "Catégorie inconnue." };
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= keys.length) return { ok: true };
    [keys[index], keys[target]] = [keys[target], keys[index]];
    await setModuleOrder(keys);
    refresh();
    return { ok: true };
  });
}

/** Remplace les flags d'un compte. */
export async function setUserFlagsAction(userId: string, rawFlags: unknown): Promise<AccessResult> {
  return guarded(async () => {
    if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) return { ok: false, error: "Compte invalide." };
    const flags = parseFlagCodes(rawFlags);
    if (!flags.ok) return flags;
    const unknown = await unknownFlags(flags.value);
    if (unknown.length) return { ok: false, error: `Flag inconnu : ${unknown.join(", ")}.` };
    await setUserFlags(userId, flags.value);
    refresh();
    revalidatePath("/forms");
    return { ok: true };
  });
}

