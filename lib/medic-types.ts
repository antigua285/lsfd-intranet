/** Types communs de RAPID LS County Medic (100 % client, sans base de données). */
export type Choice = { id: string; label: string; hint?: string };
export type Question = { id: string; label: string; options: Choice[] };
export type Answers = Record<string, string>;

export type Step = {
  id: string;
  title: string;
  /** Manœuvres lues telles quelles par le paramedic. Préfixe « ALS: » = geste avancé (Paramedic). */
  lines: string[];
  /** Posologies / réglages. Préfixe « ALS: » comme pour les lignes. */
  doses?: string[];
  /** Précisions d'exécution (pas de texte RP prérédigé). */
  detail?: string[];
  /** Si présent : choix obligatoire pour continuer (ex. rythme du scope). */
  choice?: { key: string; options: Choice[] };
  tag?: string;
};

export type Rng = [number, number];
export type Stage = {
  label: string;
  fc: Rng; fr: Rng; tas: Rng; spo2: Rng; gly: Rng; temp: Rng; etco2?: Rng;
  trc: string; gcs: number; pupilles: string; peau: string; pouls: string; resp: string;
};

export type Protocol = {
  key: string;
  title: string;
  desc: string;
  category: string;
  questions: Question[];
  build: (a: Answers, x: Answers) => Step[];
  /** Stades de gravité (constantes typiques). Peut dépendre des réponses. Vide ou absent pour une fiche sans constantes. */
  stages: Stage[] | ((a: Answers) => Stage[]);
  startStage: (a: Answers) => number;
  /** +1 si l'amélioration fait avancer dans la liste des stades (ex. arrêt → reprise), -1 sinon. */
  better: 1 | -1;
  betterLabel: string;
  worseLabel: string;
  /** Fiche de consultation sans constantes (procédures, manœuvres). */
  noVitals?: boolean;
  /** Stade à partir duquel on propose de basculer en arrêt cardiaque. */
  arrestAt?: { stage: number; trauma: boolean };
};

/** Raccourci pour écrire un stade. */
export const stage = (
  label: string, fc: Rng, fr: Rng, tas: Rng, spo2: Rng, gly: Rng, temp: Rng,
  trc: string, gcs: number, pupilles: string, peau: string, pouls: string, resp: string, etco2?: Rng,
): Stage => ({ label, fc, fr, tas, spo2, gly, temp, trc, gcs, pupilles, peau, pouls, resp, etco2 });
