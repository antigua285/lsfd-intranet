import "server-only";
import { cache } from "react";
import { APP_MODULES } from "@/config/navigation";
import { getCurrentUser } from "./auth";
import { hasAccess, moduleKey, orderModules, type FlagInput, type ModuleRule } from "./access-rules";
import { query } from "./db";
import { modulesForPath } from "./module-gate";
import type { PublicUser } from "./users";

export type Flag = FlagInput & { createdAt: string };

/** Vrai si les tables de flags n'existent pas encore (base pas mise à jour). */
export function isMissingAccessTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return (
    e?.code === "42P01" ||
    e?.code === "42703" ||
    /relation "?(flags|user_flags|module_access)"? does not exist/i.test(e?.message ?? "")
  );
}

/* ------------------------------------------------------------------- flags */

export async function listFlags(): Promise<Flag[]> {
  return query<Flag>(`SELECT code, name, description, created_at AS "createdAt" FROM flags ORDER BY code`);
}

export async function createFlag(input: FlagInput): Promise<boolean> {
  const rows = await query(
    `INSERT INTO flags (code, name, description) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING RETURNING code`,
    [input.code, input.name, input.description]
  );
  return rows.length > 0;
}

export async function updateFlag(input: FlagInput): Promise<boolean> {
  const rows = await query(`UPDATE flags SET name = $2, description = $3 WHERE code = $1 RETURNING code`, [
    input.code,
    input.name,
    input.description,
  ]);
  return rows.length > 0;
}

/** Où un flag est exigé (catégories et formulaires) : sert à refuser sa suppression. */
export async function flagUsage(code: string): Promise<string[]> {
  const usage: string[] = [];
  for (const row of await query<{ module_key: string }>(`SELECT module_key FROM module_access WHERE $1 = ANY(flags)`, [code])) {
    const mod = APP_MODULES.find((m) => moduleKey(m) === row.module_key);
    usage.push(`catégorie « ${mod?.title ?? row.module_key} »`);
  }
  for (const row of await query<{ title: string }>(`SELECT title FROM forms WHERE $1 = ANY(flags)`, [code])) {
    usage.push(`formulaire « ${row.title} »`);
  }
  return usage;
}

/**
 * Supprime un flag. Refusé tant qu'il est exigé quelque part : retirer le dernier flag d'une
 * catégorie la rendrait publique sans que personne ne l'ait décidé.
 */
export async function deleteFlag(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const usage = await flagUsage(code);
  if (usage.length) return { ok: false, error: `Ce flag est encore exigé par : ${usage.join(", ")}. Retire-le d'abord.` };
  await query(`DELETE FROM flags WHERE code = $1`, [code]);
  return { ok: true };
}

/** Codes inconnus parmi ceux demandés (pour refuser un flag qui n'existe pas). */
export async function unknownFlags(codes: string[]): Promise<string[]> {
  if (codes.length === 0) return [];
  const rows = await query<{ code: string }>(`SELECT code FROM flags WHERE code = ANY($1::text[])`, [codes]);
  const known = new Set(rows.map((r) => r.code));
  return codes.filter((c) => !known.has(c));
}

/* ------------------------------------------------------------ flags des comptes */

export async function getUserFlags(userId: string): Promise<string[]> {
  const rows = await query<{ flag: string }>(`SELECT flag FROM user_flags WHERE user_id = $1 ORDER BY flag`, [userId]);
  return rows.map((r) => r.flag);
}

export async function listAllUserFlags(): Promise<Map<string, string[]>> {
  const rows = await query<{ userId: string; flag: string }>(
    `SELECT user_id AS "userId", flag FROM user_flags ORDER BY flag`
  );
  const map = new Map<string, string[]>();
  for (const r of rows) map.set(r.userId, [...(map.get(r.userId) ?? []), r.flag]);
  return map;
}

/** Remplace tous les flags d'un compte par la liste donnée. */
export async function setUserFlags(userId: string, flags: string[]): Promise<void> {
  await query(`DELETE FROM user_flags WHERE user_id = $1 AND NOT (flag = ANY($2::text[]))`, [userId, flags]);
  if (flags.length) {
    await query(
      `INSERT INTO user_flags (user_id, flag) SELECT $1, f FROM unnest($2::text[]) AS f ON CONFLICT DO NOTHING`,
      [userId, flags]
    );
  }
}

/* ------------------------------------------------------------------ catégories */

export async function listModuleRules(): Promise<Map<string, ModuleRule>> {
  const rows = await query<{ key: string; flags: string[]; position: number | null }>(
    `SELECT module_key AS key, flags, position FROM module_access`
  );
  return new Map(rows.map((r) => [r.key, { flags: r.flags, position: r.position }]));
}

export async function setModuleFlags(key: string, flags: string[]): Promise<void> {
  await query(
    `INSERT INTO module_access (module_key, flags) VALUES ($1, $2::text[])
     ON CONFLICT (module_key) DO UPDATE SET flags = EXCLUDED.flags`,
    [key, flags]
  );
}

/** Écrit l'ordre complet des catégories (0, 1, 2…) en conservant leurs flags. */
export async function setModuleOrder(keys: string[]): Promise<void> {
  await query(
    `INSERT INTO module_access (module_key, position)
     SELECT k, (i - 1)::int FROM unnest($1::text[]) WITH ORDINALITY AS t(k, i)
     ON CONFLICT (module_key) DO UPDATE SET position = EXCLUDED.position`,
    [keys]
  );
}

/* ----------------------------------------------------- contexte de la requête */

export type AccessContext = {
  user: PublicUser;
  flags: string[];
  rules: Map<string, ModuleRule>;
};

/**
 * Qui est connecté, avec quels flags, et quelles règles pèsent sur les catégories.
 * Si la base n'est pas encore à jour, on n'applique AUCUNE restriction (le site reste
 * utilisable) ; `db:setup` active le système.
 */
export const getAccessContext = cache(async (): Promise<AccessContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const [flags, rules] = await Promise.all([getUserFlags(user.id), listModuleRules()]);
    return { user, flags, rules };
  } catch (error) {
    if (!isMissingAccessTableError(error)) throw error;
    return { user, flags: [], rules: new Map() };
  }
});

export function canSee(ctx: AccessContext, required: readonly string[]): boolean {
  return hasAccess(ctx.user.isAdmin, ctx.flags, required);
}

/** Catégories que le compte connecté a le droit de voir, dans l'ordre réglé par les modérateurs. */
export async function getVisibleModules() {
  const ctx = await getAccessContext();
  if (!ctx) return [];
  // Même règle que proxy.ts (module-gate) : une catégorie n'est visible que si son adresse est ouverte,
  // c'est-à-dire si TOUTES les catégories qui partagent ce lien le sont.
  const open = (mod: (typeof APP_MODULES)[number]) =>
    modulesForPath(mod.link).every((m) => canSee(ctx, ctx.rules.get(moduleKey(m))?.flags ?? []));
  return orderModules(APP_MODULES, ctx.rules).filter((mod) => (modulesForPath(mod.link).length ? open(mod) : canSee(ctx, ctx.rules.get(moduleKey(mod))?.flags ?? [])));
}
