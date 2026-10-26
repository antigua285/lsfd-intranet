import { query } from "./db";
import type { Result } from "./validation";

import type { Comment, NotebookRow, TemplateCategory, TemplateItem } from "./probation-shared";
import { LIMITS } from "./probation-shared";

export * from "./probation-shared";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/i;

export function isMissingProbationTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "42P01" || /relation "?probation_\w+"? does not exist/i.test(e?.message ?? "");
}

/* ------------------------------------------------------------------ validation */

function text(value: unknown, label: string, max: number): Result<string> {
  const t = typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
  if (!t) return { ok: false, error: `${label} est obligatoire.` };
  if (t.length > max) return { ok: false, error: `${label} est trop long (${max} caractères max).` };
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(t)) return { ok: false, error: `${label} contient des caractères invalides.` };
  return { ok: true, value: t };
}

export function parseTemplate(raw: unknown): Result<TemplateCategory[]> {
  if (!Array.isArray(raw)) return { ok: false, error: "Modèle invalide." };
  if (raw.length > LIMITS.categories) return { ok: false, error: `${LIMITS.categories} catégories au maximum.` };
  const seen = new Set<string>();
  const out: TemplateCategory[] = [];
  for (const c of raw) {
    if (!c || typeof c !== "object") return { ok: false, error: "Catégorie invalide." };
    const cat = c as Record<string, unknown>;
    const title = text(cat.title, "Le titre de la catégorie", LIMITS.title);
    if (!title.ok) return title;
    if (typeof cat.id !== "string" || !ID_PATTERN.test(cat.id) || seen.has(cat.id)) return { ok: false, error: "Identifiant de catégorie invalide." };
    seen.add(cat.id);
    if (!Array.isArray(cat.items) || cat.items.length > LIMITS.items) return { ok: false, error: `${LIMITS.items} compétences au maximum par catégorie.` };
    const items: TemplateItem[] = [];
    for (const i of cat.items) {
      const it = (i ?? {}) as Record<string, unknown>;
      const label = text(it.label, `Une compétence de « ${title.value} »`, LIMITS.label);
      if (!label.ok) return label;
      if (typeof it.id !== "string" || !ID_PATTERN.test(it.id) || seen.has(it.id)) return { ok: false, error: "Identifiant de compétence invalide." };
      seen.add(it.id);
      items.push({ id: it.id, label: label.value });
    }
    out.push({ id: cat.id, title: title.value, items });
  }
  return { ok: true, value: out };
}

export function parseComment(raw: unknown): Result<string> {
  return text(raw, "Le commentaire", LIMITS.comment);
}

/* ------------------------------------------------------------------ modèle */

export async function getTemplate(): Promise<TemplateCategory[]> {
  const rows = await query<{ categories: TemplateCategory[] }>(`SELECT categories FROM probation_template WHERE id = 1`);
  return rows[0]?.categories ?? [];
}

export async function saveTemplate(categories: TemplateCategory[]): Promise<void> {
  await query(
    `INSERT INTO probation_template (id, categories) VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO UPDATE SET categories = EXCLUDED.categories, updated_at = now()`,
    [JSON.stringify(categories)]
  );
}

/* ------------------------------------------------------------------ carnets */

const NB_COLUMNS = `id, user_id AS "userId", owner_name AS "ownerName", checked, created_at AS "createdAt",
  archived_at AS "archivedAt", archived_by AS "archivedBy", snapshot`;

/**
 * Crée le carnet de chaque détenteur du flag PROB qui n'en a encore aucun
 * (un carnet archivé compte : on ne le recrée pas dans son dos, il se restaure).
 */
export async function syncNotebooks(): Promise<void> {
  await query(
    `INSERT INTO probation_notebooks (user_id, owner_name)
     SELECT u.id, u.first_name || ' ' || u.last_name
       FROM user_flags uf JOIN users u ON u.id = uf.user_id
      WHERE uf.flag = 'PROB'
        AND NOT EXISTS (SELECT 1 FROM probation_notebooks n WHERE n.user_id = u.id)`
  );
}

