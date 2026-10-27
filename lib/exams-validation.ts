import { parseFlagCodes } from "./access-rules";
import {
  EXAM_LIMITS,
  QUESTION_TYPES,
  gradableQuestions,
  isChoice,
  isLayout,
  type AnswerValue,
  type ChecklistItem,
  type ExamKind,
  type ExamOption,
  type ExamQuestion,
  type ExamSnapshot,
  type Grade,
  type PublicQuestion,
  type QuestionType,
} from "./exams-types";
import { UUID_PATTERN, type Result } from "./validation";

const ID_PATTERN = /^[a-z][a-z0-9_]{2,31}$/;
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

function intOrNull(raw: unknown, label: string, min: number, max: number): Result<number | null> {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: null };
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return fail(`${label} doit être un nombre entier entre ${min} et ${max}.`);
  return { ok: true, value: n };
}

function points(raw: unknown, max: number, label: string): Result<number> {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > max) return fail(`${label} doit être entre 0 et ${max}.`);
  return { ok: true, value: Math.round(n * 100) / 100 };
}

export type ExamInput = {
  title: string;
  description: string;
  durationMinutes: number | null;
  thresholdPercent: number | null;
  maxAttempts: number;
  published: boolean;
  kind: ExamKind;
  /** Flags des TD autorisés à gérer / corriger l'examen (vide = toute la TD). */
  manageFlags: string[];
  questions: ExamQuestion[];
  /** Nouvelle clé d'accès (vide = ne pas changer). */
  newKey: string;
};

/** Vérifie un examen reçu du navigateur : tout est reconstruit champ par champ. */
export function parseExamInput(raw: unknown): Result<ExamInput> {
  if (!raw || typeof raw !== "object") return fail("Examen invalide.");
  const input = raw as Record<string, unknown>;
  const title = text(input.title, "Le nom de l'examen", EXAM_LIMITS.title, true);
  if (!title.ok) return title;
  const description = text(input.description, "La description", EXAM_LIMITS.description, false);
  if (!description.ok) return description;
  const duration = intOrNull(input.durationMinutes, "La durée", 1, 600);
  if (!duration.ok) return duration;
  const threshold = intOrNull(input.thresholdPercent, "Le seuil", 1, 100);
  if (!threshold.ok) return threshold;
  const attempts = intOrNull(input.maxAttempts ?? 1, "Le nombre de tentatives", 1, 20);
  if (!attempts.ok) return attempts;
  const kind: ExamKind = input.kind === "practical" ? "practical" : "written";
  const manageFlags = parseFlagCodes(input.manageFlags);
  if (!manageFlags.ok) return manageFlags;

  let newKey = "";
  if (input.newKey !== undefined && input.newKey !== null && input.newKey !== "") {
    if (typeof input.newKey !== "string") return fail("Clé invalide.");
    newKey = input.newKey.trim();
    if (newKey.length < EXAM_LIMITS.keyMin || newKey.length > EXAM_LIMITS.key) {
      return fail(`La clé d'accès doit faire entre ${EXAM_LIMITS.keyMin} et ${EXAM_LIMITS.key} caractères.`);
    }
  }

  if (!Array.isArray(input.questions) || input.questions.length > EXAM_LIMITS.questions) {
    return fail(`Un examen est limité à ${EXAM_LIMITS.questions} questions.`);
  }
  const questions: ExamQuestion[] = [];
  const ids = new Set<string>();
  for (const [index, rawQ] of input.questions.entries()) {
    const label = `Question ${index + 1}`;
    const q = rawQ as Record<string, unknown>;
    if (typeof q?.id !== "string" || !ID_PATTERN.test(q.id) || ids.has(q.id)) return fail(`${label} : identifiant invalide.`);
    ids.add(q.id);
    if (!QUESTION_TYPES.includes(q.type as QuestionType)) return fail(`${label} : type invalide.`);
    const type = q.type as QuestionType;
    const prompt = text(q.prompt, `${label} : l'énoncé`, EXAM_LIMITS.prompt, true);
    if (!prompt.ok) return prompt;
    const situation = text(q.situation, `${label} : la mise en situation`, EXAM_LIMITS.situation, false);
    if (!situation.ok) return situation;
    const pts = isLayout(type) ? ({ ok: true, value: 0 } as const) : points(q.points ?? 1, EXAM_LIMITS.maxPoints, `${label} : les points`);
    if (!pts.ok) return pts;
    let imageId: string | null = null;
    if (q.imageId !== null && q.imageId !== undefined && q.imageId !== "") {
      if (typeof q.imageId !== "string" || !UUID_PATTERN.test(q.imageId)) return fail(`${label} : image invalide.`);
      imageId = q.imageId;
    }
    const practicalType = type === "criterion" || isLayout(type);
    if ((kind === "practical") !== practicalType) {
      return fail(kind === "practical" ? `${label} : un examen pratique ne contient que des critères, des noms de catégorie et des textes explicatifs.` : `${label} : ce type est réservé aux examens pratiques.`);
    }
    const question: ExamQuestion = { id: q.id, type, prompt: prompt.value, situation: situation.value, imageId, points: pts.value };
    if (type === "criterion" && q.eliminatory === true) question.eliminatory = true;
    if (type === "criterion" && Array.isArray(q.checklist) && q.checklist.length > 0) {
      if (q.checklist.length > EXAM_LIMITS.checklistItems) return fail(`${label} : ${EXAM_LIMITS.checklistItems} points de checklist au maximum.`);
      const itemIds = new Set<string>();
      const checklist: ChecklistItem[] = [];
      for (const rawItem of q.checklist) {
        const item = rawItem as Record<string, unknown>;
        if (typeof item?.id !== "string" || !ID_PATTERN.test(item.id) || itemIds.has(item.id)) return fail(`${label} : identifiant de checklist invalide.`);
        itemIds.add(item.id);
        const itemLabel = text(item.label, `${label} : un point de checklist`, EXAM_LIMITS.checklistLabel, true);
        if (!itemLabel.ok) return itemLabel;
        checklist.push({ id: item.id, label: itemLabel.value });
      }
      question.checklist = checklist;
    }
    if (isChoice(type)) {
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > EXAM_LIMITS.options) {
        return fail(`${label} : prévois entre 2 et ${EXAM_LIMITS.options} choix.`);
      }
      const optIds = new Set<string>();
      const options: ExamOption[] = [];
      for (const rawO of q.options) {
        const o = rawO as Record<string, unknown>;
        if (typeof o?.id !== "string" || !ID_PATTERN.test(o.id) || optIds.has(o.id)) return fail(`${label} : identifiant de choix invalide.`);
        optIds.add(o.id);
        const optLabel = text(o.label, `${label} : le texte d'un choix`, EXAM_LIMITS.option, true);
        if (!optLabel.ok) return optLabel;
        options.push({ id: o.id, label: optLabel.value, correct: o.correct === true });
      }
      const correct = options.filter((o) => o.correct).length;
      if (type === "single" && correct !== 1) return fail(`${label} : un choix unique a exactement une bonne réponse.`);
      if (type === "multiple" && correct < 1) return fail(`${label} : coche au moins une bonne réponse.`);
      question.options = options;
    }
    questions.push(question);
  }

  return {
    ok: true,
    value: {
      title: title.value,
      description: description.value,
      durationMinutes: kind === "practical" ? null : duration.value,
      thresholdPercent: threshold.value,
      maxAttempts: kind === "practical" ? 1 : attempts.value ?? 1,
      published: input.published === true,
      kind,
      manageFlags: manageFlags.value,
      questions,
      newKey: kind === "practical" ? "" : newKey,
    },
  };
}

