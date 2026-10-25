"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import {
  createFeature,
  createZone,
  deleteFeature,
  deleteZone,
  isMissingMapTableError,
  listFeatures,
  moveFeature,
  updateFeature,
  updateZone,
} from "@/lib/map";
import { DEFAULT_DETAILS, type MapFeature, type MapZone } from "@/lib/map-types";
import {
  parseColor,
  parseDetails,
  parseFeatureKind,
  parseMapName,
  parsePoints,
  parsePosition,
  parseZoneKind,
} from "@/lib/map-validation";
import { UUID_PATTERN } from "@/lib/validation";

export type FeatureResult = { ok: true; feature: MapFeature } | { ok: false; error: string };
export type ZoneResult = { ok: true; zone: MapZone } | { ok: false; error: string };
export type DeleteResult = { ok: true } | { ok: false; error: string };

// Chaque action revérifie que l'appelant est modérateur : une action peut être
// appelée sans passer par la page, la page seule ne protège donc pas.

const MISSING_TABLE =
  "La base n'est pas à jour : lance `npm run db:setup` depuis ton PC, puis réessaie.";
const NOT_FOUND = "Cet élément n'existe plus (supprimé par un autre modérateur ?). Recharge la page.";

async function guarded<T extends { ok: boolean }>(
  task: () => Promise<T | { ok: false; error: string }>
): Promise<T | { ok: false; error: string }> {
  await assertAdmin();
  try {
    const result = await task();
    if (result.ok) revalidatePath("/map");
    return result;
  } catch (error) {
    if (isMissingMapTableError(error)) return { ok: false, error: MISSING_TABLE };
    throw error;
  }
}

function isId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export async function createFeatureAction(input: {
  kind: string;
  x: number;
  y: number;
}): Promise<FeatureResult> {
  return guarded<FeatureResult>(async () => {
    const kind = parseFeatureKind(input?.kind);
    if (!kind.ok) return kind;
    const position = parsePosition(input.x, input.y);
    if (!position.ok) return position;
    const feature = await createFeature({
      kind: kind.value,
      x: position.value.x,
      y: position.value.y,
      details: DEFAULT_DETAILS[kind.value],
    });
    return { ok: true, feature };
  }) as Promise<FeatureResult>;
}

export async function updateFeatureAction(
  id: string,
  fields: { name: string; details: Record<string, string> }
): Promise<FeatureResult> {
  return guarded<FeatureResult>(async () => {
    if (!isId(id)) return { ok: false, error: "Élément invalide." };
    const name = parseMapName(fields?.name);
    if (!name.ok) return name;
    // Le type du point est relu en base : on ne fait pas confiance au navigateur.
    const current = (await listFeatures()).find((f) => f.id === id);
    if (!current) return { ok: false, error: NOT_FOUND };
    const details = parseDetails(current.kind, fields.details);
    if (!details.ok) return details;
    const feature = await updateFeature(id, { name: name.value, details: details.value });
    return feature ? { ok: true, feature } : { ok: false, error: NOT_FOUND };
  }) as Promise<FeatureResult>;
}

export async function moveFeatureAction(id: string, x: number, y: number): Promise<FeatureResult> {
  return guarded<FeatureResult>(async () => {
    if (!isId(id)) return { ok: false, error: "Élément invalide." };
    const position = parsePosition(x, y);
    if (!position.ok) return position;
    const feature = await moveFeature(id, position.value.x, position.value.y);
    return feature ? { ok: true, feature } : { ok: false, error: NOT_FOUND };
  }) as Promise<FeatureResult>;
}

export async function deleteFeatureAction(id: string): Promise<DeleteResult> {
  return guarded<DeleteResult>(async () => {
    if (!isId(id)) return { ok: false, error: "Élément invalide." };
    return (await deleteFeature(id)) ? { ok: true } : { ok: false, error: NOT_FOUND };
  }) as Promise<DeleteResult>;
}

export async function createZoneAction(input: { kind: string; points: unknown }): Promise<ZoneResult> {
  return guarded<ZoneResult>(async () => {
    const kind = parseZoneKind(input?.kind);
    if (!kind.ok) return kind;
    const points = parsePoints(input.points);
    if (!points.ok) return points;
    const zone = await createZone({ kind: kind.value, points: points.value });
    return { ok: true, zone };
  }) as Promise<ZoneResult>;
}

/** Ne modifie que les champs fournis (nom, type, couleur et/ou forme). */
export async function updateZoneAction(
  id: string,
  fields: { name?: string; kind?: string; color?: string; points?: unknown }
): Promise<ZoneResult> {
  return guarded<ZoneResult>(async () => {
    if (!isId(id)) return { ok: false, error: "Élément invalide." };
    const patch: Parameters<typeof updateZone>[1] = {};
    if (fields?.name !== undefined) {
      const name = parseMapName(fields.name);
      if (!name.ok) return name;
      patch.name = name.value;
    }
    if (fields?.kind !== undefined) {
      const kind = parseZoneKind(fields.kind);
      if (!kind.ok) return kind;
      patch.kind = kind.value;
    }
    if (fields?.color !== undefined) {
      const color = parseColor(fields.color);
      if (!color.ok) return color;
      patch.color = color.value;
    }
    if (fields?.points !== undefined) {
      const points = parsePoints(fields.points);
      if (!points.ok) return points;
      patch.points = points.value;
    }
    const zone = await updateZone(id, patch);
    return zone ? { ok: true, zone } : { ok: false, error: NOT_FOUND };
  }) as Promise<ZoneResult>;
}

export async function deleteZoneAction(id: string): Promise<DeleteResult> {
  return guarded<DeleteResult>(async () => {
    if (!isId(id)) return { ok: false, error: "Élément invalide." };
    return (await deleteZone(id)) ? { ok: true } : { ok: false, error: NOT_FOUND };
  }) as Promise<DeleteResult>;
}
