import { query } from "./db";
import { getFeature } from "./map";
import { DETAIL_FIELDS } from "./map-types";
import type {
  EffectLogEntry,
  FormContent,
  FormRecord,
  Submission,
  SubmissionSummary,
} from "./forms-types";
import { FIELD_META } from "./forms-types";
import { planEffects, type FormInput } from "./forms-validation";
import { answerText } from "./forms-types";

/** Vrai si les tables des formulaires n'existent pas encore (base pas mise à jour). */
export function isMissingFormsTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return (
    e?.code === "42P01" ||
    /relation "?(forms|form_submissions|map_feature_reports)"? does not exist/i.test(e?.message ?? "")
  );
}

type FormRow = {
  id: string;
  title: string;
  subtitle: string;
  headerLines: string[];
  footer: string;
  definition: FormRecord["definition"];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

const FORM_COLUMNS = `id, title, subtitle, header_lines AS "headerLines", footer, definition, published,
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export async function listForms(opts: { onlyPublished?: boolean } = {}): Promise<FormRecord[]> {
  return query<FormRow>(
    `SELECT ${FORM_COLUMNS} FROM forms ${opts.onlyPublished ? "WHERE published" : ""} ORDER BY title`
  );
}

export async function getForm(id: string): Promise<FormRecord | null> {
  const rows = await query<FormRow>(`SELECT ${FORM_COLUMNS} FROM forms WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createForm(input: FormInput): Promise<string> {
  const [row] = await query<{ id: string }>(
    `INSERT INTO forms (title, subtitle, header_lines, footer, definition, published)
     VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6)
     RETURNING id`,
    [input.title, input.subtitle, JSON.stringify(input.headerLines), input.footer, JSON.stringify(input.definition), input.published]
  );
  return row.id;
}

export async function updateForm(id: string, input: FormInput): Promise<boolean> {
  const rows = await query(
    `UPDATE forms
        SET title = $2, subtitle = $3, header_lines = $4::jsonb, footer = $5,
            definition = $6::jsonb, published = $7, updated_at = now()
      WHERE id = $1
      RETURNING id`,
    [id, input.title, input.subtitle, JSON.stringify(input.headerLines), input.footer, JSON.stringify(input.definition), input.published]
  );
  return rows.length > 0;
}

/** Supprime le formulaire ; les rapports déjà reçus restent (ils contiennent leur propre copie). */
export async function deleteForm(id: string): Promise<boolean> {
  const rows = await query(`DELETE FROM forms WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

export async function countForms(): Promise<{ formId: string; submissions: number; unread: number }[]> {
  return query(
    `SELECT form_id AS "formId", count(*)::int AS submissions,
            count(*) FILTER (WHERE status = 'new')::int AS unread
       FROM form_submissions WHERE form_id IS NOT NULL GROUP BY form_id`
  );
}

/* ------------------------------------------------------------------ rapports */

const SUMMARY_COLUMNS = `s.id, s.form_id AS "formId", s.form_title AS "formTitle",
  s.submitter_name AS "submitterName", s.status, s.summary, s.created_at AS "createdAt"`;

export type SubmissionFilter = {
  /** Identifiant d'un formulaire, ou "deleted" pour les rapports dont le formulaire a été supprimé. */
  form?: string;
  status?: "new" | "reviewed";
  search?: string;
  oldestFirst?: boolean;
  limit?: number;
};

export async function listSubmissions(filter: SubmissionFilter = {}): Promise<SubmissionSummary[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.form === "deleted") where.push("s.form_id IS NULL");
  else if (filter.form) {
    params.push(filter.form);
    where.push(`s.form_id = $${params.length}`);
  }
  if (filter.status) {
    params.push(filter.status);
    where.push(`s.status = $${params.length}`);
  }
  if (filter.search) {
    params.push(`%${filter.search.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    where.push(`(s.summary ILIKE $${params.length} OR s.submitter_name ILIKE $${params.length} OR s.form_title ILIKE $${params.length})`);
  }
  params.push(Math.min(filter.limit ?? 200, 500));
  return query<SubmissionSummary>(
    `SELECT ${SUMMARY_COLUMNS} FROM form_submissions s
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY s.created_at ${filter.oldestFirst ? "ASC" : "DESC"}
      LIMIT $${params.length}`,
    params
  );
}

export async function listSubmissionsBy(userId: string, limit = 10): Promise<SubmissionSummary[]> {
  return query<SubmissionSummary>(
    `SELECT ${SUMMARY_COLUMNS} FROM form_submissions s WHERE s.submitted_by = $1 ORDER BY s.created_at DESC LIMIT $2`,
    [userId, limit]
  );
}

export async function countDeletedFormSubmissions(): Promise<number> {
  const [row] = await query<{ n: number }>(`SELECT count(*)::int AS n FROM form_submissions WHERE form_id IS NULL`);
  return row?.n ?? 0;
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const rows = await query<
    SubmissionSummary & {
      submittedBy: string | null;
      snapshot: FormContent;
      answers: Record<string, string>;
      labels: Record<string, string>;
      effects: EffectLogEntry[];
    }
  >(
    `SELECT ${SUMMARY_COLUMNS}, s.submitted_by AS "submittedBy", s.form_snapshot AS snapshot,
            s.answers, s.labels, s.effects
       FROM form_submissions s WHERE s.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function setSubmissionStatus(id: string, status: "new" | "reviewed"): Promise<boolean> {
  const rows = await query(`UPDATE form_submissions SET status = $2 WHERE id = $1 RETURNING id`, [id, status]);
  return rows.length > 0;
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const rows = await query(`DELETE FROM form_submissions WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/** Résumé d'une ligne pour la liste : les premières réponses non vides. */
function buildSummary(content: FormContent, answers: Record<string, string>, labels: Record<string, string>): string {
  const parts: string[] = [];
  for (const field of content.definition.fields) {
    if (!FIELD_META[field.type].answered || field.type === "long") continue;
    const value = answerText(field, answers, labels);
    if (value) parts.push(value);
    if (parts.length >= 3) break;
  }
  return parts.join(" · ").slice(0, 200);
}

export type SubmitResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Enregistre un rapport, puis applique les règles « Actions sur la carte ».
 * Le rapport est d'abord enregistré : si une règle échoue (point supprimé entre-temps,
 * par exemple), le rapport reste et l'échec est noté dessus.
 */
export async function submitReport(input: {
  formId: string;
  content: FormContent;
  answers: Record<string, string>;
  submitter: { id: string; name: string };
  todayIso: string;
}): Promise<SubmitResult> {
  const { content, answers } = input;

  // Points choisis : ils doivent exister et être du bon type. On garde leur nom tel qu'il est maintenant.
  const labels: Record<string, string> = {};
  const featureIds = new Map<string, string>();
  for (const field of content.definition.fields) {
    if (field.type !== "feature" || !answers[field.id]) continue;
    const feature = await getFeature(answers[field.id]);
    if (!feature || feature.kind !== field.featureKind) {
      return { ok: false, error: "Un point choisi n'existe plus.", fieldErrors: { [field.id]: "Ce point n'existe plus. Recharge la page." } };
    }
    const number = feature.details.number ? ` (${feature.details.number})` : "";
    labels[field.id] = `${feature.name}${number}`;
    featureIds.set(feature.id, feature.name);
  }

  const [row] = await query<{ id: string }>(
    `INSERT INTO form_submissions
       (form_id, form_title, form_snapshot, answers, labels, summary, submitted_by, submitter_name)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7, $8)
     RETURNING id`,
    [
      input.formId,
      content.title,
      JSON.stringify(content),
      JSON.stringify(answers),
      JSON.stringify(labels),
      buildSummary(content, answers, labels),
      input.submitter.id,
      input.submitter.name,
    ]
  );
  const submissionId = row.id;

  for (const featureId of featureIds.keys()) {
    await query(
      `INSERT INTO map_feature_reports (feature_id, submission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [featureId, submissionId]
    );
  }

  // Règles carte.
  const log: EffectLogEntry[] = [];
  for (const effect of planEffects(content.definition, answers, input.todayIso)) {
    const name = labels[content.definition.actions.find((a) => a.id === effect.actionId)?.featureField ?? ""] ?? "Point";
    try {
      // Garde-fous : le point doit exister, être du bon type, et l'information doit faire partie des
      // informations modifiables de ce type de point.
      if (!DETAIL_FIELDS[effect.featureKind].some((d) => d.key === effect.detail)) throw new Error("information non modifiable");
      const updated = await query(
        `UPDATE map_features
            SET details = jsonb_set(details, ARRAY[$3::text], to_jsonb($4::text)), updated_at = now()
          WHERE id = $1 AND kind = $2
          RETURNING id`,
        [effect.featureId, effect.featureKind, effect.detail, effect.value]
      );
      if (updated.length === 0) throw new Error("point introuvable");
      log.push({ actionId: effect.actionId, ok: true, message: `${name} : ${effect.detailLabel} → ${effect.valueLabel}` });
    } catch (error) {
      log.push({ actionId: effect.actionId, ok: false, message: `${name} : ${effect.detailLabel} non modifié (${(error as Error).message})` });
    }
  }
  if (log.length) {
    await query(`UPDATE form_submissions SET effects = $2::jsonb WHERE id = $1`, [submissionId, JSON.stringify(log)]);
  }
  return { ok: true, id: submissionId };
}
