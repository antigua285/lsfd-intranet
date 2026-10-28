import { DRILL_FLAG, DRILL_LIMITS, GRADUATE_FLAG, parisLocalToDate, type Cohort, type CohortWithMembers, type DrillEvent } from "./drill-shared";
import { query } from "./db";
import type { PublicUser } from "./users";
import type { Result } from "./validation";

export function isMissingDrillTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "42P01" || e?.code === "42703" || /relation "?drill_/i.test(e?.message ?? "");
}

/* ---------------------------------------------------------------- contacts */

/** Les membres de la Training Division (flag TD) : leurs coordonnées s'affichent en mini-profils. */
export async function listTrainers(): Promise<PublicUser[]> {
  return query<PublicUser>(
    `SELECT u.id, u.username, u.first_name AS "firstName", u.last_name AS "lastName", u.grade, u.station,
            u.avatar_url AS "avatarUrl", u.phone, u.is_admin AS "isAdmin", u.created_at AS "createdAt"
       FROM users u WHERE EXISTS (SELECT 1 FROM user_flags f WHERE f.user_id = u.id AND f.flag = 'TD')
      ORDER BY u.last_name, u.first_name`
  );
}

/* --------------------------------------------------------------- calendrier */

const EVENT_SELECT = `SELECT e.id, e.title, e.description, e.starts_at AS "startsAt", e.ends_at AS "endsAt", e.location, e.instructor,
       e.mandatory, e.canceled, e.cohort_id AS "cohortId", c.name AS "cohortName"
  FROM drill_events e LEFT JOIN drill_cohorts c ON c.id = e.cohort_id`;

/**
 * Événements visibles : pour une recrue, ceux ouverts à toutes les promotions + ceux de sa promotion ;
 * pour la TD (`cohortId` = undefined), tous.
 */
export async function listEvents(viewer: { staff: true } | { staff: false; userId: string }): Promise<DrillEvent[]> {
  if (viewer.staff) return query<DrillEvent>(`${EVENT_SELECT} ORDER BY e.starts_at`);
  return query<DrillEvent>(
    `${EVENT_SELECT}
      WHERE e.cohort_id IS NULL OR e.cohort_id = (SELECT cohort_id FROM drill_members WHERE user_id = $1)
      ORDER BY e.starts_at`,
    [viewer.userId]
  );
}

export type EventInput = {
  title: string; description: string; startsAt: Date; endsAt: Date | null; location: string; instructor: string;
  mandatory: boolean; canceled: boolean; cohortId: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseEventInput(raw: unknown): Result<EventInput> {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Formation invalide." };
  const r = raw as Record<string, unknown>;
  const text = (v: unknown, label: string, max: number, required: boolean): Result<string> => {
    const t = typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "";
    if (required && !t) return { ok: false, error: `${label} est obligatoire.` };
    if (t.length > max) return { ok: false, error: `${label} est trop long (${max} caractères max).` };
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(t)) return { ok: false, error: `${label} contient des caractères invalides.` };
    return { ok: true, value: t };
  };
  const title = text(r.title, "Le titre", DRILL_LIMITS.title, true); if (!title.ok) return title;
  const description = text(r.description, "La description", DRILL_LIMITS.description, false); if (!description.ok) return description;
  const location = text(r.location, "Le lieu", DRILL_LIMITS.location, false); if (!location.ok) return location;
  const instructor = text(r.instructor, "L'instructeur", DRILL_LIMITS.instructor, false); if (!instructor.ok) return instructor;
  const startsAt = typeof r.startsAt === "string" ? parisLocalToDate(r.startsAt) : null;
  if (!startsAt) return { ok: false, error: "Date et heure de début invalides." };
  let endsAt: Date | null = null;
  if (typeof r.endsAt === "string" && r.endsAt) {
    endsAt = parisLocalToDate(r.endsAt);
    if (!endsAt) return { ok: false, error: "Date et heure de fin invalides." };
    if (endsAt <= startsAt) return { ok: false, error: "La fin doit être après le début." };
  }
  let cohortId: string | null = null;
  if (typeof r.cohortId === "string" && r.cohortId) {
    if (!UUID.test(r.cohortId)) return { ok: false, error: "Promotion invalide." };
    cohortId = r.cohortId;
  }
  return { ok: true, value: { title: title.value, description: description.value, startsAt, endsAt, location: location.value, instructor: instructor.value, mandatory: r.mandatory === true, canceled: r.canceled === true, cohortId } };
}

