import { DETAIL_FIELDS, FEATURE_KINDS, type FeatureKind } from "./map-types";
import { isValidIsoDate } from "./map-validation";
import {
  FIELD_META,
  FIELD_TYPES,
  formatDate,
  type FormAction,
  type FormDefinition,
  type FormField,
  type SelectOption,
} from "./forms-types";
import { parseFlagCodes } from "./access-rules";
import { UUID_PATTERN, type Result } from "./validation";

const ID_PATTERN = /^[a-z][a-z0-9_]{2,31}$/;
const MAX_FIELDS = 80;
const MAX_ACTIONS = 20;
const MAX_OPTIONS = 40;

export const LIMITS = { title: 120, subtitle: 160, headerLine: 100, headerLines: 5, footer: 400, short: 200, long: 4000 };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function text(raw: unknown, label: string, max: number, required: boolean): Result<string> {
  if (raw === undefined || raw === null) raw = "";
  if (typeof raw !== "string") return fail(`${label} est invalide.`);
  const value = raw.replace(/\r\n/g, "\n").trim();
  if (required && !value) return fail(`${label} est obligatoire.`);
  if (value.length > max) return fail(`${label} est trop long (${max} caractères max).`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return fail(`${label} contient des caractères invalides.`);
  return { ok: true, value };
}

export type FormInput = {
  title: string;
  subtitle: string;
  headerLines: string[];
  footer: string;
  published: boolean;
  flags: string[];
  definition: FormDefinition;
};

/** Détails que les règles de la carte ont le droit d'écrire (liste fermée, jamais le nom ni la position). */
export function writableDetails(kind: FeatureKind) {
  return DETAIL_FIELDS[kind];
}

/**
 * Vérifie un formulaire reçu du navigateur (en-tête + champs + règles).
 * Rien n'est accepté tel quel : tout est reconstruit champ par champ.
 */
export function parseFormInput(raw: unknown): Result<FormInput> {
  if (!raw || typeof raw !== "object") return fail("Formulaire invalide.");
  const input = raw as Record<string, unknown>;

  const flags = parseFlagCodes(input.flags);
  if (!flags.ok) return flags;
  const title = text(input.title, "Le titre", LIMITS.title, true);
  if (!title.ok) return title;
  const subtitle = text(input.subtitle, "Le sous-titre", LIMITS.subtitle, false);
  if (!subtitle.ok) return subtitle;
  const footer = text(input.footer, "La note de bas de page", LIMITS.footer, false);
  if (!footer.ok) return footer;

  if (!Array.isArray(input.headerLines) || input.headerLines.length > LIMITS.headerLines) {
    return fail(`L'en-tête accepte ${LIMITS.headerLines} lignes au maximum.`);
  }
  const headerLines: string[] = [];
  for (const line of input.headerLines) {
    const clean = text(line, "Une ligne d'en-tête", LIMITS.headerLine, false);
    if (!clean.ok) return clean;
    if (clean.value) headerLines.push(clean.value);
  }

  const def = input.definition as { fields?: unknown; actions?: unknown } | undefined;
  if (!def || !Array.isArray(def.fields) || !Array.isArray(def.actions)) return fail("Structure du formulaire invalide.");
  if (def.fields.length > MAX_FIELDS) return fail(`Un formulaire est limité à ${MAX_FIELDS} champs.`);
  if (def.actions.length > MAX_ACTIONS) return fail(`Limite de ${MAX_ACTIONS} actions sur la carte.`);

  const fields: FormField[] = [];
  const ids = new Set<string>();
  for (const item of def.fields) {
    const f = item as Record<string, unknown>;
    if (typeof f?.id !== "string" || !ID_PATTERN.test(f.id) || ids.has(f.id)) return fail("Identifiant de champ invalide.");
    if (!(FIELD_TYPES as readonly unknown[]).includes(f.type)) return fail("Type de champ invalide.");
    const type = f.type as FormField["type"];
    const answered = FIELD_META[type].answered;
    const label = text(f.label, answered ? "Le libellé d'un champ" : "Le texte", type === "note" ? 800 : 200, true);
    if (!label.ok) return label;
    const field: FormField = { id: f.id, type, label: label.value };
    if (answered && f.required === true) field.required = true;
    if (f.width === "half" && type !== "long" && type !== "checkbox") field.width = "half";

    if (type === "select" || type === "checkbox") {
      const min = type === "select" ? 2 : 1;
      if (!Array.isArray(f.options) || f.options.length < min || f.options.length > MAX_OPTIONS) {
        return fail(`« ${label.value} » : ${type === "select" ? "une liste de choix" : "des cases à cocher"} demande entre ${min} et ${MAX_OPTIONS} choix.`);
      }
      const options: SelectOption[] = [];
      const optionIds = new Set<string>();
      for (const o of f.options) {
        const opt = o as Record<string, unknown>;
        if (typeof opt?.id !== "string" || !ID_PATTERN.test(opt.id) || optionIds.has(opt.id)) return fail("Identifiant de choix invalide.");
        const optLabel = text(opt.label, "Un choix", 100, true);
        if (!optLabel.ok) return optLabel;
        optionIds.add(opt.id);
        options.push({ id: opt.id, label: optLabel.value });
      }
      field.options = options;
      if (type === "checkbox") {
        field.multiple = f.multiple !== false;
        const columns = Number(f.columns);
        field.columns = ([1, 2, 3, 4] as const).find((c) => c === columns) ?? 2;
      }
    }
    if (type === "feature") {
      if (!(FEATURE_KINDS as readonly unknown[]).includes(f.featureKind)) return fail(`« ${label.value} » : choisis un type de point.`);
      field.featureKind = f.featureKind as FeatureKind;
    }
    ids.add(f.id);
    fields.push(field);
  }

  const actions: FormAction[] = [];
  const actionIds = new Set<string>();
  for (const item of def.actions) {
    const a = item as Record<string, unknown>;
    if (typeof a?.id !== "string" || !ID_PATTERN.test(a.id) || actionIds.has(a.id)) return fail("Identifiant d'action invalide.");
    if (a.type !== "set_detail") return fail("Type d'action invalide.");
    const target = fields.find((f) => f.id === a.featureField && f.type === "feature");
    if (!target?.featureKind) return fail("Une action carte doit viser un champ « Point de la carte ».");
    const detail = writableDetails(target.featureKind).find((d) => d.key === a.detail);
    if (!detail) return fail("Cette information du point ne peut pas être modifiée par un formulaire.");

    const src = a.source as Record<string, unknown> | undefined;
    let source: FormAction["source"];
    if (src?.kind === "today") {
      if (detail.type !== "date") return fail(`« ${detail.label} » n'est pas une date : choisis un champ du formulaire.`);
      source = { kind: "today" };
    } else if (src?.kind === "field" && typeof src.field === "string") {
      const from = fields.find((f) => f.id === src.field);
      if (!from || !FIELD_META[from.type].answered || from.type === "feature" || from.type === "checkbox") return fail("Champ source invalide.");
      if (detail.type === "date" && from.type !== "date") return fail(`« ${detail.label} » attend un champ de type Date.`);
      if (detail.options && from.type !== "select") return fail(`« ${detail.label} » attend une liste de choix.`);
      if (!detail.options && detail.type !== "date" && from.type === "date") return fail(`« ${detail.label} » n'est pas une date.`);
      source = { kind: "field", field: from.id };
    } else {
      return fail("Source de l'action invalide.");
    }

    const action: FormAction = { id: a.id, type: "set_detail", featureField: target.id, detail: detail.key, source };
    if (detail.options && source.kind === "field") {
      const from = fields.find((f) => f.id === source.field)!;
      const mapping: Record<string, string> = {};
      const raw = (a.mapping ?? {}) as Record<string, unknown>;
      for (const option of from.options ?? []) {
        const mapped = raw[option.id];
        if (mapped === undefined || mapped === "") continue; // choix laissé sans effet
        if (typeof mapped !== "string" || !detail.options.some((o) => o.value === mapped)) {
          return fail(`Correspondance invalide pour « ${option.label} ».`);
        }
        mapping[option.id] = mapped;
      }
      if (Object.keys(mapping).length === 0) return fail(`Action « ${detail.label} » : relie au moins un choix à une valeur.`);
      action.mapping = mapping;
    }
    actionIds.add(a.id);
    actions.push(action);
  }

  return {
    ok: true,
    value: {
      title: title.value,
      subtitle: subtitle.value,
      headerLines,
      footer: footer.value,
      published: input.published === true,
      flags: flags.value,
      definition: { fields, actions },
    },
  };
}

export type AnswersResult = { answers: Record<string, string>; errors: Record<string, string> };

/** Vérifie les réponses d'une personne selon la définition (format uniquement ; l'existence des points est vue côté base). */
export function parseAnswers(definition: FormDefinition, raw: unknown): AnswersResult {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const answers: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const field of definition.fields) {
    if (!FIELD_META[field.type].answered) continue;
    const value = input[field.id];
    const clean = typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
    if (value !== undefined && typeof value !== "string") {
      errors[field.id] = "Réponse invalide.";
      continue;
    }
    if (!clean) {
      if (field.required) errors[field.id] = "Ce champ est obligatoire.";
      continue;
    }
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean)) {
      errors[field.id] = "Caractères invalides.";
      continue;
    }
    switch (field.type) {
      case "short":
      case "location":
        if (clean.length > LIMITS.short || clean.includes("\n")) errors[field.id] = `Maximum ${LIMITS.short} caractères sur une ligne.`;
        break;
      case "long":
        if (clean.length > LIMITS.long) errors[field.id] = `Maximum ${LIMITS.long} caractères.`;
        break;
      case "date":
        if (!isValidIsoDate(clean)) errors[field.id] = "Date invalide.";
        break;
      case "select":
        if (!field.options?.some((o) => o.id === clean)) errors[field.id] = "Choix invalide.";
        break;
      case "checkbox": {
        const ids = clean.split(",");
        const known = new Set((field.options ?? []).map((o) => o.id));
        if (ids.some((id) => !known.has(id)) || new Set(ids).size !== ids.length) errors[field.id] = "Choix invalide.";
        else if (field.multiple === false && ids.length > 1) errors[field.id] = "Un seul choix possible.";
        else {
          // ordre des cases du formulaire, quel que soit l'ordre d'arrivée
          answers[field.id] = (field.options ?? []).filter((o) => ids.includes(o.id)).map((o) => o.id).join(",");
          continue;
        }
        break;
      }
      case "feature":
        if (!UUID_PATTERN.test(clean)) errors[field.id] = "Point invalide.";
        break;
    }
    if (!errors[field.id]) answers[field.id] = clean;
  }
  return { answers, errors };
}

