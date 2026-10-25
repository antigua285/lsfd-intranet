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

const FEATURE_COLUMNS = `id, kind, name, x, y, details`;
const ZONE_COLUMNS = `id, kind, name, color, points, members`;

export async function listFeatures(): Promise<MapFeature[]> {
  return query<MapFeature>(`SELECT ${FEATURE_COLUMNS} FROM map_features ORDER BY name`);
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

export async function updateFeature(
  id: string,
  fields: { name: string; details: Record<string, string> }
): Promise<MapFeature | null> {
  const rows = await query<MapFeature>(
    `UPDATE map_features
        SET name = $2, details = $3::jsonb, updated_at = now()
      WHERE id = $1
      RETURNING ${FEATURE_COLUMNS}`,
    [id, fields.name, JSON.stringify(fields.details)]
  );
  return rows[0] ?? null;
}

export async function moveFeature(id: string, x: number, y: number): Promise<MapFeature | null> {
  const rows = await query<MapFeature>(
    `UPDATE map_features SET x = $2, y = $3, updated_at = now()
      WHERE id = $1
      RETURNING ${FEATURE_COLUMNS}`,
    [id, x, y]
  );
  return rows[0] ?? null;
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
