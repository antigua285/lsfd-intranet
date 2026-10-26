/**
 * Règles d'accès par flags, sans base de données (utilisables côté serveur et navigateur).
 *
 * - Un flag est un code court en majuscules (ex. « ACTS »).
 * - Une catégorie ou un formulaire peut exiger des flags : il suffit d'en posséder UN.
 * - Aucun flag exigé = ouvert à tous les membres connectés.
 * - Les modérateurs passent partout.
 */
import type { Result } from "./validation";

export const FLAG_PATTERN = /^[A-Z][A-Z0-9_]{1,23}$/;
export const MAX_FLAGS_PER_ITEM = 20;

export function hasAccess(isAdmin: boolean, userFlags: readonly string[], required: readonly string[]): boolean {
  if (isAdmin || required.length === 0) return true;
  return required.some((flag) => userFlags.includes(flag));
}

/** Liste de codes reçue du navigateur : majuscules, sans doublon, format vérifié. */
export function parseFlagCodes(raw: unknown): Result<string[]> {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw) || raw.length > MAX_FLAGS_PER_ITEM) return { ok: false, error: "Liste de flags invalide." };
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") return { ok: false, error: "Liste de flags invalide." };
    const code = item.trim().toUpperCase();
    if (!FLAG_PATTERN.test(code)) return { ok: false, error: `Flag invalide : « ${item} ».` };
    if (!out.includes(code)) out.push(code);
  }
  return { ok: true, value: out };
}

export type FlagInput = { code: string; name: string; description: string };

export function parseFlagInput(raw: { code?: unknown; name?: unknown; description?: unknown }): Result<FlagInput> {
  const code = typeof raw.code === "string" ? raw.code.trim().toUpperCase() : "";
  if (!FLAG_PATTERN.test(code)) {
    return { ok: false, error: "Code invalide : 2 à 24 caractères, lettres majuscules, chiffres ou _, en commençant par une lettre." };
  }
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name || name.length > 80) return { ok: false, error: "Le nom est obligatoire (80 caractères max)." };
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  if (description.length > 300) return { ok: false, error: "La description est trop longue (300 caractères max)." };
  return { ok: true, value: { code, name, description } };
}

/** Identifiant stable d'une catégorie : `key` si le code en fournit un, sinon le titre « nettoyé ». */
export function moduleKey(mod: { key?: string; title: string }): string {
  if (mod.key) return mod.key;
  return mod.title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ModuleRule = { flags: string[]; position: number | null };

/** Ordre d'affichage : ceux qui ont une position d'abord (croissante), puis les autres dans l'ordre du code. */
export function orderModules<T extends { key?: string; title: string }>(mods: readonly T[], rules: ReadonlyMap<string, ModuleRule>): T[] {
  return mods
    .map((mod, index) => ({ mod, index, position: rules.get(moduleKey(mod))?.position ?? null }))
    .sort((a, b) => {
      if (a.position !== null && b.position !== null) return a.position - b.position || a.index - b.index;
      if (a.position !== null) return -1;
      if (b.position !== null) return 1;
      return a.index - b.index;
    })
    .map((x) => x.mod);
}
