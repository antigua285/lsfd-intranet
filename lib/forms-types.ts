/**
 * Types et constantes des formulaires / rapports, partagés entre le serveur et le navigateur.
 * (Aucun accès base de données ici.)
 */
import type { FeatureKind } from "./map-types";

export const FIELD_TYPES = ["short", "long", "date", "select", "location", "feature", "heading", "note"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_META: Record<FieldType, { label: string; hint: string; answered: boolean }> = {
  short: { label: "Réponse courte", hint: "Une ligne de texte", answered: true },
  long: { label: "Réponse longue", hint: "Paragraphe", answered: true },
  date: { label: "Date", hint: "Calendrier", answered: true },
  select: { label: "Liste de choix", hint: "Un choix parmi plusieurs", answered: true },
  location: { label: "Localisation", hint: "Rues et quartiers de Los Santos, avec suggestions", answered: true },
  feature: { label: "Point de la carte", hint: "Une borne, une station… choisie dans la carte", answered: true },
  heading: { label: "Titre de section", hint: "Texte en gras, sans réponse", answered: false },
  note: { label: "Texte / note", hint: "Paragraphe explicatif, sans réponse", answered: false },
};

export type SelectOption = { id: string; label: string };

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  /** "half" : deux champs côte à côte, comme « City » et « Zip » sur le PDF officiel. */
  width?: "full" | "half";
  options?: SelectOption[];
  featureKind?: FeatureKind;
};

/**
 * Règle « Actions sur la carte » : à l'envoi, écrit une information sur le point choisi
 * dans un champ de type « Point de la carte ».
 */
export type FormAction = {
  id: string;
  type: "set_detail";
  /** Champ « Point de la carte » qui désigne le point à modifier. */
  featureField: string;
  /** Information du point à modifier (clé de DETAIL_FIELDS). */
  detail: string;
  source: { kind: "field"; field: string } | { kind: "today" };
  /** Pour une liste de choix : identifiant du choix -> valeur de l'information du point. */
  mapping?: Record<string, string>;
};

export type FormDefinition = { fields: FormField[]; actions: FormAction[] };

/** Contenu d'un formulaire tel qu'il apparaît sur le papier officiel. */
export type FormContent = {
  title: string;
  subtitle: string;
  headerLines: string[];
  footer: string;
  definition: FormDefinition;
};

export type FormRecord = FormContent & {
  id: string;
  published: boolean;
  /** Flags d'accès (au moins un requis). Vide = tous les membres. */
  flags: string[];
  createdAt: string;
  updatedAt: string;
};

export type EffectLogEntry = {
  actionId: string;
  ok: boolean;
  /** Texte lisible, par exemple « Borne 12 : État → Hors service ». */
  message: string;
};

export type SubmissionSummary = {
  id: string;
  formId: string | null;
  formTitle: string;
  submitterName: string;
  status: "new" | "reviewed";
  summary: string;
  createdAt: string;
};

export type Submission = SubmissionSummary & {
  submittedBy: string | null;
  /** Flags dont les détenteurs peuvent lire ce rapport. */
  formFlags: string[];
  snapshot: FormContent;
  answers: Record<string, string>;
  /** Texte à afficher pour les réponses qui ne sont pas du texte brut (ex. point de la carte). */
  labels: Record<string, string>;
  effects: EffectLogEntry[];
};

/** « 2026-10-26 » -> « 10/26/2026 » (présentation américaine, comme les formulaires officiels). */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : iso;
}

/** Texte à imprimer pour la réponse d'un champ. */
export function answerText(field: FormField, answers: Record<string, string>, labels: Record<string, string>): string {
  const raw = answers[field.id];
  if (!raw) return "";
  switch (field.type) {
    case "date":
      return formatDate(raw);
    case "select":
      return field.options?.find((o) => o.id === raw)?.label ?? "";
    case "feature":
      return labels[field.id] ?? "";
    default:
      return raw;
  }
}

export function newId(prefix = "f"): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}_${id}`;
}
