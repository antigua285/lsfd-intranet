/**
 * Organigramme : types et fonctions "pures" (aucun accès base de données).
 * Utilisable côté serveur ET dans le navigateur.
 */
import { parseShortText, type Result } from "./validation";

/** Profondeur maximale : 0 (noir) à 7. Au-delà, l'affichage devient illisible. */
export const MAX_DEPTH = 7;
export const TITLE_MAX = 100;
export const ROLE_MAX = 100;
export const HOLDER_MAX = 100;
export const NOTE_MAX = 1500;

export type OrgNode = {
  id: string;
  parentId: string | null;
  position: number;
  title: string;
  /** Intitulé du poste, ex. "Battalion Chief". */
  role: string;
  note: string | null;
  /** Titulaire ayant un compte sur l'intranet. */
  holderUserId: string | null;
  holderFirstName: string | null;
  holderLastName: string | null;
  holderAvatarUrl: string | null;
  holderGrade: string | null;
  holderStation: string | null;
  holderPhone: string | null;
  /** Titulaire sans compte (texte libre). Ignoré si un compte est lié. */
  holderName: string | null;
};

export type OrgRow = OrgNode & {
  depth: number;
  /** Numéro de la note [n], attribué automatiquement dans l'ordre d'affichage. */
  noteNumber: number | null;
  /** Rang parmi les éléments du même parent (0 = premier). */
  index: number;
  siblingCount: number;
  descendantCount: number;
  /** Nombre de niveaux en dessous (0 = aucun enfant). */
  height: number;
  canIndent: boolean;
};

function bySiblingOrder(a: OrgNode, b: OrgNode): number {
  return a.position - b.position || a.title.localeCompare(b.title);
}

/** Met l'arbre à plat dans l'ordre d'affichage, avec profondeur et numéros de notes. */
export function buildRows(nodes: OrgNode[]): OrgRow[] {
  const known = new Set(nodes.map((n) => n.id));
  const children = new Map<string | null, OrgNode[]>();
  for (const node of nodes) {
    const key = node.parentId && known.has(node.parentId) ? node.parentId : null;
    const list = children.get(key) ?? [];
    list.push(node);
    children.set(key, list);
  }
  for (const list of children.values()) list.sort(bySiblingOrder);

  const rows: OrgRow[] = [];
  const seen = new Set<string>();
  let noteCounter = 0;

  /** Renvoie [nombre de descendants, hauteur] du sous-arbre parcouru. */
  function walk(parentId: string | null, depth: number): [number, number] {
    const list = children.get(parentId) ?? [];
    let count = 0;
    let height = -1;
    list.forEach((node, index) => {
      if (seen.has(node.id)) return; // protection contre une donnée circulaire
      seen.add(node.id);
      const hasNote = !!node.note && node.note.trim() !== "";
      const row: OrgRow = {
        ...node,
        depth,
        noteNumber: hasNote ? ++noteCounter : null,
        index,
        siblingCount: list.length,
        descendantCount: 0,
        height: 0,
        canIndent: false,
      };
      rows.push(row);
      const [subCount, subHeight] = walk(node.id, depth + 1);
      row.descendantCount = subCount;
      row.height = subHeight + 1;
      row.canIndent = index > 0 && depth + 1 + row.height <= MAX_DEPTH;
      count += 1 + subCount;
      height = Math.max(height, row.height);
    });
    return [count, height];
  }

  walk(null, 0);
  return rows;
}

/** Texte de la colonne de droite : titulaire + poste. */
export function holderParts(
  node: Pick<OrgNode, "role" | "holderUserId" | "holderFirstName" | "holderLastName" | "holderName">
): { name: string | null; role: string; vacant: boolean } | null {
  let name: string | null = null;
  if (node.holderUserId && (node.holderFirstName || node.holderLastName)) {
    name = [node.holderLastName, node.holderFirstName].filter(Boolean).join(", ");
  } else if (node.holderName) {
    name = node.holderName;
  }
  const role = node.role.trim();
  if (!name && !role) return null;
  return { name, role, vacant: !name };
}

/* ------------------------------- Déplacements ------------------------------ */

export type MoveAction = "up" | "down" | "indent" | "outdent";

export function isMoveAction(value: unknown): value is MoveAction {
  return value === "up" || value === "down" || value === "indent" || value === "outdent";
}

