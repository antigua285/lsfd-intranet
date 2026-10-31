import { query } from "./db";
import { CHARTS, MARK_COLORS, PLAN_LIMITS, POINT_KINDS, POINT_LIMITS, emptyPlan, type ChartPoint, type Mark, type Pattern, type PlanData, type RoutePt } from "./airops-charts";
import type { Result } from "./validation";

const BAD = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const frac = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1 ? v : null);
const num = (v: unknown, min: number, max: number): number | null => (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null);

/* ------------------------------------------------------------------ échelle */
export async function listCalibrations(): Promise<Map<string, number>> {
  const rows = await query<{ key: string; v: number }>(`SELECT chart_key AS key, nm_per_width AS v FROM airops_charts`);
  return new Map(rows.map((r) => [r.key, r.v]));
}
export async function setCalibration(key: string, nmPerWidth: number, by: string): Promise<void> {
  await query(`INSERT INTO airops_charts (chart_key, nm_per_width, updated_by) VALUES ($1,$2,$3)
     ON CONFLICT (chart_key) DO UPDATE SET nm_per_width = EXCLUDED.nm_per_width, updated_by = EXCLUDED.updated_by, updated_at = now()`, [key, nmPerWidth, by]);
}
/** Échelle effective : celle enregistrée en base, sinon celle par défaut de la carte, sinon inconnue. */
export async function chartScale(key: string): Promise<number | null> {
  const saved = (await listCalibrations()).get(key);
  return saved ?? CHARTS.find((c) => c.key === key)?.defaultNmPerWidth ?? null;
}

