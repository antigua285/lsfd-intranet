import { query } from "./db";
import { parseFlagCodes } from "./access-rules";
import type { Result } from "./validation";

export const RANK_LIMITS = { name: 60, abbreviation: 12 };

export type Rank = { id: string; name: string; abbreviation: string; position: number; flags: string[]; members: number };

export function isMissingRankTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "42P01" || e?.code === "42703" || /relation "?ranks"?/i.test(e?.message ?? "") || /rank_id/i.test(e?.message ?? "");
}

const SELECT = `SELECT r.id, r.name, r.abbreviation, r.position, r.flags,
       (SELECT count(*) FROM users u WHERE u.rank_id = r.id)::int AS members
  FROM ranks r`;

/** Du plus haut au plus bas. */
export async function listRanks(): Promise<Rank[]> {
  return query<Rank>(`${SELECT} ORDER BY r.position DESC, lower(r.name)`);
}

export async function getRank(id: string): Promise<Rank | null> {
  return (await query<Rank>(`${SELECT} WHERE r.id = $1`, [id]))[0] ?? null;
}

/** Rang de chaque compte (id du compte → id du rang). */
export async function listUserRankIds(): Promise<Map<string, string>> {
  const rows = await query<{ id: string; rankId: string }>(`SELECT id, rank_id AS "rankId" FROM users WHERE rank_id IS NOT NULL`);
  return new Map(rows.map((r) => [r.id, r.rankId]));
}

export type RankInput = { name: string; abbreviation: string; flags: string[] };

export function parseRankInput(raw: unknown): Result<RankInput> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
  const name = clean(r.name);
  if (!name) return { ok: false, error: "Donne un nom au rang." };
  if (name.length > RANK_LIMITS.name) return { ok: false, error: `Nom trop long (${RANK_LIMITS.name} caractères max).` };
  const abbreviation = clean(r.abbreviation);
  if (abbreviation.length > RANK_LIMITS.abbreviation) return { ok: false, error: `Abréviation trop longue (${RANK_LIMITS.abbreviation} caractères max).` };
  if (/[\u0000-\u001f\u007f]/.test(name + abbreviation)) return { ok: false, error: "Caractères invalides." };
  const flags = parseFlagCodes(r.flags);
  if (!flags.ok) return flags;
  return { ok: true, value: { name, abbreviation, flags: flags.value } };
}

const isUnique = (e: unknown) => (e as { code?: string })?.code === "23505";

/** Le nouveau rang se place tout en haut de la hiérarchie. */
export async function createRank(input: RankInput): Promise<Result<string>> {
  try {
    const rows = await query<{ id: string }>(
      `INSERT INTO ranks (name, abbreviation, flags, position)
       VALUES ($1, $2, $3::text[], COALESCE((SELECT max(position) + 1 FROM ranks), 0)) RETURNING id`,
      [input.name, input.abbreviation, input.flags]
    );
    return { ok: true, value: rows[0].id };
  } catch (error) {
    if (isUnique(error)) return { ok: false, error: "Un rang porte déjà ce nom." };
    throw error;
  }
}

/** Modifie un rang : le nom est répercuté sur les membres, et les flags liés sont ajustés pour eux. */
export async function updateRank(id: string, input: RankInput): Promise<Result<true>> {
  const before = await getRank(id);
  if (!before) return { ok: false, error: "Ce rang n'existe plus." };
  try {
    await query(`UPDATE ranks SET name = $2, abbreviation = $3, flags = $4::text[] WHERE id = $1`, [id, input.name, input.abbreviation, input.flags]);
  } catch (error) {
    if (isUnique(error)) return { ok: false, error: "Un rang porte déjà ce nom." };
    throw error;
  }
  if (before.name !== input.name) await query(`UPDATE users SET grade = $2 WHERE rank_id = $1`, [id, input.name]);
  const added = input.flags.filter((f) => !before.flags.includes(f));
  const removed = before.flags.filter((f) => !input.flags.includes(f));
  if (added.length) {
    await query(`INSERT INTO user_flags (user_id, flag) SELECT u.id, f FROM users u CROSS JOIN unnest($2::text[]) AS f WHERE u.rank_id = $1 ON CONFLICT DO NOTHING`, [id, added]);
  }
  if (removed.length) {
    await query(`DELETE FROM user_flags WHERE flag = ANY($2::text[]) AND user_id IN (SELECT id FROM users WHERE rank_id = $1)`, [id, removed]);
  }
  return { ok: true, value: true };
}

/** Supprime un rang : les membres gardent leur grade affiché (texte) mais ne sont plus rattachés à un rang. Les flags déjà donnés restent. */
export async function deleteRank(id: string): Promise<boolean> {
  return (await query(`DELETE FROM ranks WHERE id = $1 RETURNING id`, [id])).length > 0;
}

/** Monte (vers le plus haut) ou descend un rang d'une place. */
export async function moveRank(id: string, direction: "up" | "down"): Promise<boolean> {
  const ranks = await listRanks(); // du plus haut au plus bas
  const i = ranks.findIndex((r) => r.id === id);
  if (i < 0) return false;
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= ranks.length) return true;
  const order = ranks.map((r) => r.id);
  [order[i], order[j]] = [order[j], order[i]];
  // positions recalculées proprement : le plus haut a la plus grande valeur
  for (let k = 0; k < order.length; k++) await query(`UPDATE ranks SET position = $2 WHERE id = $1`, [order[k], order.length - 1 - k]);
  return true;
}

/**
 * Affecte un rang à un compte (null = aucun) : le grade affiché prend le nom du rang, et les flags
 * liés à l'ancien rang sont retirés puis ceux du nouveau ajoutés.
 */
export async function setUserRank(userId: string, rankId: string | null, allowedFlags?: readonly string[]): Promise<boolean> {
  const current = (await query<{ rankId: string | null }>(`SELECT rank_id AS "rankId" FROM users WHERE id = $1`, [userId]))[0];
  if (!current) return false;
  if ((current.rankId ?? null) === rankId) return true;
  const oldRank = current.rankId ? await getRank(current.rankId) : null;
  const newRank = rankId ? await getRank(rankId) : null;
  if (rankId && !newRank) return false;
  await query(`UPDATE users SET rank_id = $2, grade = COALESCE($3, grade) WHERE id = $1`, [userId, rankId, newRank?.name ?? null]);
  // allowedFlags : un officier (non modérateur) ne peut donner ou retirer que les flags qu'il possède lui-même.
  const permitted = (f: string) => !allowedFlags || allowedFlags.includes(f);
  const keep = new Set(newRank?.flags ?? []);
  const drop = (oldRank?.flags ?? []).filter((f) => !keep.has(f) && permitted(f));
  const grant = (newRank?.flags ?? []).filter(permitted);
  if (drop.length) await query(`DELETE FROM user_flags WHERE user_id = $1 AND flag = ANY($2::text[])`, [userId, drop]);
  if (grant.length) {
    await query(`INSERT INTO user_flags (user_id, flag) SELECT $1, f FROM unnest($2::text[]) AS f ON CONFLICT DO NOTHING`, [userId, grant]);
  }
  return true;
}
