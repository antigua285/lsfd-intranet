/** Outils de RAPID LS County Medic (barre d'outils). */

export type ToolKey = "gcs" | "smr" | "start";
export const TOOLS: { key: ToolKey; label: string; title: string }[] = [
  { key: "gcs", label: "Glasgow", title: "Échelle de Glasgow (GCS)" },
  { key: "smr", label: "SMR", title: "Lésion rachidienne potentiellement instable : SMR ?" },
  { key: "start", label: "Triage START", title: "Triage START / JumpSTART (victimes multiples)" },
];

export type GcsOption = { score: number; label: string; hint?: string };
export type GcsCategory = { key: "E" | "V" | "M"; title: string; options: GcsOption[] };

export const GCS_CATEGORIES: GcsCategory[] = [
  {
    key: "E", title: "Ouverture des yeux",
    options: [
      { score: 4, label: "Spontanée", hint: "Yeux ouverts sans stimulation" },
      { score: 3, label: "À la voix", hint: "S'ouvrent à l'appel ou à l'ordre" },
      { score: 2, label: "À la douleur", hint: "Pression sur l'ongle ou le trapèze" },
      { score: 1, label: "Aucune" },
    ],
  },
  {
    key: "V", title: "Réponse verbale",
    options: [
      { score: 5, label: "Orientée", hint: "Sait qui il est, où il est, la date" },
      { score: 4, label: "Confuse", hint: "Phrases cohérentes mais désorienté" },
      { score: 3, label: "Mots inappropriés", hint: "Mots isolés, cris, jurons" },
      { score: 2, label: "Sons incompréhensibles", hint: "Gémissements, grognements" },
      { score: 1, label: "Aucune" },
    ],
  },
  {
    key: "M", title: "Réponse motrice",
    options: [
      { score: 6, label: "Obéit aux ordres", hint: "« Serrez ma main », « montrez deux doigts »" },
      { score: 5, label: "Localise la douleur", hint: "La main vient vers le stimulus" },
      { score: 4, label: "Évitement", hint: "Retire le membre à la douleur" },
      { score: 3, label: "Flexion anormale", hint: "Décortication : bras fléchis sur le thorax" },
      { score: 2, label: "Extension anormale", hint: "Décérébration : bras tendus, poignets en rotation" },
      { score: 1, label: "Aucune" },
    ],
  },
];

export type GcsSelection = Partial<Record<"E" | "V" | "M", number>>;
export type GcsResult = { total: number | null; text: string; severity: string; tone: "ok" | "light" | "mid" | "bad" | "none"; advice: string };

export function gcsResult(sel: GcsSelection): GcsResult {
  const { E, V, M } = sel;
  if (E === undefined || V === undefined || M === undefined) {
    return { total: null, text: "—", severity: "Sélectionner un item dans chaque catégorie", tone: "none", advice: "" };
  }
  const total = E + V + M;
  const text = `E${E} V${V} M${M}`;
  if (total === 15) return { total, text, severity: "Conscience normale", tone: "ok", advice: "Surveillance habituelle." };
  if (total >= 13) return { total, text, severity: "Atteinte légère", tone: "light", advice: "Réévaluer toutes les 5 minutes, rechercher la cause (traumatisme, glycémie, toxique)." };
  if (total >= 9) return { total, text, severity: "Atteinte modérée", tone: "mid", advice: "Surveillance rapprochée, voies aériennes à surveiller, glycémie, oxygène, transport." };
  return { total, text, severity: "Atteinte grave (GCS ≤ 8)", tone: "bad", advice: "Pas de protection fiable des voies aériennes : contrôle avancé (ALS : i-gel), ventilation assistée, oxygène 15 L/min, transport immédiat." };
}

/* ───────────── Algorithme SMR (livre 3, tableau 9.10-A) ───────────── */
export type YesNo = boolean | undefined;
export const SMR_A = [
  "Répond aux critères traumatiques liés au mécanisme",
  "Lésion par compression verticale (dans l'axe de la colonne, depuis les épaules et/ou le sommet du crâne)",
  "Engourdissement ou fourmillement des extrémités",
];
export const SMR_B = [
  "Fiabilité du patient questionnable (état mental altéré, patient non coopératif, intoxication)",
  "Examen du rachis anormal (déformation ou sensibilité le long de la colonne)",
  "Examen sensitif ou moteur anormal",
];
export const SMR_C = [
  "Collision arrière simple (en voiture)",
  "Patient ambulatoire",
  "Absence de douleur cervicale",
];
export type SmrResult = { kind: "pending" | "smr" | "strong" | "none" | "judgement"; title: string; text: string };

