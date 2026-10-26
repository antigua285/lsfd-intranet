/**
 * Types et constantes des formulaires / rapports, partagés entre le serveur et le navigateur.
 * (Aucun accès base de données ici.)
 */
import type { FeatureKind } from "./map-types";

export const FIELD_TYPES = ["short", "long", "date", "select", "checkbox", "image", "location", "feature", "heading", "note"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_META: Record<FieldType, { label: string; hint: string; answered: boolean }> = {
  short: { label: "Réponse courte", hint: "Une ligne de texte", answered: true },
  long: { label: "Réponse longue", hint: "Paragraphe", answered: true },
  date: { label: "Date", hint: "Calendrier", answered: true },
  select: { label: "Liste de choix", hint: "Un choix parmi plusieurs", answered: true },
  checkbox: { label: "Cases à cocher", hint: "Cases comme sur le papier : plusieurs réponses ou une seule", answered: true },
  image: { label: "Image (lien)", hint: "Lien direct imgur ou imgbb : l'image n'est pas stockée sur le site", answered: true },
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
  /** Cases à cocher : true = plusieurs réponses possibles (par défaut), false = une seule. */
  multiple?: boolean;
  /** Cases à cocher : nombre de colonnes sur le papier (1 à 4, 2 par défaut). */
  columns?: 1 | 2 | 3 | 4;
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

/** Pièce jointe d'un rapport : un lien d'image (imgur / imgbb) et une légende facultative. */
export type Attachment = { url: string; caption: string };
export const MAX_ATTACHMENTS = 10;
export const MAX_CAPTION = 80;

export type FormDefinition = {
  fields: FormField[];
  actions: FormAction[];
  /** Le rapporteur peut joindre jusqu'à MAX_ATTACHMENTS liens d'images. */
  allowAttachments?: boolean;
};

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
  /** Pièces jointes (liens d'images) ; vide si le formulaire ne les autorisait pas. */
  attachments: Attachment[];
};

/** « 2026-10-26 » -> « 10/26/2026 » (présentation américaine, comme les formulaires officiels). */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : iso;
}

/** Hébergeurs d'images acceptés : on ne stocke qu'un lien, jamais le fichier. */
export const ALLOWED_IMAGE_HOSTS = ["i.imgur.com", "i.ibb.co"] as const;

/** Vérifie un lien d'image (https, hébergeur autorisé, lien direct vers un fichier image). */
export function parseImageUrl(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const text = raw.trim();
  if (text.length > 300 || /\s/.test(text)) return { ok: false, error: "Lien invalide." };
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "Lien invalide : colle l'adresse complète de l'image (https://…)." };
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return { ok: false, error: "Le lien doit commencer par https://." };
  if (!(ALLOWED_IMAGE_HOSTS as readonly string[]).includes(url.hostname.toLowerCase())) {
    return { ok: false, error: "Lien non accepté : utilise un lien direct imgur (i.imgur.com/….png) ou imgbb (i.ibb.co/…)." };
  }
  if (!/\.(png|jpe?g|gif|webp)$/i.test(url.pathname)) {
    return { ok: false, error: "Utilise le lien direct de l'image (qui finit par .png, .jpg, .gif ou .webp)." };
  }
  return { ok: true, value: url.href };
}

/** Réponse d'un champ « cases à cocher » : identifiants des cases cochées, séparés par des virgules. */
export function checkedIds(raw: string | undefined): string[] {
  return raw ? raw.split(",").filter(Boolean) : [];
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
    case "checkbox":
      return checkedIds(raw)
        .map((id) => field.options?.find((o) => o.id === id)?.label ?? "")
        .filter(Boolean)
        .join(", ");
    case "feature":
      return labels[field.id] ?? "";
    case "image":
      return ""; // une image ne se résume pas en texte
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