export async function createEvent(input: EventInput, userId: string): Promise<void> {
  await query(
    `INSERT INTO drill_events (title, description, starts_at, ends_at, location, instructor, mandatory, canceled, cohort_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [input.title, input.description, input.startsAt.toISOString(), input.endsAt?.toISOString() ?? null, input.location, input.instructor, input.mandatory, input.canceled, input.cohortId, userId]
  );
}

export async function updateEvent(id: string, input: EventInput): Promise<boolean> {
  const rows = await query(
    `UPDATE drill_events SET title=$2, description=$3, starts_at=$4, ends_at=$5, location=$6, instructor=$7, mandatory=$8, canceled=$9, cohort_id=$10
      WHERE id=$1 RETURNING id`,
    [id, input.title, input.description, input.startsAt.toISOString(), input.endsAt?.toISOString() ?? null, input.location, input.instructor, input.mandatory, input.canceled, input.cohortId]
  );
  return rows.length > 0;
}

export async function deleteEvent(id: string): Promise<boolean> {
  return (await query(`DELETE FROM drill_events WHERE id=$1 RETURNING id`, [id])).length > 0;
}

/* --------------------------------------------------------------- promotions */

export async function listCohorts(): Promise<CohortWithMembers[]> {
  const cohorts = await query<Cohort>(
    `SELECT id, name, starts_on::text AS "startsOn", graduated_at AS "graduatedAt", created_at AS "createdAt" FROM drill_cohorts ORDER BY (graduated_at IS NOT NULL), created_at DESC`
  );
  const members = await query<{ cohortId: string; userId: string; name: string; grade: string; station: string; graduatedAt: string | null }>(
    `SELECT m.cohort_id AS "cohortId", u.id AS "userId", u.first_name || ' ' || u.last_name AS name, u.grade, u.station, m.graduated_at AS "graduatedAt"
       FROM drill_members m JOIN users u ON u.id = m.user_id ORDER BY u.last_name, u.first_name`
  );
  return cohorts.map((c) => ({ ...c, members: members.filter((m) => m.cohortId === c.id) }));
}

export async function getMemberCohort(userId: string): Promise<(Cohort & { members: number }) | null> {
  const rows = await query<Cohort & { members: number }>(
    `SELECT c.id, c.name, c.starts_on::text AS "startsOn", c.graduated_at AS "graduatedAt", c.created_at AS "createdAt",
            (SELECT count(*)::int FROM drill_members x WHERE x.cohort_id = c.id) AS members
       FROM drill_members m JOIN drill_cohorts c ON c.id = m.cohort_id WHERE m.user_id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}

export function parseCohortInput(raw: unknown): Result<{ name: string; startsOn: string | null }> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name) return { ok: false, error: "Donne un nom à la promotion." };
  if (name.length > DRILL_LIMITS.cohort) return { ok: false, error: `Nom trop long (${DRILL_LIMITS.cohort} caractères max).` };
  let startsOn: string | null = null;
  if (typeof r.startsOn === "string" && r.startsOn) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.startsOn)) return { ok: false, error: "Date de début invalide." };
    startsOn = r.startsOn;
  }
  return { ok: true, value: { name, startsOn } };
}

export async function createCohort(input: { name: string; startsOn: string | null }): Promise<void> {
  await query(`INSERT INTO drill_cohorts (name, starts_on) VALUES ($1, $2)`, [input.name, input.startsOn]);
}