export function smrResult(a: YesNo[], b: YesNo[], c: YesNo[]): SmrResult {
  if (b.some((x) => x === true)) {
    return { kind: "smr", title: "SMR", text: "Au moins un « oui » à l'évaluation complète : restriction des mouvements du rachis indiquée. Collier cervical + blocs de tête + matelas à dépression pour le transport ; examen neurologique avant et après chaque mobilisation." };
  }
  if (!b.every((x) => x === false)) return { kind: "pending", title: "À compléter", text: "Répondre à chaque question de l'évaluation complète (étape 2)." };
  if (a.some((x) => x === true)) {
    return { kind: "strong", title: "SMR fortement envisagée", text: "Patient à haut risque (étape 1) sans anomalie à l'évaluation : envisager fortement une SMR ; la décision finale revient au soignant." };
  }
  if (!a.every((x) => x !== undefined)) return { kind: "pending", title: "À compléter", text: "Répondre à chaque question du patient à haut risque (étape 1)." };
  if (c.some((x) => x === false)) return { kind: "judgement", title: "Selon jugement", text: "Les critères de faible risque ne sont pas tous réunis : décision selon le jugement du soignant." };
  if (c.every((x) => x === true)) return { kind: "none", title: "Pas de SMR", text: "Tous les critères de faible risque sont présents : pas de SMR. Le patient reste réévalué ; tracer l'examen dans l'ePCR." };
  return { kind: "pending", title: "À compléter", text: "Répondre à chaque question de l'étape 3 (faible risque)." };
}

/* ───────────── Triage START / JumpSTART ───────────── */
export type Tri = "R" | "J" | "V" | "N";
export type StartNode = { q: string; hint?: string; yes: string | Tri; no: string | Tri };
export const TRI_UI: Record<Tri, { label: string; sub: string; bg: string; fg: string }> = {
  R: { label: "ROUGE", sub: "Immédiat", bg: "#d32f2f", fg: "#fff" },
  J: { label: "JAUNE", sub: "Différé", bg: "#f9c80e", fg: "#1a1a1a" },
  V: { label: "VERT", sub: "Mineur", bg: "#2e9e4f", fg: "#fff" },
  N: { label: "NOIR", sub: "Décédé / état dépassé", bg: "#1a1a1a", fg: "#fff" },
};
export const START_ADULT: Record<string, StartNode> = {
  walk: { q: "Le patient peut-il marcher ?", hint: "Demander à tous les patients de se déplacer vers une zone désignée.", yes: "V", no: "resp" },
  resp: { q: "Respire-t-il ?", hint: "Regarder, écouter le thorax.", yes: "rr", no: "airway" },
  airway: { q: "Respire-t-il après ouverture des voies aériennes ?", hint: "Bascule de la tête, élévation du menton, retirer un corps étranger visible.", yes: "R", no: "N" },
  rr: { q: "Fréquence respiratoire > 30 / min ?", yes: "R", no: "perf" },
  perf: { q: "Recoloration capillaire > 2 s ou pouls radial absent ?", hint: "Contrôler immédiatement toute hémorragie massive.", yes: "R", no: "mental" },
  mental: { q: "Obéit-il à un ordre simple ?", hint: "Exemple : « serrez ma main », « ouvrez les yeux ».", yes: "J", no: "R" },
};
export const START_CHILD: Record<string, StartNode> = {
  walk: { q: "L'enfant peut-il marcher ?", hint: "Un enfant très jeune ou handicapé qui ne marche pas habituellement est évalué à la suite.", yes: "V", no: "resp" },
  resp: { q: "Respire-t-il ?", hint: "Regarder, écouter le thorax.", yes: "rr", no: "pouls0" },
  pouls0: { q: "Pouls périphérique palpable ?", yes: "airway", no: "N" },
  airway: { q: "Respire-t-il après ouverture des voies aériennes et 5 insufflations au BAVU ?", yes: "R", no: "N" },
  rr: { q: "Fréquence respiratoire entre 15 et 45 / min ?", yes: "perf", no: "R" },
  perf: { q: "Pouls périphérique palpable ?", hint: "Contrôler immédiatement toute hémorragie massive.", yes: "mental", no: "R" },
  mental: { q: "Alerte, ou réagit à la voix ou à la douleur de façon appropriée ?", hint: "Réponse inappropriée ou absence de réaction : rouge.", yes: "J", no: "R" },
};
export const isTri = (x: string): x is Tri => x === "R" || x === "J" || x === "V" || x === "N";