/** Retire les bonnes réponses : à utiliser pour TOUT ce qui part vers le candidat. */
export function toPublicQuestions(questions: ExamQuestion[]): PublicQuestion[] {
  return questions.map((q) => {
    const { options, ...rest } = q;
    return options ? { ...rest, options: options.map((o) => ({ id: o.id, label: o.label })) } : rest;
  });
}

/** Réponses du candidat, validées contre les questions du passage. Tout ce qui n'est pas attendu est ignoré. */
export function parseAnswers(snapshot: ExamSnapshot, raw: unknown): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = {};
  if (!raw || typeof raw !== "object") return out;
  const given = raw as Record<string, unknown>;
  for (const q of snapshot.questions) {
    const value = given[q.id];
    const clean = (s: string, max: number) => s.replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max);
    if (q.type === "single") {
      if (typeof value === "string" && q.options?.some((o) => o.id === value)) out[q.id] = value;
    } else if (q.type === "multiple") {
      if (Array.isArray(value)) {
        const picked = q.options!.filter((o) => value.includes(o.id)).map((o) => o.id);
        if (picked.length) out[q.id] = picked;
      }
    } else if (typeof value === "string" && value.trim()) {
      out[q.id] = clean(value, q.type === "short" ? EXAM_LIMITS.shortAnswer : EXAM_LIMITS.longAnswer);
    }
  }
  return out;
}

/** Suggestion de note pour les questions à choix (tout ou rien). null = question à corriger à la main. */
export function autoScore(q: ExamQuestion, answer: AnswerValue | undefined): number | null {
  if (!isChoice(q.type) || !q.options) return null;
  const correct = q.options.filter((o) => o.correct).map((o) => o.id).sort();
  const given = (Array.isArray(answer) ? answer : answer ? [answer] : []).slice().sort();
  const same = given.length === correct.length && given.every((id, i) => id === correct[i]);
  return same ? q.points : 0;
}

/** Note saisie par l'examinateur : bornée aux points de la question. */
export function parseGrades(snapshot: ExamSnapshot, raw: unknown): Result<Record<string, Grade>> {
  const out: Record<string, Grade> = {};
  const given = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  for (const q of gradableQuestions(snapshot.questions)) {
    const g = given[q.id] as Record<string, unknown> | undefined;
    if (!g) continue;
    let pts: number | null = null;
    if (g.points !== null && g.points !== undefined && g.points !== "") {
      const p = points(g.points, q.points, "Les points");
      if (!p.ok) return fail(`${q.prompt.slice(0, 40)}… : les points doivent être entre 0 et ${q.points}.`);
      pts = p.value;
    }
    const comment = text(g.comment, "Le commentaire", EXAM_LIMITS.comment, false);
    if (!comment.ok) return comment;
    out[q.id] = { points: pts, comment: comment.value };
  }
  return { ok: true, value: out };
}

/** Cases cochées de la checklist de chaque critère : seuls les identifiants de la checklist du critère sont acceptés. */
export function parseChecks(snapshot: ExamSnapshot, raw: unknown): Result<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  const given = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  for (const q of snapshot.questions) {
    if (!q.checklist?.length) continue;
    const value = given[q.id];
    if (value === undefined) continue;
    if (!Array.isArray(value)) return fail("Checklist invalide.");
    const valid = new Set(q.checklist.map((i) => i.id));
    const ids = value.filter((v): v is string => typeof v === "string" && valid.has(v));
    out[q.id] = q.checklist.map((i) => i.id).filter((id) => ids.includes(id));
  }
  return { ok: true, value: out };
}

export function parseComment(raw: unknown): Result<string> {
  return text(raw, "Le commentaire général", EXAM_LIMITS.comment, false);
}