export async function listNotebooks(archived: boolean): Promise<NotebookRow[]> {
  return query<NotebookRow>(
    `SELECT ${NB_COLUMNS} FROM probation_notebooks WHERE archived_at IS ${archived ? "NOT NULL" : "NULL"}
      ORDER BY ${archived ? "archived_at DESC" : "owner_name"}`
  );
}

export async function getNotebook(id: string): Promise<NotebookRow | null> {
  const rows = await query<NotebookRow>(`SELECT ${NB_COLUMNS} FROM probation_notebooks WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getNotebookOfUser(userId: string): Promise<NotebookRow | null> {
  const rows = await query<NotebookRow>(
    `SELECT ${NB_COLUMNS} FROM probation_notebooks WHERE user_id = $1 AND archived_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] ?? null;
}

/** Coche / décoche une compétence d'un carnet actif. false = carnet introuvable ou archivé. */
export async function setTick(notebookId: string, itemId: string, checked: boolean, by: string): Promise<boolean> {
  const tick = JSON.stringify({ by, at: new Date().toISOString() });
  const rows = checked
    ? await query(
        `UPDATE probation_notebooks SET checked = jsonb_set(checked, ARRAY[$2]::text[], $3::jsonb, true)
          WHERE id = $1 AND archived_at IS NULL RETURNING id`,
        [notebookId, itemId, tick]
      )
    : await query(
        `UPDATE probation_notebooks SET checked = checked - $2::text WHERE id = $1 AND archived_at IS NULL RETURNING id`,
        [notebookId, itemId]
      );
  return rows.length > 0;
}

export async function archiveNotebook(id: string, by: string): Promise<boolean> {
  const template = await getTemplate();
  const rows = await query(
    `UPDATE probation_notebooks SET archived_at = now(), archived_by = $2, snapshot = $3::jsonb
      WHERE id = $1 AND archived_at IS NULL RETURNING id`,
    [id, by, JSON.stringify({ categories: template })]
  );
  return rows.length > 0;
}

/** Restaure un carnet archivé (un seul carnet actif par personne). */
export async function restoreNotebook(id: string): Promise<Result<true>> {
  const nb = await getNotebook(id);
  if (!nb || !nb.archivedAt) return { ok: false, error: "Ce carnet n'est pas archivé." };
  if (nb.userId && (await getNotebookOfUser(nb.userId))) return { ok: false, error: "Cette personne a déjà un carnet actif." };
  await query(`UPDATE probation_notebooks SET archived_at = NULL, archived_by = '', snapshot = NULL WHERE id = $1`, [id]);
  return { ok: true, value: true };
}

/** Suppression définitive : uniquement un carnet déjà archivé. */
export async function deleteArchivedNotebook(id: string): Promise<boolean> {
  const rows = await query(`DELETE FROM probation_notebooks WHERE id = $1 AND archived_at IS NOT NULL RETURNING id`, [id]);
  return rows.length > 0;
}

/* ------------------------------------------------------------------ commentaires */

export async function listComments(notebookId: string): Promise<Comment[]> {
  return query<Comment>(
    `SELECT id, author_id AS "authorId", author_name AS "authorName", body, created_at AS "createdAt"
       FROM probation_comments WHERE notebook_id = $1 ORDER BY created_at`,
    [notebookId]
  );
}

export async function addComment(notebookId: string, authorId: string, authorName: string, body: string): Promise<Comment | null> {
  const rows = await query<Comment>(
    `INSERT INTO probation_comments (notebook_id, author_id, author_name, body)
     SELECT id, $2, $3, $4 FROM probation_notebooks WHERE id = $1
     RETURNING id, author_id AS "authorId", author_name AS "authorName", body, created_at AS "createdAt"`,
    [notebookId, authorId, authorName, body]
  );
  return rows[0] ?? null;
}

export async function deleteComment(id: string, authorId: string, isAdmin: boolean): Promise<boolean> {
  const rows = await query(
    `DELETE FROM probation_comments WHERE id = $1 AND ($3 OR author_id = $2) RETURNING id`,
    [id, authorId, isAdmin]
  );
  return rows.length > 0;
}
