import polygonClipping from "polygon-clipping";
import type { MapPoint, MapZone } from "./map-types";

/** Anneau = liste de sommets ; polygone = anneau extérieur + trous ; multi = plusieurs polygones. */
export type Ring = MapPoint[];
export type Poly = Ring[];
export type Multi = Poly[];

/** Bataillons réellement utilisables dans l'assemblage d'un bureau. */
export function assembledBattalions(zone: MapZone, all: MapZone[]): MapZone[] {
  if (zone.kind !== "bureau" || !zone.members?.length) return [];
  return zone.members
    .map((id) => all.find((z) => z.id === id))
    .filter((z): z is MapZone => !!z && z.kind === "battalion" && z.points.length >= 3);
}

/** Vrai si la forme du bureau vient de ses bataillons (et non de son propre tracé). */
export function usesAssembly(zone: MapZone, all: MapZone[]): boolean {
  return assembledBattalions(zone, all).length > 0;
}

function area(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
}

/** Forme à dessiner : l'union des bataillons pour un assemblage, sinon le tracé propre. */
export function zoneGeometry(zone: MapZone, all: MapZone[]): Multi {
  const parts = assembledBattalions(zone, all);
  if (parts.length > 0) {
    const polygons: Poly[] = parts.map((b) => [b.points.map((p): MapPoint => [p[0], p[1]])]);
    try {
      const merged = polygonClipping.union(polygons[0], ...polygons.slice(1)) as unknown as Multi;
      // Le plus grand morceau en premier : c'est là que s'affiche le nom.
      return merged.sort((a, b) => area(b[0]) - area(a[0]));
    } catch {
      return polygons; // en cas de tracé impossible à fusionner : on affiche les morceaux tels quels
    }
  }
  return zone.points.length >= 3 ? [[zone.points]] : [];
}
