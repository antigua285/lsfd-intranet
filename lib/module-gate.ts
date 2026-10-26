import { APP_MODULES } from "@/config/navigation";
import { hasAccess, moduleKey } from "./access-rules";
import { query } from "./db";

/**
 * Catégories (de config/navigation.ts) qui couvrent cette adresse : celles dont le lien est
 * l'adresse elle-même ou un parent (ex. « /documents » couvre « /documents/fire1 »).
 * Seul le lien le plus précis compte.
 */
export function modulesForPath(pathname: string) {
  const covering = APP_MODULES.filter(
    (m) => m.link !== "/" && (pathname === m.link || pathname.startsWith(`${m.link}/`))
  );
  if (covering.length === 0) return [];
  const longest = Math.max(...covering.map((m) => m.link.length));
  return covering.filter((m) => m.link.length === longest);
}

/**
 * Ce compte a-t-il le droit d'ouvrir cette adresse ? Appelé par proxy.ts AVANT l'affichage de
 * la page : un contrôle dans un layout ne protégerait rien (les pages d'un layout se
 * rendent indépendamment de lui).
 * Tant que les tables de flags n'existent pas (db:setup pas encore lancé), tout reste ouvert.
 */
export async function isPathAllowed(userId: string, pathname: string): Promise<boolean> {
  const mods = modulesForPath(pathname);
  if (mods.length === 0) return true;
  try {
    const [user] = await query<{ isAdmin: boolean; flags: string[] }>(
      `SELECT u.is_admin AS "isAdmin",
              COALESCE((SELECT array_agg(f.flag) FROM user_flags f WHERE f.user_id = u.id), '{}') AS flags
         FROM users u WHERE u.id = $1`,
      [userId]
    );
    if (!user) return false;
    if (user.isAdmin) return true;
    const rules = await query<{ key: string; flags: string[] }>(
      `SELECT module_key AS key, flags FROM module_access WHERE module_key = ANY($1::text[])`,
      [mods.map(moduleKey)]
    );
    const required = new Map(rules.map((r) => [r.key, r.flags]));
    // Si plusieurs catégories partagent un lien, la plus restrictive l'emporte : restreindre
    // l'une d'elles ne doit pas être contourné par l'autre.
    return mods.every((m) => hasAccess(false, user.flags, required.get(moduleKey(m)) ?? []));
  } catch (error) {
    const e = error as { code?: string; message?: string } | null;
    if (e?.code === "42P01" || e?.code === "42703") return true;
    throw error;
  }
}
