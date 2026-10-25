import {
  DETAIL_FIELDS,
  FEATURE_KINDS,
  ZONE_KINDS,
  type FeatureKind,
  type MapPoint,
  type ZoneKind,
} from "./map-types";
import { UUID_PATTERN, parseShortText, type Result } from "./validation";

/** Tout ce qui arrive d'une action serveur vient du navigateur : on revérifie TOUT. */

export const MAX_ZONE_POINTS = 200;

/** « 2026-10-26 » valide (le 31 février est refusé). */
export function isValidIsoDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export function parseFeatureKind(raw: unknown): Result<FeatureKind> {
  return (FEATURE_KINDS as readonly unknown[]).includes(raw)
    ? { ok: true, value: raw as FeatureKind }
    : { ok: false, error: "Type de point invalide." };
}

export function parseZoneKind(raw: unknown): Result<ZoneKind> {
  return (ZONE_KINDS as readonly unknown[]).includes(raw)
    ? { ok: true, value: raw as ZoneKind }
    : { ok: false, error: "Type de zone invalide." };
}

export function parseMapName(raw: unknown): Result<string> {
  return parseShortText(typeof raw === "string" ? raw : "", "Le nom", 80);
}

/** Fraction de l'image entre 0 et 1 (un léger dépassement est ramené au bord). */
export function parseFraction(raw: unknown): Result<number> {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return { ok: false, error: "Position invalide." };
  }
  return { ok: true, value: Math.min(1, Math.max(0, raw)) };
}

export function parsePosition(x: unknown, y: unknown): Result<{ x: number; y: number }> {
  const px = parseFraction(x);
  const py = parseFraction(y);
  if (!px.ok) return px;
  if (!py.ok) return py;
  return { ok: true, value: { x: px.value, y: py.value } };
}

/** Liste d'identifiants de bataillons (sans doublon). */
export function parseMemberIds(raw: unknown): Result<string[]> {
  if (!Array.isArray(raw)) return { ok: false, error: "Liste de bataillons invalide." };
  if (raw.length > 100) return { ok: false, error: "Trop de bataillons dans un même bureau." };
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !UUID_PATTERN.test(item)) {
      return { ok: false, error: "Bataillon invalide." };
    }
    if (!ids.includes(item)) ids.push(item);
  }
  return { ok: true, value: ids };
}

export function parseColor(raw: unknown): Result<string> {
  if (typeof raw === "string" && /^#[0-9a-fA-F]{6}$/.test(raw)) {
    return { ok: true, value: raw.toLowerCase() };
  }
  return { ok: false, error: "Couleur invalide." };
}

export function parsePoints(raw: unknown): Result<MapPoint[]> {
  if (!Array.isArray(raw) || raw.length < 3) {
    return { ok: false, error: "Une zone a besoin d'au moins 3 sommets." };
  }
  if (raw.length > MAX_ZONE_POINTS) {
    return { ok: false, error: `Une zone ne peut pas dépasser ${MAX_ZONE_POINTS} sommets.` };
  }
  const points: MapPoint[] = [];
  for (const item of raw) {
    if (!Array.isArray(item) || item.length !== 2) return { ok: false, error: "Sommet invalide." };
    const x = parseFraction(item[0]);
    const y = parseFraction(item[1]);
    if (!x.ok || !y.ok) return { ok: false, error: "Sommet invalide." };
    points.push([x.value, y.value]);
  }
  return { ok: true, value: points };
}

/**
 * Ne garde que les champs prévus pour ce type de point, avec la bonne taille,
 * et vérifie les listes de choix. Les champs vides sont retirés.
 */
export function parseDetails(kind: FeatureKind, raw: unknown): Result<Record<string, string>> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Informations invalides." };
  }
  const input = raw as Record<string, unknown>;
  const details: Record<string, string> = {};
  for (const field of DETAIL_FIELDS[kind]) {
    const value = input[field.key];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string") return { ok: false, error: `${field.label} est invalide.` };
    const clean = value.replace(/\r\n/g, "\n").trim();
    if (!clean) continue;
    if (clean.length > field.max) {
      return { ok: false, error: `${field.label} est trop long (${field.max} caractères max).` };
    }
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean)) {
      return { ok: false, error: `${field.label} contient des caractères invalides.` };
    }
    if (field.type === "date" && !isValidIsoDate(clean)) {
      return { ok: false, error: `${field.label} : date invalide.` };
    }
    if (field.options && !field.options.some((o) => o.value === clean)) {
      return { ok: false, error: `${field.label} : choix invalide.` };
    }
    details[field.key] = clean;
  }
  return { ok: true, value: details };
}
