import { query } from "./db";
import { AIRCRAFT_TYPES, AIR_LIMITS, AIR_RANKS, MISSIONS, QUALIFICATIONS, airForm, blockMinutes, parseDuration, type AirField, type AirFormKind, type FlightInput, type FlightRow, type PilotRow, type RankEvent } from "./airops-shared";
import type { Result } from "./validation";

export * from "./airops-shared";

export function isMissingAiropsTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "42P01" || e?.code === "42703" || /relation "?airops_/i.test(e?.message ?? "");
}

/* ------------------------------------------------------------------ pilotes */
const PILOT_SELECT = `SELECT p.id, p.user_id AS "userId", p.owner_name AS name, COALESCE(u.grade, '') AS grade, COALESCE(u.station, '') AS station,
       u.avatar_url AS "avatarUrl", p.callsign, p.air_rank AS "airRank", p.qualifications, p.license_no AS "licenseNo",
       to_char(p.medical_until, 'YYYY-MM-DD') AS "medicalUntil", p.notes, p.created_at AS "createdAt"
  FROM airops_pilots p LEFT JOIN users u ON u.id = p.user_id`;

export async function listPilots(): Promise<PilotRow[]> {
  return query<PilotRow>(`${PILOT_SELECT} ORDER BY lower(p.owner_name)`);
}
export async function getPilot(id: string): Promise<PilotRow | null> {
  return (await query<PilotRow>(`${PILOT_SELECT} WHERE p.id = $1`, [id]))[0] ?? null;
}
export async function getPilotByUser(userId: string): Promise<PilotRow | null> {
  return (await query<PilotRow>(`${PILOT_SELECT} WHERE p.user_id = $1`, [userId]))[0] ?? null;
}
/** Comptes qui n'ont pas encore de carnet. */
export async function listUsersWithoutLogbook(): Promise<{ id: string; name: string; grade: string }[]> {
  return query(`SELECT u.id, u.first_name || ' ' || u.last_name AS name, u.grade FROM users u
     WHERE NOT EXISTS (SELECT 1 FROM airops_pilots p WHERE p.user_id = u.id) ORDER BY lower(u.last_name), lower(u.first_name)`);
}
export async function createPilot(userId: string, byName: string): Promise<string | null> {
  const rows = await query<{ id: string }>(
    `INSERT INTO airops_pilots (user_id, owner_name) SELECT id, first_name || ' ' || last_name FROM users WHERE id = $1
     ON CONFLICT (user_id) DO NOTHING RETURNING id`, [userId]);
  if (!rows[0]) return null;
  await query(`INSERT INTO airops_rank_history (pilot_id, air_rank, note, by_name) VALUES ($1, 'student', 'Ouverture du carnet', $2)`, [rows[0].id, byName]);
  return rows[0].id;
}

