import { query } from "./db";
import type {
  AnswerValue,
  Attempt,
  AttemptStatus,
  AttemptSummary,
  Candidate,
  ExamQuestion,
  ExamRecord,
  ExamSnapshot,
  Grade,
  Verdict,
} from "./exams-types";
import type { ExamInput } from "./exams-validation";

export function isMissingExamsTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "42P01" || /relation "?(exams|exam_images|exam_attempts|exam_assignments)"? does not exist/i.test(e?.message ?? "");
}

/* ------------------------------------------------------------------ examens */

const EXAM_COLUMNS = `id, title, description, duration_minutes AS "durationMinutes",
  threshold_percent AS "thresholdPercent", max_attempts AS "maxAttempts", published,
  (key_hash IS NOT NULL OR access_key IS NOT NULL) AS "hasKey", questions, created_at AS "createdAt", updated_at AS "updatedAt"`;

export async function listExams(opts: { onlyPublished?: boolean } = {}): Promise<ExamRecord[]> {
  return query<ExamRecord>(`SELECT ${EXAM_COLUMNS} FROM exams ${opts.onlyPublished ? "WHERE published" : ""} ORDER BY title`);
}

export async function getExam(id: string): Promise<ExamRecord | null> {
  const rows = await query<ExamRecord>(`SELECT ${EXAM_COLUMNS} FROM exams WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/** Clé d'un examen : lisible (access_key) ou, pour les anciens examens, seulement son empreinte. */
export async function getExamKey(id: string): Promise<{ plain: string | null; hash: string | null }> {
  const rows = await query<{ plain: string | null; hash: string | null }>(`SELECT access_key AS plain, key_hash AS hash FROM exams WHERE id = $1`, [id]);
  return rows[0] ?? { plain: null, hash: null };
}

/** Clés lisibles de tous les examens (réservé à la TD et aux modérateurs). */
export async function listExamKeys(): Promise<Map<string, string | null>> {
  const rows = await query<{ id: string; plain: string | null }>(`SELECT id, access_key AS plain FROM exams`);
  return new Map(rows.map((r) => [r.id, r.plain]));
}

export async function createExam(input: ExamInput): Promise<string> {
  const [row] = await query<{ id: string }>(
    `INSERT INTO exams (title, description, duration_minutes, threshold_percent, max_attempts, published, access_key, questions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb) RETURNING id`,
    [input.title, input.description, input.durationMinutes, input.thresholdPercent, input.maxAttempts, input.published, input.newKey || null, JSON.stringify(input.questions)]
  );
  return row.id;
}

/** input.newKey vide : on garde la clé actuelle. */
export async function updateExam(id: string, input: ExamInput): Promise<boolean> {
  const rows = await query(
    `UPDATE exams SET title = $2, description = $3, duration_minutes = $4, threshold_percent = $5,
            max_attempts = $6, published = $7,
            key_hash = CASE WHEN $8::text IS NULL THEN key_hash ELSE NULL END,
            access_key = COALESCE($8::text, access_key), questions = $9::jsonb, updated_at = now()
      WHERE id = $1 RETURNING id`,
    [id, input.title, input.description, input.durationMinutes, input.thresholdPercent, input.maxAttempts, input.published, input.newKey || null, JSON.stringify(input.questions)]
  );
  return rows.length > 0;
}

/** Supprime l'examen ; les passages déjà faits restent (ils contiennent leur propre copie). */
export async function deleteExam(id: string): Promise<boolean> {
  const rows = await query(`DELETE FROM exams WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/* ------------------------------------------------------------------- images */

export async function saveImage(mime: string, base64: string): Promise<string> {
  const [row] = await query<{ id: string }>(`INSERT INTO exam_images (mime, data) VALUES ($1, $2) RETURNING id`, [mime, base64]);
  return row.id;
}

export async function getImage(id: string): Promise<{ mime: string; data: string } | null> {
  const rows = await query<{ mime: string; data: string }>(`SELECT mime, data FROM exam_images WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ passages */

const SUMMARY_COLUMNS = `a.id, a.exam_id AS "examId", a.exam_title AS "examTitle", a.status, a.candidate,
  a.started_at AS "startedAt", a.submitted_at AS "submittedAt", a.sent_at AS "sentAt", a.verdict`;

/** Un passage chronométré dont le temps est écoulé est considéré comme rendu (avec ce qui avait été sauvegardé). */
export async function closeExpiredAttempts(): Promise<void> {
  await query(
    `UPDATE exam_attempts SET status = 'submitted', submitted_at = deadline
      WHERE status = 'in_progress' AND deadline IS NOT NULL AND deadline < now()`
  );
}

export async function getAttempt(id: string): Promise<Attempt | null> {
  const rows = await query<Attempt>(
    `SELECT ${SUMMARY_COLUMNS}, a.user_id AS "userId", a.snapshot, a.answers, a.deadline, a.grades,
            a.comment, a.grader_name AS "graderName"
       FROM exam_attempts a WHERE a.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listAttemptsByUser(userId: string): Promise<AttemptSummary[]> {
  return query<AttemptSummary>(`SELECT ${SUMMARY_COLUMNS} FROM exam_attempts a WHERE a.user_id = $1 ORDER BY a.started_at DESC`, [userId]);
}

export async function listAttempts(filter: { status?: AttemptStatus; examId?: string; search?: string } = {}): Promise<AttemptSummary[]> {
  const where: string[] = ["a.status <> 'in_progress'"];
  const params: unknown[] = [];
  if (filter.status) { params.push(filter.status); where.push(`a.status = $${params.length}`); }
  if (filter.examId) { params.push(filter.examId); where.push(`a.exam_id = $${params.length}`); }
  if (filter.search) {
    params.push(`%${filter.search.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    where.push(`(a.exam_title ILIKE $${params.length} OR a.candidate->>'name' ILIKE $${params.length})`);
  }
  return query<AttemptSummary>(
    `SELECT ${SUMMARY_COLUMNS} FROM exam_attempts a WHERE ${where.join(" AND ")}
      ORDER BY (a.status = 'submitted') DESC, a.submitted_at DESC NULLS LAST LIMIT 300`,
    params
  );
}

export async function countAttempts(examId: string, userId: string): Promise<{ total: number; inProgressId: string | null }> {
  const rows = await query<{ id: string; status: AttemptStatus }>(`SELECT id, status FROM exam_attempts WHERE exam_id = $1 AND user_id = $2`, [examId, userId]);
  return { total: rows.length, inProgressId: rows.find((r) => r.status === "in_progress")?.id ?? null };
}

export async function createAttempt(exam: ExamRecord, userId: string, candidate: Candidate): Promise<string> {
  const snapshot: ExamSnapshot = {
    title: exam.title,
    description: exam.description,
    durationMinutes: exam.durationMinutes,
    thresholdPercent: exam.thresholdPercent,
    questions: exam.questions as ExamQuestion[],
  };
  const [row] = await query<{ id: string }>(
    `INSERT INTO exam_attempts (exam_id, exam_title, user_id, candidate, snapshot, deadline)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb,
             CASE WHEN $6::int IS NULL THEN NULL ELSE now() + ($6::int * interval '1 minute') END)
     RETURNING id`,
    [exam.id, exam.title, userId, JSON.stringify(candidate), JSON.stringify(snapshot), exam.durationMinutes]
  );
  return row.id;
}

/** Sauvegarde du brouillon : refusée une fois le temps écoulé. */
export async function saveDraft(id: string, userId: string, answers: Record<string, AnswerValue>): Promise<boolean> {
  const rows = await query(
    `UPDATE exam_attempts SET answers = $3::jsonb
      WHERE id = $1 AND user_id = $2 AND status = 'in_progress' AND (deadline IS NULL OR deadline > now())
      RETURNING id`,
    [id, userId, JSON.stringify(answers)]
  );
  return rows.length > 0;
}

/** Rend le passage. Après l'échéance (+ 60 s de tolérance), on garde le dernier brouillon sauvegardé. */
export async function submitAttempt(id: string, userId: string, answers: Record<string, AnswerValue>): Promise<boolean> {
  const rows = await query(
    `UPDATE exam_attempts
        SET answers = CASE WHEN deadline IS NULL OR deadline + interval '60 seconds' > now() THEN $3::jsonb ELSE answers END,
            status = 'submitted',
            submitted_at = LEAST(now(), COALESCE(deadline, now()))
      WHERE id = $1 AND user_id = $2 AND status = 'in_progress'
      RETURNING id`,
    [id, userId, JSON.stringify(answers)]
  );
  return rows.length > 0;
}

/** Enregistre la correction (brouillon). Impossible une fois le résultat envoyé. */
export async function saveGrading(
  id: string,
  input: { grades: Record<string, Grade>; verdict: Verdict | null; comment: string; graderId: string; graderName: string }
): Promise<boolean> {
  const rows = await query(
    `UPDATE exam_attempts SET grades = $2::jsonb, verdict = $3, comment = $4, graded_by = $5, grader_name = $6
      WHERE id = $1 AND status = 'submitted' RETURNING id`,
    [id, JSON.stringify(input.grades), input.verdict, input.comment, input.graderId, input.graderName]
  );
  return rows.length > 0;
}

export async function sendResult(id: string): Promise<boolean> {
  const rows = await query(`UPDATE exam_attempts SET status = 'sent', sent_at = now() WHERE id = $1 AND status = 'submitted' RETURNING id`, [id]);
  return rows.length > 0;
}

export async function reopenResult(id: string): Promise<boolean> {
  const rows = await query(`UPDATE exam_attempts SET status = 'submitted', sent_at = NULL WHERE id = $1 AND status = 'sent' RETURNING id`, [id]);
  return rows.length > 0;
}

export async function deleteAttempt(id: string): Promise<boolean> {
  const rows = await query(`DELETE FROM exam_attempts WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/* -------------------------------------------------------------- assignations */

export type Assignment = { userId: string; name: string; grade: string; station: string; assignedAt: string; attempts: number; status: AttemptStatus | null };

export async function assignExam(examId: string, userId: string, byId: string): Promise<void> {
  await query(`INSERT INTO exam_assignments (exam_id, user_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT (exam_id, user_id) DO NOTHING`, [examId, userId, byId]);
}

export async function unassignExam(examId: string, userId: string): Promise<boolean> {
  const rows = await query(`DELETE FROM exam_assignments WHERE exam_id = $1 AND user_id = $2 RETURNING id`, [examId, userId]);
  return rows.length > 0;
}

export async function isAssigned(examId: string, userId: string): Promise<boolean> {
  const rows = await query(`SELECT 1 FROM exam_assignments WHERE exam_id = $1 AND user_id = $2`, [examId, userId]);
  return rows.length > 0;
}

/** Personnes à qui l'examen est assigné, avec l'état de leur dernier passage. */
export async function listAssignments(): Promise<Map<string, Assignment[]>> {
  const rows = await query<Assignment & { examId: string }>(
    `SELECT a.exam_id AS "examId", a.user_id AS "userId", u.first_name || ' ' || u.last_name AS name, u.grade, u.station,
            a.created_at AS "assignedAt",
            (SELECT count(*)::int FROM exam_attempts t WHERE t.exam_id = a.exam_id AND t.user_id = a.user_id) AS attempts,
            (SELECT t.status FROM exam_attempts t WHERE t.exam_id = a.exam_id AND t.user_id = a.user_id ORDER BY t.started_at DESC LIMIT 1) AS status
       FROM exam_assignments a JOIN users u ON u.id = a.user_id ORDER BY u.last_name, u.first_name`
  );
  const map = new Map<string, Assignment[]>();
  for (const r of rows) map.set(r.examId, [...(map.get(r.examId) ?? []), r]);
  return map;
}

/** Examens assignés à ce compte (publiés ou non : la page indique ceux qui ne sont pas encore disponibles). */
export async function listAssignedExams(userId: string): Promise<(ExamRecord & { attemptsUsed: number })[]> {
  return query<ExamRecord & { attemptsUsed: number }>(
    `SELECT ${EXAM_COLUMNS}, (SELECT count(*)::int FROM exam_attempts t WHERE t.exam_id = exams.id AND t.user_id = $1) AS "attemptsUsed"
       FROM exams
      WHERE id IN (SELECT exam_id FROM exam_assignments WHERE user_id = $1)
      ORDER BY title`,
    [userId]
  );
}

export async function countAssignedPending(userId: string): Promise<number> {
  const [row] = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM exam_assignments a JOIN exams e ON e.id = a.exam_id
      WHERE a.user_id = $1 AND e.published
        AND NOT EXISTS (SELECT 1 FROM exam_attempts t WHERE t.exam_id = a.exam_id AND t.user_id = a.user_id)`,
    [userId]
  );
  return row?.n ?? 0;
}
