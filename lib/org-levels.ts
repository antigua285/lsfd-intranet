import { MAX_DEPTH } from "./org-types";

/**
 * Mise en forme de l'organigramme selon la profondeur, calquée sur le PDF :
 *   0 noir · 1 orange · 2 gris (gras) · 3 gras · 4 et + normal (décalé vers la droite)
 *
 * Les classes sont écrites en toutes lettres (et non assemblées) pour que
 * Tailwind les détecte. Pour changer une couleur, modifie `row` (fond + texte).
 */
export type OrgLevelStyle = {
  /** Nom affiché dans l'éditeur */
  name: string;
  /** Fond + couleur du texte de toute la ligne */
  row: string;
  /** Style de l'intitulé (colonne de gauche) */
  title: string;
  /** Style du poste / titulaire (colonne de droite) */
  holder: string;
  /** Pastille de couleur dans l'éditeur */
  swatch: string;
};

const NORMAL: OrgLevelStyle = {
  name: "Normal",
  row: "bg-white text-slate-800",
  title: "text-[12px]",
  holder: "text-[12px]",
  swatch: "bg-white border border-slate-300",
};

export const ORG_LEVELS: OrgLevelStyle[] = [
  {
    name: "Noir",
    row: "bg-black text-white",
    title: "font-bold text-[14px] uppercase tracking-wide",
    holder: "font-bold text-[13px]",
    swatch: "bg-black",
  },
  {
    name: "Orange",
    row: "bg-[#f6b26b] text-black",
    title: "font-bold text-[13px] uppercase",
    holder: "font-bold text-[13px]",
    swatch: "bg-[#f6b26b]",
  },
  {
    name: "Gris",
    row: "bg-[#d9d9d9] text-black",
    title: "font-bold text-[12px] uppercase",
    holder: "font-bold text-[12px]",
    swatch: "bg-[#d9d9d9]",
  },
  {
    name: "Gras",
    row: "bg-white text-black",
    title: "font-bold text-[12px] uppercase",
    holder: "font-bold text-[12px]",
    swatch: "bg-white border border-slate-400",
  },
  NORMAL,
  NORMAL,
  NORMAL,
  NORMAL,
];

/** Style d'une ligne selon sa profondeur (0 = tout en haut). */
export function levelStyle(depth: number): OrgLevelStyle {
  return ORG_LEVELS[Math.min(Math.max(depth, 0), MAX_DEPTH)];
}

/** Décalage vers la droite (en pixels) : seulement à partir du niveau "normal". */
export function indentPx(depth: number): number {
  return Math.max(0, depth - 3) * 18;
}