export type PilotInput = { callsign: string; qualifications: string[]; licenseNo: string; medicalUntil: string | null; notes: string };
const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const cleanLong = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "");
const BAD_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
function validDate(s: string): boolean {
  if (!DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function parsePilotInput(raw: unknown): Result<PilotInput> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const callsign = clean(r.callsign), licenseNo = clean(r.licenseNo), notes = cleanLong(r.notes);
  if (callsign.length > AIR_LIMITS.callsign) return { ok: false, error: `Indicatif trop long (${AIR_LIMITS.callsign} caractères max).` };
  if (licenseNo.length > AIR_LIMITS.license) return { ok: false, error: `N° de licence trop long (${AIR_LIMITS.license} caractères max).` };
  if (notes.length > AIR_LIMITS.notes) return { ok: false, error: `Notes trop longues (${AIR_LIMITS.notes} caractères max).` };
  if (BAD_CHARS.test(callsign + licenseNo + notes)) return { ok: false, error: "Caractères invalides." };
  const medical = clean(r.medicalUntil);
  if (medical && !validDate(medical)) return { ok: false, error: "Date de visite médicale invalide." };
  const q = Array.isArray(r.qualifications) ? r.qualifications : [];
  const known = new Set<string>(QUALIFICATIONS.map((x) => x.key));
  const qualifications = [...new Set(q.filter((x): x is string => typeof x === "string" && known.has(x)))];
  return { ok: true, value: { callsign, qualifications, licenseNo, medicalUntil: medical || null, notes } };
}
export async function updatePilot(id: string, v: PilotInput): Promise<boolean> {
  const rows = await query(`UPDATE airops_pilots SET callsign=$2, qualifications=$3::text[], license_no=$4, medical_until=$5, notes=$6 WHERE id=$1 RETURNING id`,
    [id, v.callsign, v.qualifications, v.licenseNo, v.medicalUntil, v.notes]);
  return rows.length > 0;
}
export async function deletePilot(id: string): Promise<boolean> {
  return (await query(`DELETE FROM airops_pilots WHERE id = $1 RETURNING id`, [id])).length > 0;
}

/* ------------------------------------------------------------------ rangs */
export async function listRankHistory(pilotId: string): Promise<RankEvent[]> {
  return query<RankEvent>(`SELECT id, air_rank AS "airRank", note, by_name AS "byName", created_at AS "createdAt" FROM airops_rank_history WHERE pilot_id = $1 ORDER BY created_at DESC`, [pilotId]);
}
export function parseRankChange(raw: unknown): Result<{ rank: string; note: string }> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rank = clean(r.rank), note = clean(r.note);
  if (!AIR_RANKS.some((x) => x.key === rank)) return { ok: false, error: "Rang inconnu." };
  if (note.length > AIR_LIMITS.note) return { ok: false, error: `Motif trop long (${AIR_LIMITS.note} caractères max).` };
  if (BAD_CHARS.test(note)) return { ok: false, error: "Caractères invalides." };
  return { ok: true, value: { rank, note } };
}
export async function setPilotRank(pilotId: string, rank: string, note: string, byName: string): Promise<boolean> {
  const rows = await query(`UPDATE airops_pilots SET air_rank = $2 WHERE id = $1 RETURNING id`, [pilotId, rank]);
  if (!rows.length) return false;
  await query(`INSERT INTO airops_rank_history (pilot_id, air_rank, note, by_name) VALUES ($1, $2, $3, $4)`, [pilotId, rank, note, byName]);
  return true;
}

/* ------------------------------------------------------------------ vols */
const FLIGHT_SELECT = `SELECT id, pilot_id AS "pilotId", to_char(flown_on, 'YYYY-MM-DD') AS "flownOn", aircraft_type AS "aircraftType", registration,
       from_pt AS "from", to_pt AS "to", route, dep_time AS "depTime", arr_time AS "arrTime", mission, total_min AS "totalMin", pic_min AS "picMin",
       sic_min AS "sicMin", given_min AS "givenMin", received_min AS "receivedMin", night_min AS "nightMin", ifr_min AS "ifrMin", nvg_min AS "nvgMin",
       land_day AS "landDay", land_night AS "landNight", drops, hoists, crew, remarks, signed_by AS "signedBy", signed_at AS "signedAt", created_by AS "createdBy"
  FROM airops_flights`;
export async function listFlights(pilotId: string): Promise<FlightRow[]> {
  return query<FlightRow>(`${FLIGHT_SELECT} WHERE pilot_id = $1 ORDER BY flown_on DESC, created_at DESC`, [pilotId]);
}
export async function getFlight(id: string): Promise<FlightRow | null> {
  return (await query<FlightRow>(`${FLIGHT_SELECT} WHERE id = $1`, [id]))[0] ?? null;
}
/** Totaux de tous les pilotes (une ligne par pilote). */
export async function listPilotSummaries(): Promise<Map<string, { total: number; flights: number; last: string | null }>> {
  const rows = await query<{ id: string; total: number; flights: number; last: string | null }>(
    `SELECT pilot_id AS id, COALESCE(sum(total_min),0)::int AS total, count(*)::int AS flights, to_char(max(flown_on), 'YYYY-MM-DD') AS last FROM airops_flights GROUP BY pilot_id`);
  return new Map(rows.map((r) => [r.id, r]));
}

