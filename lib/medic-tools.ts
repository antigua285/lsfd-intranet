/** Outils de RAPID LS County Medic (barre d'outils). */

export type ToolKey = "gcs";
export const TOOLS: { key: ToolKey; label: string; title: string }[] = [
  { key: "gcs", label: "Glasgow", title: "Échelle de Glasgow (GCS)" },
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
