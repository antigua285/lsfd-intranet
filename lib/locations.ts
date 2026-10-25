import { DISTRICTS, HIGHWAYS, STREETS_BLAINE_COUNTY, STREETS_LOS_SANTOS } from "./locations-data";

export type PlaceSuggestion = { name: string; kind: "district" | "street" | "highway" };

const ALL: PlaceSuggestion[] = [
  ...DISTRICTS.map((name) => ({ name, kind: "district" as const })),
  ...STREETS_LOS_SANTOS.map((name) => ({ name, kind: "street" as const })),
  ...STREETS_BLAINE_COUNTY.map((name) => ({ name, kind: "street" as const })),
  ...HIGHWAYS.map((name) => ({ name, kind: "highway" as const })),
];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Sépare ce que la personne a tapé en « numéro de rue éventuel » + « début du nom »,
 * pour proposer des lieux même après « 1234 Vine… ».
 */
export function splitAddress(text: string): { prefix: string; query: string } {
  const match = /^\s*(\d+[a-zA-Z]?\s+)?(.*)$/.exec(text);
  return { prefix: match?.[1] ?? "", query: match?.[2] ?? "" };
}

/** Suggestions pour ce texte : d'abord les noms qui commencent par la saisie, puis ceux qui la contiennent. */
export function suggestPlaces(text: string, limit = 8): PlaceSuggestion[] {
  const { query } = splitAddress(text);
  const q = norm(query).trim();
  if (q.length < 1) return [];
  const starts: PlaceSuggestion[] = [];
  const contains: PlaceSuggestion[] = [];
  for (const place of ALL) {
    const n = norm(place.name);
    if (n.startsWith(q)) starts.push(place);
    else if (n.split(/\s+/).some((w) => w.startsWith(q)) || n.includes(q)) contains.push(place);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
