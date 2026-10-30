import { randomInt } from "node:crypto";
import { query } from "./db";
import { STAFF_FLAG, type Sheet, type SheetRow } from "./personnel-shared";
import { parsePhone, parseShortText, type Result } from "./validation";

export function isMissingPersonnelTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "42P01" || e?.code === "42703" || /relation "?profile/i.test(e?.message ?? "");
}

export { STAFF_FLAG };

/** Crée la fiche (ID FP-AAAA-00000 : année de création du compte + 5 chiffres au hasard) si elle n'existe pas. */
export async function ensureProfile(userId: string): Promise<void> {
  const u = (await query<{ year: string }>(`SELECT to_char(created_at, 'YYYY') AS year FROM users WHERE id = $1`, [userId]))[0];
  if (!u) return;
  for (let i = 0; i < 8; i++) {
    const fpId = `FP-${u.year}-${String(randomInt(0, 100000)).padStart(5, "0")}`;
    try {
      await query(`INSERT INTO profiles (user_id, fp_id) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`, [userId, fpId]);
      return;
    } catch (error) {
      if ((error as { code?: string }).code !== "23505") throw error; // ID déjà pris : on retire un autre numéro
    }
  }
  throw new Error("Impossible de générer un ID de fiche.");
}

const D = (col: string) => `to_char(${col}, 'YYYY-MM-DD')`;

/** Fiche complète ; les champs confidentiels ne sont lus que si `confidential` est vrai. */
export async function getSheet(userId: string, confidential: boolean): Promise<Sheet | null> {
  await ensureProfile(userId);
  const row = (await query<Omit<Sheet, "history" | "assignments" | "discipline" | "contacts">>(
    `SELECT u.id AS "userId", u.first_name AS "firstName", u.last_name AS "lastName", u.avatar_url AS "avatarUrl", u.grade, u.station, u.phone,
            u.rank_id AS "rankId", p.fp_id AS "fpId", p.db_status AS "dbStatus", p.badge, ${D("p.birth_date")} AS "birthDate", p.languages, p.phone2,
            CASE WHEN $2::boolean THEN p.address ELSE NULL END AS address,
            p.employment_status AS "employmentStatus", ${D("p.hired_on")} AS "hiredOn", p.bureau
       FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = $1`,
    [userId, confidential]
  ))[0];
  if (!row) return null;
  const [history, assignments, discipline, contacts] = await Promise.all([
    query<SheetRow["history"][number]>(`SELECT id, ${D("on_date")} AS date, rank, assignment FROM profile_history WHERE user_id = $1 ORDER BY on_date DESC`, [userId]),
    query<SheetRow["assignments"][number]>(`SELECT id, unit, ${D("started_on")} AS "startedOn", ${D("ended_on")} AS "endedOn" FROM profile_assignments WHERE user_id = $1 ORDER BY started_on DESC`, [userId]),
    confidential ? query<SheetRow["discipline"][number]>(`SELECT id, ${D("on_date")} AS date, sanction, details FROM profile_discipline WHERE user_id = $1 ORDER BY on_date DESC`, [userId]) : Promise.resolve(null),
    confidential ? query<SheetRow["contacts"][number]>(`SELECT id, name, address, phone FROM profile_contacts WHERE user_id = $1 ORDER BY name`, [userId]) : Promise.resolve(null),
  ]);
  return { ...row, history, assignments, discipline, contacts };
}

/* ------------------------------------------------------------------ annuaire */

export type PersonnelCard = {
  userId: string; firstName: string; lastName: string; avatarUrl: string | null; grade: string; station: string; employmentStatus: string;
};

/** Tout le personnel, du rang le plus haut au plus bas. */
export async function listPersonnel(): Promise<PersonnelCard[]> {
  const sql = (withProfile: boolean, withRank: boolean) => `SELECT u.id AS "userId", u.first_name AS "firstName", u.last_name AS "lastName", u.avatar_url AS "avatarUrl", u.grade, u.station,
            ${withProfile ? `COALESCE(p.employment_status, 'actif')` : `'actif'`} AS "employmentStatus"
       FROM users u ${withProfile ? "LEFT JOIN profiles p ON p.user_id = u.id" : ""} ${withRank ? "LEFT JOIN ranks r ON r.id = u.rank_id" : ""}
      ORDER BY ${withRank ? "r.position DESC NULLS LAST," : ""} lower(u.last_name), lower(u.first_name)`;
  try {
    return await query<PersonnelCard>(sql(true, true));
  } catch (error) {
    if (!isMissingPersonnelTableError(error) && !/ranks|rank_id/i.test((error as { message?: string })?.message ?? "")) throw error;
    return query<PersonnelCard>(sql(false, false));
  }
}

/* ---------------------------------------------------------------- validation */

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
export function parseDate(v: unknown, label: string, required: boolean): Result<string | null> {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return required ? { ok: false, error: `${label} est obligatoire.` } : { ok: true, value: null };
  const m = DATE.exec(s);
  const d = m ? new Date(`${s}T00:00:00Z`) : null;
  if (!m || !d || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s || +m[1] < 1900 || +m[1] > 2100) return { ok: false, error: `${label} est invalide.` };
  return { ok: true, value: s };
}

export function parseText(v: unknown, label: string, max: number, required = false): Result<string> {
  const t = typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "";
  if (required && !t) return { ok: false, error: `${label} est obligatoire.` };
  if (t.length > max) return { ok: false, error: `${label} est trop long (${max} caractères max).` };
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(t)) return { ok: false, error: `${label} contient des caractères invalides.` };
  return { ok: true, value: t };
}

export { parsePhone, parseShortText };
