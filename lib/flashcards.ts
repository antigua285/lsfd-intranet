import { query } from "./db";
import type { Result } from "./validation";

export type Flashcard = { id: string; topic: string; question: string; answer: string };
export type CardInput = { topic: string; question: string; answer: string };

export const CARD_LIMITS = { topic: 40, question: 400, answer: 1500 };

export function isMissingFlashcardsTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "42P01" || /relation "?flashcards"? does not exist/i.test(e?.message ?? "");
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
  return { ok: true, value: { question: question.value, answer: answer.value, topic: topic.value } };
}

export async function listCards(): Promise<Flashcard[]> {
  return query<Flashcard>(`SELECT id, topic, question, answer FROM flashcards ORDER BY topic, created_at`);
}

export async function createCard(input: CardInput): Promise<Flashcard> {
  const [row] = await query<Flashcard>(
    `INSERT INTO flashcards (topic, question, answer) VALUES ($1, $2, $3) RETURNING id, topic, question, answer`,
    [input.topic, input.question, input.answer]
  );
  return row;
}

export async function updateCard(id: string, input: CardInput): Promise<Flashcard | null> {
  const rows = await query<Flashcard>(
    `UPDATE flashcards SET topic = $2, question = $3, answer = $4, updated_at = now()
      WHERE id = $1 RETURNING id, topic, question, answer`,
    [id, input.topic, input.question, input.answer]
  );
  return rows[0] ?? null;
}

export async function deleteCard(id: string): Promise<boolean> {
  const rows = await query(`DELETE FROM flashcards WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}
