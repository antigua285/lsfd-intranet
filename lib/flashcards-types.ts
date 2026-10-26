/** Types et limites des cartes de révision (sans accès base : utilisables dans le navigateur). */
export type Flashcard = {
  id: string;
  topic: string;
  question: string;
  answer: string;
  /** « Visible par » : si non vide, seuls ces flags révisent la carte (vide = tout le monde). */
  flags: string[];
  /** « Gérée par » : si non vide, seuls les TD qui ont un de ces flags la modifient (vide = toute la TD). */
  manageFlags: string[];
  /** Calculé pour le compte connecté : peut-il modifier cette carte ? */
  editable?: boolean;
};

export const CARD_LIMITS = { topic: 40, question: 400, answer: 1500 };
