import { randomUUID } from "node:crypto";
import { query } from "./db";
import {
  MAX_DEPTH,
  depthOf,
  planMove,
  type MoveAction,
  type OrgFields,
  type OrgNode,
} from "./org-types";
import { ORG_SEED, type SeedNode } from "./org-seed-data";

export type OrgResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): OrgResult => ({ ok: false, error });

/** Vrai si la table de l'organigramme n'existe pas encore (base pas mise à jour). */
export function isMissingTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "42P01" || /relation "?org_nodes"? does not exist/i.test(e?.message ?? "");
}

export async function listOrgNodes(): Promise<OrgNode[]> {
  return query<OrgNode>(
    `SELECT n.id,
            n.parent_id      AS "parentId",
            n.position,
            n.title,
            n.role,
            n.note,
            n.holder_user_id AS "holderUserId",
            n.holder_name    AS "holderName",
            u.first_name     AS "holderFirstName",
            u.last_name      AS "holderLastName",
            u.avatar_url     AS "holderAvatarUrl"
       FROM org_nodes n
       LEFT JOIN users u ON u.id = n.holder_user_id
      ORDER BY n.position, n.title`
  );
}

/** Ajoute un élément à la fin de la liste de son parent (parentId = null : tout en haut). */
export async function createOrgNode(parentId: string | null, title: string): Promise<OrgResult> {
  if (parentId !== null) {
    const nodes = await listOrgNodes();
    if (!nodes.some((n) => n.id === parentId)) return fail("L'élément parent n'existe plus.");
    if (depthOf(nodes, parentId) + 1 > MAX_DEPTH) {
      return fail("Niveau maximum atteint : impossible d'ajouter un sous-niveau ici.");
    }
  }
  try {
    await query(
      `INSERT INTO org_nodes (parent_id, position, title)
       SELECT $1::uuid, COALESCE(max(position) + 1, 0), $2::text
         FROM org_nodes
        WHERE parent_id IS NOT DISTINCT FROM $1::uuid`,
      [parentId, title]
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23503") return fail("L'élément parent n'existe plus.");
    throw error;
  }
  return { ok: true };
}

/** Si un compte est lié, le nom libre est ignoré (et effacé). */
export async function updateOrgNode(id: string, fields: OrgFields): Promise<OrgResult> {
  const rows = await query<{ id: string }>(
    `UPDATE org_nodes
        SET title = $2::text,
            role = $3::text,
            note = $4::text,
            holder_name = CASE WHEN holder_user_id IS NULL THEN $5::text ELSE NULL END
      WHERE id = $1
      RETURNING id`,
    [id, fields.title, fields.role, fields.note, fields.holderName]
  );
  return rows.length > 0 ? { ok: true } : fail("Cet élément n'existe plus.");
}

/** Lie un compte à un poste (userId) ou retire le compte lié (null). */
export async function assignOrgHolder(id: string, userId: string | null): Promise<OrgResult> {
  try {
    const rows = await query<{ id: string }>(
      `UPDATE org_nodes
          SET holder_user_id = $2::uuid,
              holder_name = NULL
        WHERE id = $1
        RETURNING id`,
      [id, userId]
    );
    return rows.length > 0 ? { ok: true } : fail("Cet élément n'existe plus.");
  } catch (error) {
    if ((error as { code?: string }).code === "23503") return fail("Ce compte n'existe plus.");
    throw error;
  }
}

/** Supprime l'élément ET tout ce qu'il contient. */
export async function deleteOrgNode(id: string): Promise<OrgResult> {
  const rows = await query<{ id: string }>(`DELETE FROM org_nodes WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0 ? { ok: true } : fail("Cet élément n'existe plus.");
}

/** Monter, descendre, ou changer de niveau (indent = sous l'élément du dessus, outdent = remonter). */
export async function moveOrgNode(id: string, action: MoveAction): Promise<OrgResult> {
  const plan = planMove(await listOrgNodes(), id, action);
  if (!plan.ok) return fail(plan.error);

  await query(
    `UPDATE org_nodes o
        SET parent_id = $1::uuid,
            position = t.idx::int
       FROM jsonb_array_elements_text($2::jsonb) WITH ORDINALITY AS t(id, idx)
      WHERE o.id = t.id::uuid`,
    [plan.value.parentId, JSON.stringify(plan.value.order)]
  );
  return { ok: true };
}

export async function countOrgNodes(): Promise<number> {
  const rows = await query<{ count: number }>(`SELECT count(*)::int AS count FROM org_nodes`);
  return rows[0]?.count ?? 0;
}

type FlatSeed = {
  id: string;
  parent_id: string | null;
  position: number;
  title: string;
  role: string;
  holder_name: string | null;
  note: string | null;
};

function flattenSeed(nodes: SeedNode[], parentId: string | null, out: FlatSeed[]): FlatSeed[] {
  nodes.forEach((node, position) => {
    const id = randomUUID();
    out.push({
      id,
      parent_id: parentId,
      position,
      title: node.title,
      role: node.role ?? "",
      holder_name: node.holder ?? null,
      note: node.note ?? null,
    });
    flattenSeed(node.children ?? [], id, out);
  });
  return out;
}

/**
 * Importe l'organigramme du PDF, mais SEULEMENT s'il est vide : les
 * modifications faites depuis le site ne sont jamais écrasées.
 * Renvoie le nombre d'éléments importés (0 = rien fait).
 */
export async function seedOrgIfEmpty(): Promise<number> {
  if ((await countOrgNodes()) > 0) return 0;
  const rows = flattenSeed(ORG_SEED, null, []);
  // Une seule instruction : tout est inséré ou rien.
  await query(
    `INSERT INTO org_nodes (id, parent_id, position, title, role, holder_name, note)
     SELECT x.id::uuid, x.parent_id::uuid, x.position, x.title, x.role, x.holder_name, x.note
       FROM jsonb_to_recordset($1::jsonb)
         AS x(id text, parent_id text, position int, title text, role text, holder_name text, note text)`,
    [JSON.stringify(rows)]
  );
  return rows.length;
}