/** Ajoute (ou déplace) une recrue dans une promotion non diplômée : elle reçoit le flag DTRECRUIT. */
export async function addMember(cohortId: string, userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const [cohort] = await query<{ graduated: boolean }>(`SELECT graduated_at IS NOT NULL AS graduated FROM drill_cohorts WHERE id=$1`, [cohortId]);
  if (!cohort) return { ok: false, error: "Cette promotion n'existe plus." };
  if (cohort.graduated) return { ok: false, error: "Cette promotion est déjà diplômée." };
  const [user] = await query<{ id: string }>(`SELECT id FROM users WHERE id=$1`, [userId]);
  if (!user) return { ok: false, error: "Ce compte n'existe plus." };
  await query(
    `INSERT INTO drill_members (user_id, cohort_id) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET cohort_id = EXCLUDED.cohort_id, added_at = now(), graduated_at = NULL`,
    [userId, cohortId]
  );
  await query(`INSERT INTO user_flags (user_id, flag) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [userId, DRILL_FLAG]);
  return { ok: true };
}

/** Retire une recrue de sa promotion (et le flag DTRECRUIT). */
export async function removeMember(userId: string): Promise<void> {
  await query(`DELETE FROM drill_members WHERE user_id=$1`, [userId]);
  await query(`DELETE FROM user_flags WHERE user_id=$1 AND flag=$2`, [userId, DRILL_FLAG]);
}

/** Diplôme : la recrue quitte la Drill Tower (DTRECRUIT retiré) et passe en probation (flag PROB → carnet créé). */
async function graduate(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  await query(`DELETE FROM user_flags WHERE user_id = ANY($1::uuid[]) AND flag=$2`, [userIds, DRILL_FLAG]);
  await query(`INSERT INTO user_flags (user_id, flag) SELECT u, $2 FROM unnest($1::uuid[]) AS u ON CONFLICT DO NOTHING`, [userIds, GRADUATE_FLAG]);
}

export async function graduateMember(userId: string): Promise<boolean> {
  const rows = await query<{ userId: string }>(`SELECT user_id AS "userId" FROM drill_members WHERE user_id=$1 AND graduated_at IS NULL`, [userId]);
  if (rows.length === 0) return false;
  await graduate([userId]);
  await query(`UPDATE drill_members SET graduated_at = now() WHERE user_id=$1`, [userId]);
  return true;
}

/** Diplôme toute la promotion : membres → probation, promotion archivée (diplômée). Renvoie le nombre de diplômés. */
export async function graduateCohort(cohortId: string): Promise<number | null> {
  const [cohort] = await query<{ graduated: boolean }>(`SELECT graduated_at IS NOT NULL AS graduated FROM drill_cohorts WHERE id=$1`, [cohortId]);
  if (!cohort || cohort.graduated) return null;
  const members = await query<{ userId: string }>(`SELECT user_id AS "userId" FROM drill_members WHERE cohort_id=$1 AND graduated_at IS NULL`, [cohortId]);
  const ids = members.map((m) => m.userId);
  await graduate(ids);
  await query(`UPDATE drill_members SET graduated_at = now() WHERE cohort_id=$1 AND graduated_at IS NULL`, [cohortId]);
  await query(`UPDATE drill_cohorts SET graduated_at = now() WHERE id=$1`, [cohortId]);
  return ids.length;
}

export async function deleteCohort(cohortId: string): Promise<boolean> {
  const members = await query<{ userId: string }>(`SELECT user_id AS "userId" FROM drill_members WHERE cohort_id=$1 AND graduated_at IS NULL`, [cohortId]);
  for (const m of members) await removeMember(m.userId); // les recrues encore en académie perdent le flag ; les diplômés gardent PROB
  return (await query(`DELETE FROM drill_cohorts WHERE id=$1 RETURNING id`, [cohortId])).length > 0;
}
