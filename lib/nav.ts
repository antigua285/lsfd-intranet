/**
 * Hiérarchie des pages de formation : chaque page a UN parent logique, quel que soit le chemin
 * par lequel on y est arrivé… sauf les pages que l'administration atteint depuis son propre panneau
 * (?from=admin), pour que « retour » ramène là d'où l'on vient.
 */
export type Crumb = { label: string; href?: string };
export type From = "admin" | "td" | undefined;

export function parseFrom(value: string | string[] | undefined): From {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "admin" || v === "td" ? v : undefined;
}

export const withFrom = (href: string, from: From) => (from ? `${href}${href.includes("?") ? "&" : "?"}from=${from}` : href);

const FORMATION: Crumb = { label: "Formation", href: "/training" };
const ESPACE_TD: Crumb = { label: "Espace TD", href: "/training/td" };
const ADMIN: Crumb = { label: "Administration", href: "/admin" };
const ADMIN_EXAMS: Crumb = { label: "Examens", href: "/admin/exams" };

export type TrailPage = "review" | "review-detail" | "manage" | "cards-manage";

export function trailFor(page: TrailPage, from: From, detailLabel?: string): Crumb[] {
  const examBase = from === "admin" ? [ADMIN, ADMIN_EXAMS] : [FORMATION, ESPACE_TD];
  switch (page) {
    case "review":
      return [...examBase, { label: "Correction des examens" }];
    case "review-detail":
      return [...examBase, { label: "Correction des examens", href: withFrom("/training/exams/review", from) }, { label: detailLabel ?? "Copie" }];
    case "manage":
      return [...examBase, { label: "Clés et assignation" }];
    case "cards-manage":
      if (from === "admin") return [ADMIN, { label: "Gérer les cartes" }];
      if (from === "td") return [FORMATION, ESPACE_TD, { label: "Gérer les cartes" }];
      return [FORMATION, { label: "Cartes de révision", href: "/training/cards" }, { label: "Gérer les cartes" }];
  }
}