function count(v: unknown, label: string, max: number): Result<number> {
  const s = typeof v === "number" ? String(v) : clean(v);
  if (!s) return { ok: true, value: 0 };
  if (!/^\d{1,4}$/.test(s) || Number(s) > max) return { ok: false, error: `${label} : nombre entier entre 0 et ${max}.` };
  return { ok: true, value: Number(s) };
}
function duration(v: unknown, label: string): Result<number> {
  const m = parseDuration(typeof v === "number" ? String(v / 60) : clean(v));
  if (m === null || m > 24 * 60) return { ok: false, error: `${label} : durée invalide (ex. 1,5 ou 1:30, 24 h maximum).` };
  return { ok: true, value: m };
}
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseFlightInput(raw: unknown): Result<FlightInput> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const flownOn = clean(r.flownOn);
  if (!validDate(flownOn)) return { ok: false, error: "Date du vol invalide." };
  if (flownOn > new Date(Date.now() + 86400000).toISOString().slice(0, 10)) return { ok: false, error: "La date du vol ne peut pas être dans le futur." };
  const aircraftType = clean(r.aircraftType);
  if (!AIRCRAFT_TYPES.some((a) => a.key === aircraftType)) return { ok: false, error: "Choisis un type d'aéronef." };
  const mission = clean(r.mission);
  if (!MISSIONS.some((m) => m.key === mission)) return { ok: false, error: "Choisis la nature de la mission." };
  const text = (k: string, label: string, max: number): Result<string> => {
    const v = k === "remarks" ? cleanLong(r[k]) : clean(r[k]);
    if (v.length > max) return { ok: false, error: `${label} trop long (${max} caractères max).` };
    if (BAD_CHARS.test(v)) return { ok: false, error: `${label} contient des caractères invalides.` };
    return { ok: true, value: v };
  };
  const fields = { registration: text("registration", "Immatriculation", AIR_LIMITS.registration), from: text("from", "Départ", AIR_LIMITS.point), to: text("to", "Arrivée", AIR_LIMITS.point),
    route: text("route", "Route", AIR_LIMITS.route), crew: text("crew", "Équipage", AIR_LIMITS.crew), remarks: text("remarks", "Remarques", AIR_LIMITS.remarks) };
  for (const f of Object.values(fields)) if (!f.ok) return f;
  const depTime = clean(r.depTime), arrTime = clean(r.arrTime);
  if ((depTime && !TIME.test(depTime)) || (arrTime && !TIME.test(arrTime))) return { ok: false, error: "Heures au format HH:MM." };
  const durs: Record<string, Result<number>> = { total: duration(r.total, "Temps total"), pic: duration(r.pic, "Commandant de bord"), sic: duration(r.sic, "Co-pilote"), given: duration(r.given, "Instruction donnée"),
    received: duration(r.received, "Instruction reçue"), night: duration(r.night, "Nuit"), ifr: duration(r.ifr, "Instruments"), nvg: duration(r.nvg, "NVG") };
  for (const d of Object.values(durs)) if (!d.ok) return d;
  const v = Object.fromEntries(Object.entries(durs).map(([k, d]) => [k, (d as { value: number }).value])) as Record<string, number>;
  if (v.total === 0 && depTime && arrTime) v.total = blockMinutes(depTime, arrTime) ?? 0;
  if (v.total <= 0) return { ok: false, error: "Indique le temps de vol (ou les heures de départ et d'arrivée)." };
  for (const k of ["pic", "sic", "given", "received", "night", "ifr", "nvg"]) if (v[k] > v.total) return { ok: false, error: "Une durée dépasse le temps total du vol." };
  const ld = count(r.landDay, "Atterrissages jour", 99), ln = count(r.landNight, "Atterrissages nuit", 99), dr = count(r.drops, "Largages", 999), ho = count(r.hoists, "Treuillages", 99);
  for (const c of [ld, ln, dr, ho]) if (!c.ok) return c;
  return { ok: true, value: {
    flownOn, aircraftType, registration: (fields.registration as { value: string }).value.toUpperCase(), from: (fields.from as { value: string }).value, to: (fields.to as { value: string }).value,
    route: (fields.route as { value: string }).value, depTime, arrTime, mission, totalMin: v.total, picMin: v.pic, sicMin: v.sic, givenMin: v.given, receivedMin: v.received,
    nightMin: v.night, ifrMin: v.ifr, nvgMin: v.nvg, landDay: (ld as { value: number }).value, landNight: (ln as { value: number }).value, drops: (dr as { value: number }).value,
    hoists: (ho as { value: number }).value, crew: (fields.crew as { value: string }).value, remarks: (fields.remarks as { value: string }).value,
  } };
}
export async function createFlight(pilotId: string, v: FlightInput, by: string): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO airops_flights (pilot_id, flown_on, aircraft_type, registration, from_pt, to_pt, route, dep_time, arr_time, mission, total_min, pic_min, sic_min, given_min, received_min,
       night_min, ifr_min, nvg_min, land_day, land_night, drops, hoists, crew, remarks, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) RETURNING id`,
    [pilotId, v.flownOn, v.aircraftType, v.registration, v.from, v.to, v.route, v.depTime, v.arrTime, v.mission, v.totalMin, v.picMin, v.sicMin, v.givenMin, v.receivedMin,
      v.nightMin, v.ifrMin, v.nvgMin, v.landDay, v.landNight, v.drops, v.hoists, v.crew, v.remarks, by]);
  return rows[0].id;
}
/** Modifie un vol ; toute modification retire la contresignature. */
export async function updateFlight(id: string, v: FlightInput): Promise<boolean> {
  const rows = await query(
    `UPDATE airops_flights SET flown_on=$2, aircraft_type=$3, registration=$4, from_pt=$5, to_pt=$6, route=$7, dep_time=$8, arr_time=$9, mission=$10, total_min=$11, pic_min=$12,
       sic_min=$13, given_min=$14, received_min=$15, night_min=$16, ifr_min=$17, nvg_min=$18, land_day=$19, land_night=$20, drops=$21, hoists=$22, crew=$23, remarks=$24,
       signed_by=NULL, signed_at=NULL WHERE id=$1 RETURNING id`,
    [id, v.flownOn, v.aircraftType, v.registration, v.from, v.to, v.route, v.depTime, v.arrTime, v.mission, v.totalMin, v.picMin, v.sicMin, v.givenMin, v.receivedMin,
      v.nightMin, v.ifrMin, v.nvgMin, v.landDay, v.landNight, v.drops, v.hoists, v.crew, v.remarks]);
  return rows.length > 0;
}
export async function deleteFlight(id: string): Promise<boolean> {
  return (await query(`DELETE FROM airops_flights WHERE id = $1 RETURNING id`, [id])).length > 0;
}
export async function setFlightSignature(id: string, by: string | null): Promise<boolean> {
  const rows = await query(`UPDATE airops_flights SET signed_by = $2, signed_at = CASE WHEN $2::text IS NULL THEN NULL ELSE now() END WHERE id = $1 RETURNING id`, [id, by]);
  return rows.length > 0;
}

/* ------------------------------------------------------------------ formulaires */
export type FormRecord = {
  id: string; kind: AirFormKind; pilotId: string | null; pilotName: string | null; title: string; data: Record<string, string>;
  authorId: string | null; authorName: string; signedBy: string | null; signedAt: string | null; createdAt: string;
};
const FORM_SELECT = `SELECT f.id, f.kind, f.pilot_id AS "pilotId", p.owner_name AS "pilotName", f.title, f.data, f.author_id AS "authorId", f.author_name AS "authorName",
       f.signed_by AS "signedBy", f.signed_at AS "signedAt", f.created_at AS "createdAt" FROM airops_forms f LEFT JOIN airops_pilots p ON p.id = f.pilot_id`;
export async function listForms(kind: string | null, limit = 100): Promise<FormRecord[]> {
  return query<FormRecord>(`${FORM_SELECT} ${kind ? "WHERE f.kind = $2" : "WHERE $2::text IS NULL"} ORDER BY f.created_at DESC LIMIT $1`, [limit, kind]);
}
export async function getForm(id: string): Promise<FormRecord | null> {
  return (await query<FormRecord>(`${FORM_SELECT} WHERE f.id = $1`, [id]))[0] ?? null;
}

/** Valide les réponses d'un formulaire d'après sa définition ; ne garde que les champs connus. */
export function parseFormData(kind: string, raw: unknown): Result<Record<string, string>> {
  const def = airForm(kind);
  if (!def) return { ok: false, error: "Type de formulaire inconnu." };
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const section of def.sections) {
    for (const f of section.fields) {
      const v = typeof src[f.id] === "string" ? (src[f.id] as string).replace(/\r\n/g, "\n").trim() : "";
      const err = checkField(f, v);
      if (err) return { ok: false, error: err };
      if (v) out[f.id] = v;
    }
  }
  return { ok: true, value: out };
}
function checkField(f: AirField, v: string): string | null {
  if (!v) return f.required ? `« ${f.label} » est obligatoire.` : null;
  if (BAD_CHARS.test(v.replace(/\n/g, ""))) return `« ${f.label} » contient des caractères invalides.`;
  switch (f.type) {
    case "text": case "long": return v.length > (f.max ?? 200) ? `« ${f.label} » est trop long (${f.max ?? 200} caractères max).` : null;
    case "date": return validDate(v) ? null : `« ${f.label} » : date invalide.`;
    case "time": return TIME.test(v) ? null : `« ${f.label} » : heure au format HH:MM.`;
    case "number": return /^\d{1,6}$/.test(v) && Number(v) <= (f.max ?? 999999) ? null : `« ${f.label} » : nombre entre 0 et ${f.max ?? 999999}.`;
    default: return f.options?.some((o) => o.value === v) ? null : `« ${f.label} » : choix invalide.`;
  }
}
export function formTitle(kind: string, data: Record<string, string>): string {
  const def = airForm(kind)!;
  const who = data.ident ?? data.pic ?? "";
  const when = data.date ?? data.depTime ?? "";
  return [def.title, who, when && /^\d{4}-\d{2}-\d{2}$/.test(when) ? when.split("-").reverse().join("/") : when].filter(Boolean).join(" — ").slice(0, AIR_LIMITS.title);
}
export async function createForm(kind: string, data: Record<string, string>, pilotId: string | null, authorId: string, authorName: string): Promise<string> {
  const rows = await query<{ id: string }>(`INSERT INTO airops_forms (kind, pilot_id, title, data, author_id, author_name) VALUES ($1,$2,$3,$4::jsonb,$5,$6) RETURNING id`,
    [kind, pilotId, formTitle(kind, data), JSON.stringify(data), authorId, authorName]);
  return rows[0].id;
}
export async function updateForm(id: string, kind: string, data: Record<string, string>): Promise<boolean> {
  const rows = await query(`UPDATE airops_forms SET data=$2::jsonb, title=$3, signed_by=NULL, signed_at=NULL, updated_at=now() WHERE id=$1 RETURNING id`, [id, JSON.stringify(data), formTitle(kind, data)]);
  return rows.length > 0;
}
export async function deleteForm(id: string): Promise<boolean> {
  return (await query(`DELETE FROM airops_forms WHERE id = $1 RETURNING id`, [id])).length > 0;
}
export async function setFormSignature(id: string, by: string | null): Promise<boolean> {
  return (await query(`UPDATE airops_forms SET signed_by = $2, signed_at = CASE WHEN $2::text IS NULL THEN NULL ELSE now() END WHERE id = $1 RETURNING id`, [id, by])).length > 0;
}