export type PlannedEffect = {
  actionId: string;
  featureId: string;
  featureKind: FeatureKind;
  detail: string;
  detailLabel: string;
  value: string;
  valueLabel: string;
};

/**
 * Transforme les règles du formulaire + les réponses en modifications concrètes à
 * appliquer sur la carte. Fonction pure : ne touche à aucune base de données.
 */
export function planEffects(definition: FormDefinition, answers: Record<string, string>, todayIso: string): PlannedEffect[] {
  const planned: PlannedEffect[] = [];
  for (const action of definition.actions) {
    const featureField = definition.fields.find((f) => f.id === action.featureField);
    const featureId = answers[action.featureField];
    if (!featureField?.featureKind || !featureId) continue;
    const detail = DETAIL_FIELDS[featureField.featureKind].find((d) => d.key === action.detail);
    if (!detail) continue;

    let value: string | undefined;
    if (action.source.kind === "today") value = todayIso;
    else if (detail.options) {
      const chosen = answers[action.source.field];
      value = chosen ? action.mapping?.[chosen] : undefined;
    } else value = answers[action.source.field];
    if (!value) continue;

    planned.push({
      actionId: action.id,
      featureId,
      featureKind: featureField.featureKind,
      detail: detail.key,
      detailLabel: detail.label,
      value,
      valueLabel: detail.type === "date" ? formatDate(value) : (detail.options?.find((o) => o.value === value)?.label ?? value),
    });
  }
  return planned;
}