/* ------------------------------------------------------------------ points */
const POINT_SELECT = `SELECT id, chart_key AS "chartKey", kind, ident, name, x, y, freq, elevation, note FROM airops_chart_points`;
export async function listChartPoints(key: string): Promise<ChartPoint[]> {
  return query<ChartPoint>(`${POINT_SELECT} WHERE chart_key = $1 ORDER BY lower(name)`, [key]);
}
export type PointInput = Omit<ChartPoint, "id" | "chartKey">;
export function parsePointInput(raw: unknown): Result<PointInput> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const kind = clean(r.kind);
  if (!POINT_KINDS.some((k) => k.key === kind)) return { ok: false, error: "Type de point inconnu." };
  const name = clean(r.name), ident = clean(r.ident).toUpperCase(), freq = clean(r.freq), note = typeof r.note === "string" ? r.note.replace(/\r\n/g, "\n").trim() : "";
  if (!name) return { ok: false, error: "Donne un nom au point." };
  if (name.length > POINT_LIMITS.name) return { ok: false, error: `Nom trop long (${POINT_LIMITS.name} caractères max).` };
  if (ident.length > POINT_LIMITS.ident) return { ok: false, error: `Identifiant trop long (${POINT_LIMITS.ident} caractères max).` };
  if (freq.length > POINT_LIMITS.freq) return { ok: false, error: `Fréquence trop longue (${POINT_LIMITS.freq} caractères max).` };
  if (note.length > POINT_LIMITS.note) return { ok: false, error: `Note trop longue (${POINT_LIMITS.note} caractères max).` };
  if (BAD.test(name + ident + freq + note.replace(/\n/g, ""))) return { ok: false, error: "Caractères invalides." };
  const x = frac(r.x), y = frac(r.y);
  if (x === null || y === null) return { ok: false, error: "Position invalide." };
  let elevation: number | null = null;
  if (r.elevation !== null && r.elevation !== undefined && r.elevation !== "") {
    elevation = num(typeof r.elevation === "string" ? Number(r.elevation) : r.elevation, -500, 30000);
    if (elevation === null) return { ok: false, error: "Altitude invalide (en pieds)." };
    elevation = Math.round(elevation);
  }
  return { ok: true, value: { kind: kind as PointInput["kind"], ident, name, x, y, freq, elevation, note } };
}
export async function createChartPoint(key: string, v: PointInput): Promise<string> {
  const rows = await query<{ id: string }>(`INSERT INTO airops_chart_points (chart_key, kind, ident, name, x, y, freq, elevation, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [key, v.kind, v.ident, v.name, v.x, v.y, v.freq, v.elevation, v.note]);
  return rows[0].id;
}
export async function updateChartPoint(id: string, key: string, v: PointInput): Promise<boolean> {
  return (await query(`UPDATE airops_chart_points SET kind=$3, ident=$4, name=$5, x=$6, y=$7, freq=$8, elevation=$9, note=$10 WHERE id=$1 AND chart_key=$2 RETURNING id`,
    [id, key, v.kind, v.ident, v.name, v.x, v.y, v.freq, v.elevation, v.note])).length > 0;
}
export async function deleteChartPoint(id: string, key: string): Promise<boolean> {
  return (await query(`DELETE FROM airops_chart_points WHERE id = $1 AND chart_key = $2 RETURNING id`, [id, key])).length > 0;
}

/* ------------------------------------------------------------------ tracés */
export type PlanRecord = { id: string; chartKey: string; title: string; data: PlanData; pilotId: string | null; authorId: string | null; authorName: string; updatedAt: string };
const PLAN_SELECT = `SELECT id, chart_key AS "chartKey", title, data, pilot_id AS "pilotId", author_id AS "authorId", author_name AS "authorName", updated_at AS "updatedAt" FROM airops_plans`;
export async function listPlans(key: string): Promise<PlanRecord[]> {
  return query<PlanRecord>(`${PLAN_SELECT} WHERE chart_key = $1 ORDER BY updated_at DESC LIMIT 100`, [key]);
}
export async function getPlan(id: string): Promise<PlanRecord | null> {
  return (await query<PlanRecord>(`${PLAN_SELECT} WHERE id = $1`, [id]))[0] ?? null;
}

function pointXY(v: unknown): [number, number] | null {
  if (!Array.isArray(v) || v.length !== 2) return null;
  const x = frac(v[0]), y = frac(v[1]);
  return x === null || y === null ? null : [x, y];
}
const shortText = (v: unknown, max: number): string | null => {
  const t = clean(v);
  return t.length <= max && !BAD.test(t) ? t : null;
};

/** Valide un tracé reçu du navigateur : bornes, types, nombres d'éléments ; tout ce qui est inconnu est refusé. */
export function parsePlanData(raw: unknown): Result<PlanData> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = emptyPlan();
  const tas = num(r.tas, 1, 400), spd = num(r.windSpd, 0, 200), mv = num(r.magVar, -45, 45);
  if (tas === null || spd === null || mv === null) return { ok: false, error: "Vitesse, vent ou variation magnétique invalide." };
  out.tas = tas; out.windSpd = spd; out.magVar = mv;
  if (r.windDir === null || r.windDir === undefined) out.windDir = null;
  else { const wd = num(r.windDir, 0, 360); if (wd === null) return { ok: false, error: "Direction du vent invalide (0 à 360)." }; out.windDir = wd; }
  if (!Array.isArray(r.route) || r.route.length > PLAN_LIMITS.route) return { ok: false, error: `Route invalide (${PLAN_LIMITS.route} points maximum).` };
  for (const p of r.route) {
    const q = (p ?? {}) as Record<string, unknown>;
    const x = frac(q.x), y = frac(q.y), name = shortText(q.name, PLAN_LIMITS.name);
    if (x === null || y === null || name === null) return { ok: false, error: "Point de route invalide." };
    const pt: RoutePt = { x, y, name };
    if (typeof q.pointId === "string" && /^[0-9a-f-]{36}$/i.test(q.pointId)) pt.pointId = q.pointId;
    out.route.push(pt);
  }
  if (!Array.isArray(r.marks) || r.marks.length > PLAN_LIMITS.marks) return { ok: false, error: `Trop d'éléments dessinés (${PLAN_LIMITS.marks} maximum).` };
  for (const m of r.marks) {
    const q = (m ?? {}) as Record<string, unknown>;
    const id = shortText(q.id, 16), color = clean(q.color);
    if (!id || !(MARK_COLORS as readonly string[]).includes(color)) return { ok: false, error: "Élément dessiné invalide." };
    if (q.t === "line") {
      if (!Array.isArray(q.pts) || q.pts.length < 2 || q.pts.length > PLAN_LIMITS.linePts) return { ok: false, error: "Tracé libre invalide." };
      const pts = q.pts.map(pointXY);
      if (pts.some((p) => p === null)) return { ok: false, error: "Tracé libre invalide." };
      out.marks.push({ id, t: "line", color, pts: pts as [number, number][] } satisfies Mark);
    } else if (q.t === "text" || q.t === "symbol") {
      const x = frac(q.x), y = frac(q.y), text = shortText(q.text ?? "", PLAN_LIMITS.text);
      if (x === null || y === null || text === null) return { ok: false, error: "Élément dessiné invalide." };
      if (q.t === "text") out.marks.push({ id, t: "text", color, x, y, text });
      else {
        const kind = clean(q.kind);
        if (!POINT_KINDS.some((k) => k.key === kind)) return { ok: false, error: "Symbole inconnu." };
        out.marks.push({ id, t: "symbol", color, x, y, kind: kind as Mark extends { kind: infer K } ? K : never, text });
      }
    } else return { ok: false, error: "Élément dessiné invalide." };
  }
  if (!Array.isArray(r.patterns) || r.patterns.length > PLAN_LIMITS.patterns) return { ok: false, error: `${PLAN_LIMITS.patterns} circuits au maximum.` };
  for (const p of r.patterns) {
    const q = (p ?? {}) as Record<string, unknown>;
    const id = shortText(q.id, 16), start = pointXY(q.start), end = pointXY(q.end), alt = num(q.altAgl, 0, 10000);
    if (!id || !start || !end || alt === null || (q.side !== "L" && q.side !== "R")) return { ok: false, error: "Circuit invalide." };
    out.patterns.push({ id, start, end, side: q.side, altAgl: Math.round(alt), heli: q.heli === true } satisfies Pattern);
  }
  return { ok: true, value: out };
}
export function parsePlanTitle(raw: unknown): Result<string> {
  const t = clean(raw);
  if (!t) return { ok: false, error: "Donne un nom à la préparation." };
  if (t.length > PLAN_LIMITS.title || BAD.test(t)) return { ok: false, error: `Nom invalide (${PLAN_LIMITS.title} caractères max).` };
  return { ok: true, value: t };
}
export async function createPlan(key: string, title: string, data: PlanData, pilotId: string | null, authorId: string, authorName: string): Promise<string> {
  const rows = await query<{ id: string }>(`INSERT INTO airops_plans (chart_key, title, data, pilot_id, author_id, author_name) VALUES ($1,$2,$3::jsonb,$4,$5,$6) RETURNING id`,
    [key, title, JSON.stringify(data), pilotId, authorId, authorName]);
  return rows[0].id;
}
export async function updatePlan(id: string, title: string, data: PlanData): Promise<boolean> {
  return (await query(`UPDATE airops_plans SET title=$2, data=$3::jsonb, updated_at=now() WHERE id=$1 RETURNING id`, [id, title, JSON.stringify(data)])).length > 0;
}
export async function deletePlan(id: string): Promise<boolean> {
  return (await query(`DELETE FROM airops_plans WHERE id = $1 RETURNING id`, [id])).length > 0;
}
