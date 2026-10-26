/* ------------------------------------------------------------------ types */

export type TemplateItem = { id: string; label: string };
export type TemplateCategory = { id: string; title: string; items: TemplateItem[] };
export type Tick = { by: string; at: string };
export type Checked = Record<string, Tick>;

export type NotebookRow = {
  id: string;
  userId: string | null;
  ownerName: string;
  checked: Checked;
  createdAt: string;
  archivedAt: string | null;
  archivedBy: string;
  snapshot: { categories: TemplateCategory[] } | null;
};
export type Comment = { id: string; authorId: string | null; authorName: string; body: string; createdAt: string };

/** Seuil de la phase deux : plus de la moitié des compétences. */
export const ELIGIBLE_PERCENT = 51;
export const LIMITS = { categories: 30, items: 60, title: 80, label: 200, comment: 1500 };

/* --------------------------------------------------------------- progression */

export type Progress = { done: number; total: number; percent: number; eligible: boolean };

export function itemIds(categories: TemplateCategory[]): string[] {
  return categories.flatMap((c) => c.items.map((i) => i.id));
}

/** Seules les cases qui existent encore dans le modèle comptent. */
export function computeProgress(categories: TemplateCategory[], checked: Checked): Progress {
  const ids = itemIds(categories);
  const done = ids.filter((id) => checked[id]).length;
  const percent = ids.length === 0 ? 0 : (done / ids.length) * 100;
  return { done, total: ids.length, percent, eligible: ids.length > 0 && percent >= ELIGIBLE_PERCENT };
}

