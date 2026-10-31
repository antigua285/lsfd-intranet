import { stage, type Answers, type Protocol, type Step } from "../medic-types";

/* ─────────── Bradycardie ─────────── */
function bradySteps(): Step[] {
  return [
    {
      id: "eval", title: "Évaluation",
      lines: [
        "Évaluation ABCD, signes vitaux. Bradycardie symptomatique : FC < 50/min avec mauvaise perfusion (TA < 90 mmHg, confusion, douleur thoracique, choc).",
        "Voies aériennes, oxygénothérapie si nécessaire. Patient allongé.",
        "Demander une assistance ALS, ne pas retarder le transport.",
      ],
    },
    {
      id: "als", title: "Traitement",
      lines: [
        "ALS: Monitorage cardiaque, ECG 12 dérivations. Contact OLMC obligatoire.",
        "ALS: Atropine 1 mg IV/IO, toutes les 3 à 5 minutes, 3 mg maximum.",
        "ALS: Pas d'amélioration, ou bloc de haut degré avec FC ≤ 40 : stimulation externe immédiate, avec midazolam 5 mg et fentanyl si le patient est conscient.",
        "ALS: Mauvaise perfusion persistante (sur ordre de l'OLMC) : NaCl 1 L et adrénaline push-dose.",
        "ALS: Hyperkaliémie suspectée : chlorure de calcium 1 g IV/IO lent + albutérol 5 mg nébulisé.",
      ],
      doses: ["ALS: Atropine 1 mg IV/IO q3–5 min, 3 mg max", "ALS: Midazolam 5 mg + fentanyl avant stimulation (patient conscient)"],
      detail: ["Patchs de stimulation en position antéro-postérieure, mode « demande », fréquence et courant ajustés jusqu'à capture avec pouls palpable."],
    },
  ];
}
export const bradycardie: Protocol = {
  key: "bradycardie", title: "Bradycardie", desc: "FC < 50/min, mal tolérée", category: "Cardio",
  questions: [{ id: "perf", label: "Perfusion", options: [{ id: "correcte", label: "Correcte, patient conscient" }, { id: "mauvaise", label: "Mauvaise : confusion, TA basse" }] }],
  build: bradySteps,
  stages: [
    stage("Bradycardie tolérée", [44, 50], [14, 18], [100, 118], [95, 98], [0.9, 1.3], [36.2, 36.9], "2 s", 15, "Égales, réactives", "Pâle", "Radial lent, présent", "Normale"),
    stage("Mal perfusée", [36, 44], [16, 22], [70, 88], [92, 96], [0.9, 1.3], [35.8, 36.6], "3 s", 13, "Égales, réactives", "Pâle, froide, moite", "Radial lent, faible", "Normale"),
    stage("Choc bradycardique", [26, 38], [10, 16], [54, 74], [86, 92], [0.8, 1.3], [35.2, 36.2], "> 4 s", 9, "Moyennes, lentes", "Grise, froide", "Radial à peine perceptible", "Superficielle"),
  ],
  startStage: (a) => (a.perf === "mauvaise" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};

/* ─────────── Tachycardie ─────────── */
function tachySteps(a: Answers): Step[] {
  const instable = a.stab === "instable";
  const s: Step[] = [{
    id: "eval", title: "Évaluation",
    lines: [
      "Évaluation ABCD, signes vitaux. Le patient est-il stable (bonne perfusion) ou instable (TA < 90 mmHg, trouble de conscience, choc) ?",
      "Voies aériennes, oxygénothérapie si nécessaire.",
      "Demander une assistance ALS, ne pas retarder le transport.",
    ],
    detail: ["On ne choque jamais un patient conscient et stable."],
  }];
  const rythme = a.rythme;
  const lines: string[] = ["ALS: Monitorage cardiaque, ECG 12 dérivations, accès intraveineux."];
  const doses: string[] = [];
  if (rythme === "sinusale") {
    lines.push("ALS: Tachycardie sinusale : traiter la cause (douleur, fièvre, hémorragie, déshydratation).");
    if (instable) lines.push("ALS: Patient instable : NaCl 1 L, rechercher un choc.");
  } else if (rythme === "tsv") {
    if (instable) {
      lines.push("ALS: Sédation si possible : midazolam 5 mg IV/IO.", "ALS: Cardioversion synchronisée : 100 J, puis 200, 300 et 360 J si nécessaire (LIFEPAK 15).");
      doses.push("ALS: Midazolam 5 mg IV/IO", "ALS: Cardioversion synchronisée 100 → 200 → 300 → 360 J");
    } else {
      lines.push("ALS: Surveillance, manœuvre de Valsalva, puis adénosine 6 mg IV rapide + flush de 10 mL ; si persistance, 12 mg.", "ALS: Adénosine contre-indiquée : Wolff-Parkinson-White, cœur greffé, traitement par carbamazépine, bloc de 2e ou 3e degré.");
      doses.push("ALS: Adénosine 6 mg IV rapide + flush 10 mL, puis 12 mg");
    }
  } else if (rythme === "fa") {
    lines.push(instable ? "ALS: Fibrillation auriculaire rapide instable : contact OLMC." : "ALS: Fibrillation auriculaire rapide : traiter la cause, transport.");
  } else if (rythme === "large-regulier") {
    if (instable) {
      lines.push("ALS: Cardioversion synchronisée sous sédation : midazolam 5 mg IV/IO, puis 100 J, 200, 300 et 360 J si nécessaire.");
      doses.push("ALS: Midazolam 5 mg IV/IO", "ALS: Cardioversion synchronisée 100 → 200 → 300 → 360 J");
    } else {
      lines.push("ALS: QRS larges réguliers stable : adénosine 6 mg, puis 12 mg ; contact OLMC.");
      doses.push("ALS: Adénosine 6 mg IV rapide + flush, puis 12 mg");
    }
  } else {
    lines.push(instable ? "ALS: QRS larges irréguliers / torsades instable : défibrillation non synchronisée." : "ALS: QRS larges irréguliers / torsades : contact OLMC.");
  }
  s.push({ id: "traitement", title: "Conduite selon le rythme", lines, doses: doses.length ? doses : undefined, detail: ["Avant toute cardioversion : patchs posés, mode synchronisé vérifié (marqueurs sur les QRS), personne au contact du patient, annonce à voix haute."] });
  s.push({ id: "suivi", title: "Réévaluation et transport", lines: ["Réévaluer après chaque traitement : rythme, TA, conscience.", "Transport avec monitorage continu, pré-alerte."], tag: "Si arrêt → bouton « Arrêt cardiaque »" });
  return s;
}
export const tachycardie: Protocol = {
  key: "tachycardie", title: "Tachycardie", desc: "FC rapide, stable ou instable", category: "Cardio",
  questions: [
    { id: "rythme", label: "Rythme", options: [{ id: "sinusale", label: "Sinusale" }, { id: "tsv", label: "QRS fins, régulier, ≥ 150/min" }, { id: "fa", label: "Fibrillation auriculaire rapide" }, { id: "large-regulier", label: "QRS larges, réguliers" }, { id: "large-irregulier", label: "QRS larges, irréguliers" }] },
    { id: "stab", label: "Stabilité", options: [{ id: "stable", label: "Stable (bonne perfusion)" }, { id: "instable", label: "Instable (TA < 90, confusion, choc)" }] },
  ],
  build: tachySteps,
  stages: [
    stage("Tachycardie stable", [150, 172], [18, 24], [116, 136], [94, 98], [0.9, 1.3], [36.3, 37], "2 s", 15, "Égales, réactives", "Pâle, moite", "Radial rapide, régulier", "Rapide"),
    stage("Instable", [170, 200], [24, 32], [70, 88], [89, 94], [0.9, 1.3], [35.8, 36.6], "3 s", 12, "Égales, réactives", "Pâle, froide, sueurs", "Radial très rapide, faible", "Rapide"),
    stage("Dégradation", [180, 220], [28, 36], [50, 68], [82, 90], [0.8, 1.3], [35.4, 36.2], "> 4 s", 9, "Dilatées, lentes", "Grise, froide", "Radial imperceptible, carotidien filant", "Superficielle"),
  ],
  startStage: (a) => (a.stab === "instable" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};
