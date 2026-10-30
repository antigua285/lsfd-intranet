"use server";

import { revalidatePath } from "next/cache";
import { unknownFlags } from "@/lib/access";
import { assertAdmin } from "@/lib/auth";
import { createRank, deleteRank, isMissingRankTableError, moveRank, parseRankInput, updateRank } from "@/lib/ranks";
import { UUID_PATTERN } from "@/lib/validation";

export type RankResult = { ok: true; message: string } | { ok: false; error: string };

async function guarded(work: () => Promise<RankResult>): Promise<RankResult> {
  await assertAdmin();
  try {
    const r = await work();
    if (r.ok) { revalidatePath("/admin/ranks"); revalidatePath("/admin"); revalidatePath("/organization"); }
    return r;
  } catch (error) {
    if (isMissingRankTableError(error)) return { ok: false, error: "La base n'est pas à jour : lance `npm run db:setup` depuis ton PC." };
    throw error;
  }
}

export async function saveRankAction(id: string | null, raw: unknown): Promise<RankResult> {
  return guarded(async () => {
    const parsed = parseRankInput(raw);
    if (!parsed.ok) return parsed;
    const unknown = await unknownFlags(parsed.value.flags);
    if (unknown.length) return { ok: false, error: `Flag inconnu : ${unknown.join(", ")}.` };
    if (id === null) {
      const r = await createRank(parsed.value);
      return r.ok ? { ok: true, message: "Rang créé (tout en haut de la hiérarchie)." } : r;
    }
    if (!UUID_PATTERN.test(id)) return { ok: false, error: "Rang invalide." };
    const r = await updateRank(id, parsed.value);
    return r.ok ? { ok: true, message: "Rang modifié." } : r;
  });
}

export async function deleteRankAction(id: string): Promise<RankResult> {
  return guarded(async () => {
    if (!UUID_PATTERN.test(id)) return { ok: false, error: "Rang invalide." };
    return (await deleteRank(id)) ? { ok: true, message: "Rang supprimé." } : { ok: false, error: "Ce rang n'existe plus." };
  });
}

export async function moveRankAction(id: string, direction: "up" | "down"): Promise<RankResult> {
  return guarded(async () => {
    if (!UUID_PATTERN.test(id) || (direction !== "up" && direction !== "down")) return { ok: false, error: "Demande invalide." };
    return (await moveRank(id, direction)) ? { ok: true, message: "Ordre mis à jour." } : { ok: false, error: "Ce rang n'existe plus." };
  });
}
