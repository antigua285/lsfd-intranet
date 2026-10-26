/**
 * Types et constantes de la carte, partagés entre le serveur et le navigateur.
 * (Aucun accès base de données ici.)
 */

export const FEATURE_KINDS = ["station", "hydrant", "risk", "weather"] as const;
export type FeatureKind = (typeof FEATURE_KINDS)[number];

export const ZONE_KINDS = ["battalion", "bureau"] as const;
export type ZoneKind = (typeof ZONE_KINDS)[number];

export type MapFeature = {
  id: string;
  kind: FeatureKind;
  name: string;
  /** Position en fraction de l'image : 0 = gauche, 1 = droite. */
  x: number;
  /** Position en fraction de l'image : 0 = haut, 1 = bas. */
  y: number;
  details: Record<string, string>;
  /** ID automatique à 5 chiffres (bornes incendie uniquement). */
  code: string | null;
  /** Dernier rapport (formulaire) lié à ce point, s'il y en a un. */
  lastReport?: { id: string; title: string; at: string } | null;
};

export type MapPoint = [number, number];

export type MapZone = {
  id: string;
  kind: ZoneKind;
  name: string;
  color: string;
  /** Tracé propre à la zone (conservé même quand le bureau est un assemblage). */
  points: MapPoint[];
  /** Bureaux uniquement : bataillons assemblés. Vide ou null = on utilise `points`. */
  members: string[] | null;
};

/** Fichier de fond de carte : à placer dans le dossier `public` du projet. */
export const MAP_IMAGE_URL = "/map.png";

export const FEATURE_META: Record<FeatureKind, { label: string; plural: string; color: string }> = {
  station: { label: "Station", plural: "Stations", color: "#b91c1c" },
  hydrant: { label: "Borne incendie", plural: "Bornes incendie", color: "#dc2626" },
  risk: { label: "Bâtiment à risque", plural: "Bâtiments à risque", color: "#ea580c" },
  weather: { label: "Point météo", plural: "Points météo", color: "#0284c7" },
};

export const ZONE_META: Record<ZoneKind, { label: string; plural: string; defaultColor: string }> = {
  battalion: { label: "Bataillon", plural: "Bataillons", defaultColor: "#2563eb" },
  bureau: { label: "Bureau", plural: "Bureaux", defaultColor: "#16a34a" },
};

export const ZONE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#78716c",
];

export type DetailField = {
  key: string;
  label: string;
  max: number;
  multiline?: boolean;
  /** "date" : calendrier (AAAA-MM-JJ). */
  type?: "date";
  options?: { value: string; label: string }[];
};

/**
 * Informations propres à chaque type de point. C'est ici qu'on ajoute un champ :
 * il apparaît tout seul dans le formulaire d'édition et dans les fiches.
 */
export const DETAIL_FIELDS: Record<FeatureKind, DetailField[]> = {
  station: [
    { key: "number", label: "N° de station", max: 10 },
    { key: "address", label: "Adresse", max: 120 },
    { key: "apparatus", label: "Engins / équipement", max: 200, multiline: true },
  ],
  hydrant: [
    {
      key: "type",
      label: "Type",
      max: 20,
      options: [
        { value: "standard", label: "Standard" },
        { value: "sigelock", label: "Sigelock" },
        { value: "dry", label: "Dry hydrant (sec)" },
        { value: "captivater", label: "Captivater" },
      ],
    },
    {
      key: "status",
      label: "État",
      max: 20,
      options: [
        { value: "in_service", label: "En service" },
        { value: "to_check", label: "À vérifier" },
        { value: "out_of_service", label: "Hors service" },
      ],
    },
    { key: "lastInspection", label: "Dernière inspection", max: 10, type: "date" },
    { key: "address", label: "Emplacement / adresse", max: 120 },
    { key: "notes", label: "Remarques", max: 300, multiline: true },
  ],
  risk: [
    { key: "address", label: "Adresse", max: 120 },
    {
      key: "hazard",
      label: "Niveau de risque",
      max: 20,
      options: [
        { value: "low", label: "Faible" },
        { value: "medium", label: "Moyen" },
        { value: "high", label: "Élevé" },
      ],
    },
    { key: "occupancy", label: "Type d'occupation", max: 80 },
    { key: "notes", label: "Remarques", max: 300, multiline: true },
  ],
  weather: [{ key: "notes", label: "Remarques", max: 300, multiline: true }],
};

/** Valeurs mises d'office à la création d'un point. */
export const DEFAULT_DETAILS: Record<FeatureKind, Record<string, string>> = {
  station: {},
  hydrant: { status: "in_service", type: "standard" },
  risk: { hazard: "medium" },
  weather: {},
};

export function optionLabel(kind: FeatureKind, key: string, value: string): string {
  const field = DETAIL_FIELDS[kind].find((f) => f.key === key);
  return field?.options?.find((o) => o.value === value)?.label ?? value;
}

/** Lignes "Libellé : valeur" à afficher dans une fiche (champs renseignés uniquement). */
export function detailLines(feature: MapFeature): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = [];
  if (feature.kind === "hydrant" && feature.code) lines.push({ label: "ID", value: feature.code });
  for (const field of DETAIL_FIELDS[feature.kind]) {
    const raw = feature.details[field.key];
    if (!raw) continue;
    const value =
      field.type === "date"
        ? raw.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$2/$3/$1")
        : optionLabel(feature.kind, field.key, raw);
    lines.push({ label: field.label, value });
  }
  return lines;
}

/** Recherche par nom ou par ID (« 42 » trouve la borne 00042). `needle` est déjà en minuscules et sans espaces autour. */
export function featureMatches(f: { name: string; code?: string | null }, needle: string): boolean {
  if (!needle) return true;
  return f.name.toLowerCase().includes(needle) || (f.code ?? "").includes(needle);
}

/**
 * Suggestions de noms de bornes par bloc de 3 lettres : si « DVS1 » à « DVS5 » existent, taper « DVS »
 * propose « DVS6 ». Les préfixes sont reconnus automatiquement d'après les noms déjà utilisés
 * (3 lettres suivies d'un numéro, avec un éventuel espace ou tiret que l'on reprend tel quel).
 * `exceptId` : la borne en cours de modification, qu'on ne compte pas.
 */
export function suggestHydrantNames(
  features: { id: string; kind: string; name: string }[],
  typed: string,
  exceptId?: string
): string[] {
  const input = typed.trim().toUpperCase();
  const m = /^([A-Z]{1,3})(?:[ -]?(\d*))?$/.exec(input);
  if (!m) return [];
  const [, letters, digits = ""] = m;
  const groups = new Map<string, { max: number; sep: string }>();
  const taken = new Set<string>();
  for (const f of features) {
    if (f.kind !== "hydrant" || f.id === exceptId) continue;
    taken.add(f.name.trim().toUpperCase());
    const n = /^([A-Za-z]{3})([ -]?)(\d+)$/.exec(f.name.trim());
    if (!n) continue;
    const prefix = n[1].toUpperCase();
    const value = parseInt(n[3], 10);
    const cur = groups.get(prefix);
    if (!cur || value > cur.max) groups.set(prefix, { max: value, sep: n[2] });
  }
  const out: string[] = [];
  for (const [prefix, { max, sep }] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!prefix.startsWith(letters)) continue;
    const next = `${prefix}${sep}${max + 1}`;
    if (digits && !String(max + 1).startsWith(digits)) continue;
    if (taken.has(next.toUpperCase())) continue;
    out.push(next);
  }
  return out.slice(0, 6);
}

export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
}
