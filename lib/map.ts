import { query } from "./db";
import {
  FEATURE_META,
  ZONE_META,
  type FeatureKind,
  type MapFeature,
  type MapPoint,
  type MapZone,
  type ZoneKind,
} from "./map-types";

/** Vrai si les tables de la carte n'existent pas encore (base pas mise à jour). */
export function isMissingMapTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return (
    e?.code === "42P01" ||
    e?.code === "42703" ||
    /relation "?map_(features|zones)"? does not exist/i.test(e?.message ?? "") ||
    /column "?members"? .*does not exist/i.test(e?.message ?? "")
  );
}

const FEATURE_COLUMNS = `id, kind, name, x, y, details, code`;

// Même liste + dernier rapport lié au point (NULL s'il n'y en a pas).
const FEATURE_WITH_REPORT = `
  SELECT f.id, f.kind, f.name, f.x, f.y, f.details, f.code,
         CASE WHEN r.submission_id IS NULL THEN NULL
              ELSE jsonb_build_object('id', r.submission_id, 'title', r.title, 'at', r.created_at)
         END AS "lastReport"
    FROM map_features f
    LEFT JOIN LATERAL (
      SELECT l.submission_id, s.form_title AS title, l.created_at
        FROM map_feature_reports l
        JOIN form_submissions s ON s.id = l.submission_id
       WHERE l.feature_id = f.id
       ORDER BY l.created_at DESC
       LIMIT 1
    ) r ON true`;
const ZONE_COLUMNS = `id, kind, name, color, points, members`;

export async function listFeatures(): Promise<MapFeature[]> {
  return query<MapFeature>(`${FEATURE_WITH_REPORT} ORDER BY f.name`);
}

export async function getFeature(id: string): Promise<MapFeature | null> {
  const rows = await query<MapFeature>(`${FEATURE_WITH_REPORT} WHERE f.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listZones(): Promise<MapZone[]> {
  return query<MapZone>(`SELECT ${ZONE_COLUMNS} FROM map_zones ORDER BY name`);
}

export async function createFeature(input: {
  kind: FeatureKind;
  name?: string;
  x: number;
  y: number;
  details: Record<string, string>;
}): Promise<MapFeature> {
  if (input.kind === "hydrant") return createHydrant(input);
  let name = input.name;
  if (!name) {
    const [row] = await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM map_features WHERE kind = $1`,
      [input.kind]
    );
    name = `${FEATURE_META[input.kind].label} ${(row?.n ?? 0) + 1}`;
  }
  const [created] = await query<MapFeature>(
    `INSERT INTO map_features (kind, name, x, y, details)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING ${FEATURE_COLUMNS}`,
    [input.kind, name, input.x, input.y, JSON.stringify(input.details)]
  );
  return created;
}

export class DuplicateNameError extends Error {
  constructor() {
    super("Ce nom est déjà utilisé par une autre borne incendie.");
  }
}

function isUniqueViolation(error: unknown, index?: string): boolean {
  const e = error as { code?: string; constraint?: string; message?: string } | null;
  if (e?.code !== "23505" && !/duplicate key value/i.test(e?.message ?? "")) return false;
  return !index || e?.constraint === index || (e?.message ?? "").includes(index);
}

/** Prochain ID libre à 5 chiffres (00001, 00002…). */
async function nextHydrantCode(): Promise<string> {
  const [row] = await query<{ next: number }>(
    `SELECT COALESCE(MAX(code::int), 0) + 1 AS next FROM map_features WHERE kind = 'hydrant' AND code ~ '^[0-9]{1,5}$'`
  );
  const next = row?.next ?? 1;
  if (next > 99999) throw new Error("Plus aucun ID à 5 chiffres n'est disponible.");
  return String(next).padStart(5, "0");
}

