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
    { key: "number", label: "N° de borne", max: 20 },
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

export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
}
