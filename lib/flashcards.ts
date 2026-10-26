import { parseFlagCodes } from "./access-rules";
import { canManageWith, isTrainer, type AccessContext } from "./access";
import { query } from "./db";
import { CARD_LIMITS, type Flashcard } from "./flashcards-types";
import type { Result } from "./validation";

export { CARD_LIMITS, type Flashcard };

export type CardInput = { topic: string; question: string; answer: string; flags: string[]; manageFlags: string[]; applyToTopic: boolean };

const COLUMNS = `id, topic, question, answer, flags, manage_flags AS "manageFlags"`;

/** Peut réviser cette carte : modérateur, détenteur d'un flag « visible par », ou formateur qui la gère. */
export function canStudyCard(ctx: AccessContext, card: Flashcard): boolean {
  if (ctx.user.isAdmin || card.flags.length === 0) return true;
  return card.flags.some((f) => ctx.flags.includes(f)) || canManageWith(ctx, card.manageFlags);
}

/** Cartes que ce compte voit, avec « editable » renseigné. */
export function cardsFor(ctx: AccessContext, cards: Flashcard[]): Flashcard[] {
  return cards.filter((c) => canStudyCard(ctx, c)).map((c) => ({ ...c, editable: isTrainer(ctx) && canManageWith(ctx, c.manageFlags) }));
}


export function isMissingFlashcardsTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "42P01" || e?.code === "42703" || /relation "?flashcards"? does not exist|column "?(manage_)?flags"? does not exist/i.test(e?.message ?? "");
}

export function parseCardInput(raw: unknown): Result<CardInput> {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Carte invalide." };
  const r = raw as Record<string, unknown>;
  const field = (value: unknown, label: string, max: number, required: boolean): Result<string> => {
    const text = typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
    if (required && !text) return { ok: false, error: `${label} est obligatoire.` };
    if (text.length > max) return { ok: false, error: `${label} est trop long (${max} caractères max).` };
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) return { ok: false, error: `${label} contient des caractères invalides.` };
    return { ok: true, value: text };
  };
  const question = field(r.question, "La question", CARD_LIMITS.question, true);
  if (!question.ok) return question;
  const answer = field(r.answer, "La réponse", CARD_LIMITS.answer, true);
  if (!answer.ok) return answer;
  const topic = field(r.topic, "Le thème", CARD_LIMITS.topic, false);
  if (!topic.ok) return topic;
  const flags = parseFlagCodes(r.flags);
  if (!flags.ok) return flags;
  const manageFlags = parseFlagCodes(r.manageFlags);
  if (!manageFlags.ok) return manageFlags;
  return { ok: true, value: { question: question.value, answer: answer.value, topic: topic.value, flags: flags.value, manageFlags: manageFlags.value, applyToTopic: r.applyToTopic === true } };
}

export async function listCards(): Promise<Flashcard[]> {
  return query<Flashcard>(`SELECT ${COLUMNS} FROM flashcards ORDER BY topic, created_at`);
}

export async function createCard(input: CardInput): Promise<Flashcard> {
  const [row] = await query<Flashcard>(
    `INSERT INTO flashcards (topic, question, answer, flags, manage_flags) VALUES ($1, $2, $3, $4::text[], $5::text[]) RETURNING ${COLUMNS}`,
    [input.topic, input.question, input.answer, input.flags, input.manageFlags]
  );
  return row;
}

export async function updateCard(id: string, input: CardInput): Promise<Flashcard | null> {
  const rows = await query<Flashcard>(
    `UPDATE flashcards SET topic = $2, question = $3, answer = $4, flags = $5::text[], manage_flags = $6::text[], updated_at = now()
      WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, input.topic, input.question, input.answer, input.flags, input.manageFlags]
  );
  return rows[0] ?? null;
}

export async function getCard(id: string): Promise<Flashcard | null> {
  const rows = await query<Flashcard>(`SELECT ${COLUMNS} FROM flashcards WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/**
 * Applique les accès d'une carte à toutes les cartes du même thème que ce formateur a le droit de gérer.
 * Renvoie les identifiants modifiés.
 */
export async function applyAccessToTopic(ctx: AccessContext, topic: string, flags: string[], manageFlags: string[]): Promise<string[]> {
  if (!topic) return [];
  const rows = await query<Flashcard>(`SELECT ${COLUMNS} FROM flashcards WHERE topic = $1`, [topic]);
  const ids = rows.filter((c) => canManageWith(ctx, c.manageFlags)).map((c) => c.id);
  if (ids.length === 0) return [];
  await query(`UPDATE flashcards SET flags = $2::text[], manage_flags = $3::text[], updated_at = now() WHERE id = ANY($1::uuid[])`, [ids, flags, manageFlags]);
  return ids;
}

export async function deleteCard(id: string): Promise<boolean> {
  const rows = await query(`DELETE FROM flashcards WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}