export function depthOf(nodes: OrgNode[], id: string): number {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let depth = 0;
  let current = byId.get(id);
  while (current?.parentId && depth <= MAX_DEPTH + 50) {
    current = byId.get(current.parentId);
    depth++;
  }
  return depth;
}

function heightOf(nodes: OrgNode[], id: string, guard = 0): number {
  if (guard > MAX_DEPTH + 50) return 0;
  const kids = nodes.filter((n) => n.parentId === id);
  if (kids.length === 0) return 0;
  return 1 + Math.max(...kids.map((k) => heightOf(nodes, k.id, guard + 1)));
}

/**
 * Calcule le résultat d'un déplacement : nouveau parent + ordre complet des
 * éléments de ce parent. Ne touche à rien : l'écriture est faite ailleurs.
 */
export function planMove(
  nodes: OrgNode[],
  id: string,
  action: MoveAction
): Result<{ parentId: string | null; order: string[] }> {
  const node = nodes.find((n) => n.id === id);
  if (!node) return { ok: false, error: "Élément introuvable." };

  const siblingsOf = (parentId: string | null) =>
    nodes.filter((n) => n.parentId === parentId).sort(bySiblingOrder);

  const siblings = siblingsOf(node.parentId);
  const index = siblings.findIndex((n) => n.id === id);
  const ids = siblings.map((n) => n.id);

  if (action === "up" || action === "down") {
    const target = action === "up" ? index - 1 : index + 1;
    if (target < 0) return { ok: false, error: "Cet élément est déjà le premier de sa liste." };
    if (target >= ids.length) return { ok: false, error: "Cet élément est déjà le dernier de sa liste." };
    [ids[index], ids[target]] = [ids[target], ids[index]];
    return { ok: true, value: { parentId: node.parentId, order: ids } };
  }

  if (action === "indent") {
    if (index <= 0) {
      return { ok: false, error: "Impossible : il faut un élément juste au-dessus, au même niveau, pour y ranger celui-ci." };
    }
    const newParent = siblings[index - 1];
    if (depthOf(nodes, newParent.id) + 1 + heightOf(nodes, id) > MAX_DEPTH) {
      return { ok: false, error: "Niveau maximum atteint : impossible de descendre d'un niveau." };
    }
    const order = [...siblingsOf(newParent.id).map((n) => n.id), id];
    return { ok: true, value: { parentId: newParent.id, order } };
  }

  // outdent : remonte d'un niveau, juste après l'ancien parent
  if (node.parentId === null) return { ok: false, error: "Cet élément est déjà au niveau le plus haut." };
  const parent = nodes.find((n) => n.id === node.parentId);
  if (!parent) return { ok: false, error: "Élément introuvable." };
  const order: string[] = [];
  for (const sibling of siblingsOf(parent.parentId)) {
    order.push(sibling.id);
    if (sibling.id === parent.id) order.push(id);
  }
  return { ok: true, value: { parentId: parent.parentId, order } };
}

/* -------------------------------- Validation -------------------------------- */

export type OrgFields = {
  title: string;
  role: string;
  holderName: string | null;
  note: string | null;
};

function optionalShort(raw: unknown, label: string, max: number): Result<string> {
  const text = typeof raw === "string" ? raw : "";
  if (text.trim() === "") return { ok: true, value: "" };
  return parseShortText(text, label, max);
}

export function parseOrgFields(input: {
  title: unknown;
  role: unknown;
  holderName: unknown;
  note: unknown;
}): Result<OrgFields> {
  const title = parseShortText(typeof input.title === "string" ? input.title : "", "Le titre", TITLE_MAX);
  if (!title.ok) return title;
  const role = optionalShort(input.role, "Le poste", ROLE_MAX);
  if (!role.ok) return role;
  const holder = optionalShort(input.holderName, "Le nom du titulaire", HOLDER_MAX);
  if (!holder.ok) return holder;

  const rawNote = typeof input.note === "string" ? input.note.replace(/\r\n?/g, "\n").trim() : "";
  if (rawNote.length > NOTE_MAX) {
    return { ok: false, error: `La note est trop longue (${NOTE_MAX} caractères max).` };
  }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(rawNote)) {
    return { ok: false, error: "La note contient des caractères invalides." };
  }

  return {
    ok: true,
    value: {
      title: title.value,
      role: role.value,
      holderName: holder.value || null,
      note: rawNote || null,
    },
  };
}