/** Création d'une borne : ID automatique ; l'unicité est garantie par la base (on réessaie si deux créations se croisent). */
async function createHydrant(input: { name?: string; x: number; y: number; details: Record<string, string> }): Promise<MapFeature> {
  for (let attempt = 0; ; attempt++) {
    const code = await nextHydrantCode();
    try {
      const [created] = await query<MapFeature>(
        `INSERT INTO map_features (kind, name, x, y, details, code)
         VALUES ('hydrant', $1, $2, $3, $4::jsonb, $5)
         RETURNING ${FEATURE_COLUMNS}`,
        [input.name ?? `Borne ${code}`, input.x, input.y, JSON.stringify(input.details), code]
      );
      return created;
    } catch (error) {
      if (attempt >= 4 || !isUniqueViolation(error)) {
        if (isUniqueViolation(error, "map_features_hydrant_name_uniq") && input.name) throw new DuplicateNameError();
        throw error;
      }
    }
  }
}

export async function updateFeature(
  id: string,
  fields: { name: string; details: Record<string, string> }
): Promise<MapFeature | null> {
  let rows: unknown[];
  try {
    rows = await query(
      `UPDATE map_features
          SET name = $2, details = $3::jsonb, updated_at = now()
        WHERE id = $1
        RETURNING id`,
      [id, fields.name, JSON.stringify(fields.details)]
    );
  } catch (error) {
    if (isUniqueViolation(error, "map_features_hydrant_name_uniq")) throw new DuplicateNameError();
    throw error;
  }
  return rows.length ? getFeature(id) : null;
}

export async function moveFeature(id: string, x: number, y: number): Promise<MapFeature | null> {
  const rows = await query(
    `UPDATE map_features SET x = $2, y = $3, updated_at = now()
      WHERE id = $1
      RETURNING id`,
    [id, x, y]
  );
  return rows.length ? getFeature(id) : null;
}

export async function deleteFeature(id: string): Promise<boolean> {
  const rows = await query(`DELETE FROM map_features WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

export async function createZone(input: {
  kind: ZoneKind;
  name?: string;
  color?: string;
  points: MapPoint[];
  members?: string[] | null;
}): Promise<MapZone> {
  let name = input.name;
  if (!name) {
    const [row] = await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM map_zones WHERE kind = $1`,
      [input.kind]
    );
    name = `${ZONE_META[input.kind].label} ${(row?.n ?? 0) + 1}`;
  }
  const [created] = await query<MapZone>(
    `INSERT INTO map_zones (kind, name, color, points, members)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
     RETURNING ${ZONE_COLUMNS}`,
    [
      input.kind,
      name,
      input.color ?? ZONE_META[input.kind].defaultColor,
      JSON.stringify(input.points),
      input.members ? JSON.stringify(input.members) : null,
    ]
  );
  return created;
}

/** Met à jour uniquement les champs fournis (`members: null` = retirer l'assemblage). */
export async function updateZone(
  id: string,
  fields: {
    name?: string;
    kind?: ZoneKind;
    color?: string;
    points?: MapPoint[];
    members?: string[] | null;
  }
): Promise<MapZone | null> {
  const setMembers = fields.members !== undefined;
  const rows = await query<MapZone>(
    `UPDATE map_zones
        SET name       = COALESCE($2, name),
            kind       = COALESCE($3, kind),
            color      = COALESCE($4, color),
            points     = COALESCE($5::jsonb, points),
            members    = CASE WHEN $6::boolean THEN $7::jsonb ELSE members END,
            updated_at = now()
      WHERE id = $1
      RETURNING ${ZONE_COLUMNS}`,
    [
      id,
      fields.name ?? null,
      fields.kind ?? null,
      fields.color ?? null,
      fields.points ? JSON.stringify(fields.points) : null,
      setMembers,
      setMembers && fields.members ? JSON.stringify(fields.members) : null,
    ]
  );
  return rows[0] ?? null;
}

/** Supprime la zone, et la retire des assemblages où elle figurait. */
export async function deleteZone(id: string): Promise<boolean> {
  const rows = await query(`DELETE FROM map_zones WHERE id = $1 RETURNING id`, [id]);
  if (rows.length === 0) return false;
  await query(
    `UPDATE map_zones
        SET members = (SELECT COALESCE(jsonb_agg(m), '[]'::jsonb)
                         FROM jsonb_array_elements(members) AS m
                        WHERE m <> to_jsonb($1::text))
      WHERE members IS NOT NULL AND members @> to_jsonb($1::text)`,
    [id]
  );
  return true;
}
