"use server";

import { requireUser } from "@/lib/auth";
import { isMissingMapTableError, listFeatures, listZones } from "@/lib/map";
import type { MapFeature, MapZone } from "@/lib/map-types";
import { isPathAllowed } from "@/lib/module-gate";

export type MdcMapData = { ok: true; features: MapFeature[]; zones: MapZone[] } | { ok: false; error: string };

/** Charge les données de la carte à l'ouverture de l'application (pas avant : le bureau reste léger). */
export async function loadMdcMapAction(): Promise<MdcMapData> {
  const me = await requireUser();
  // Les règles d'accès de la page Carte du site s'appliquent aussi ici.
  if (!(await isPathAllowed(me.id, "/map"))) return { ok: false, error: "Tu n'as pas accès à la carte." };
  try {
    const [features, zones] = await Promise.all([listFeatures(), listZones()]);
    return { ok: true, features, zones };
  } catch (error) {
    if (isMissingMapTableError(error)) return { ok: false, error: "La base n'est pas à jour : un modérateur doit lancer `npm run db:setup`." };
    throw error;
  }
}
