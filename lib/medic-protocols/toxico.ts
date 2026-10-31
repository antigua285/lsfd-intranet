import { stage, type Answers, type Protocol, type Stage, type Step } from "../medic-types";

function odSteps(a: Answers): Step[] {
  const s: Step[] = [{
    id: "secu", title: "Sécurité et évaluation",
    lines: [
      "Gants, attention aux seringues et aux produits sur la scène. Éloigner le patient du danger.",
      "Évaluation ABCD, signes vitaux, glycémie.",
      "Voies aériennes, oxygène si nécessaire.",
      "Demander une assistance ALS ou transporter.",
    ],
    detail: ["Les emballages, boîtes et produits sont récupérés et remis à l'hôpital."],
  }];
  if (a.tableau === "opioides") {
    s.push({
      id: "opio", title: "Overdose d'opioïdes",
      lines: [
        "Pupilles en tête d'épingle, respiration lente, somnolence ou coma : ventiler au BAVU d'abord si le patient respire mal ou pas.",
        "Naloxone par petites doses : 2 mg IN (1 mg par narine) ou 2 mg IM, à répéter si besoin, 8 mg maximum.",
        "ALS: Naloxone 0,4 mg IV/IO toutes les 2 à 3 minutes. Objectif : une respiration correcte, pas un réveil complet.",
        "ALS: Établir l'accès intraveineux, monitorage cardiaque, ECG, capnographie.",
        "Surveiller et transporter : la naloxone peut s'arrêter d'agir avant la drogue (rechute).",
      ],
      doses: ["Naloxone 2 mg IN (1 mg/narine) ou IM, 8 mg max", "ALS: Naloxone 0,4 mg IV/IO toutes les 2–3 min"],
      detail: ["Un réveil brutal rend le patient agressif et il veut partir : titrer par petites doses.", "Recueillir : quoi, combien, quand, par quelle voie."],
    });
  } else if (a.tableau === "stimulants") {
    s.push({
      id: "stim", title: "Stimulants (cocaïne, amphétamines)",
      lines: [
        "Agitation, sueurs, température élevée, cœur rapide, douleur thoracique possible.",
        "Environnement calme, refroidissement si température > 39 °C.",
        "ALS: Monitorage, ECG, accès intraveineux.",
        "ALS: Patient dangereux ou non coopérant : sédation par midazolam 5 mg IM/IN/IV (contact OLMC), BAVU et oxygène prêts avant la sédation.",
        "Patient attaché ou sédaté : surveillance continue, jamais de transport sur le ventre.",
      ],
      doses: ["ALS: Midazolam 5 mg IM/IN/IV (OLMC)"],
    });
  } else {
    s.push({
      id: "autre", title: a.tableau === "alcool" ? "Intoxication à l'alcool" : "Autre intoxication",
      lines: [
        "Documenter les impressions générales et ne pas retarder le transport.",
        "Alcool : toujours chercher un traumatisme crânien et une hypoglycémie associés.",
        "ALS: Antidotes sur contact OLMC : inhibiteurs calciques ou bêtabloquants → chlorure de calcium 1 g IV ; tricycliques (QRS larges) → bicarbonate de sodium 50 mEq IV ; organophosphorés → DuoDote.",
      ],
    });
  }
  s.push({ id: "suivi", title: "Surveillance et refus", lines: ["Constantes toutes les 2 à 3 minutes.", "Un refus de transport ne s'accepte qu'après avoir évalué le discernement du patient (voir la fiche « Refus de soins »)."], tag: "Rechute possible" });
  return s;
}
const odStages = (a: Answers): Stage[] => {
  const opio = a.tableau === "opioides";
  const stim = a.tableau === "stimulants";
  if (stim) return [
    stage("Agitation", [110, 130], [20, 26], [150, 175], [96, 99], [0.9, 1.4], [37.8, 38.8], "2 s", 14, "Dilatées, réactives", "Sueurs, chaude", "Radial rapide, fort", "Rapide"),
    stage("Stimulation sévère", [135, 165], [26, 34], [170, 200], [94, 98], [0.9, 1.4], [38.8, 40.5], "2 s", 13, "Très dilatées", "Très chaude, sueurs profuses", "Radial très rapide", "Haletante"),
  ];
  return [
    stage("Somnolent", [58, 78], [10, 13], [100, 125], [91, 95], [0.8, 1.2], [35.8, 36.6], "2 s", 12, opio ? "En tête d'épingle" : "Moyennes, réactives", "Pâle", "Radial lent", "Lente"),
    stage("Dépression respiratoire", [48, 68], [4, 8], [88, 108], [76, 88], [0.8, 1.2], [35.4, 36.2], "3 s", 7, opio ? "En tête d'épingle" : "Moyennes, lentes", "Cyanose des lèvres", "Radial lent, faible", "Très lente, ronflante"),
    stage("Apnée imminente", [38, 52], [1, 4], [78, 98], [58, 75], [0.8, 1.2], [35, 35.8], "> 3 s", 4, opio ? "En tête d'épingle" : "Moyennes, aréactives", "Cyanosée, froide", "Radial à peine perceptible", "Gasps espacés"),
  ];
};
export const overdose: Protocol = {
  key: "overdose", title: "Overdose / intoxication", desc: "Opioïdes, stimulants, alcool, autre", category: "Toxicologie",
  questions: [
    { id: "tableau", label: "Tableau évoqué", options: [{ id: "opioides", label: "Opioïdes" }, { id: "stimulants", label: "Stimulants" }, { id: "alcool", label: "Alcool" }, { id: "autre", label: "Autre / inconnu" }] },
    { id: "resp", label: "Respiration", options: [{ id: "normale", label: "Correcte" }, { id: "lente", label: "Lente / superficielle" }, { id: "absente", label: "Quasi absente" }] },
  ],
  build: odSteps,
  stages: odStages,
  startStage: (a) => (a.tableau === "stimulants" ? 0 : a.resp === "absente" ? 2 : a.resp === "lente" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};

function coSteps(): Step[] {
  return [
    { id: "secu", title: "Sécurité et éviction", lines: ["Vérifier la sûreté de la scène (détecteur de CO si disponible, aération).", "Éloigner le patient de la source de monoxyde de carbone.", "Évaluation ABCD, signes vitaux."] },
    { id: "o2", title: "Oxygène", lines: ["Oxygène à 15 L/min au masque haute concentration.", "Mesurer le taux de CO (SpCO) si un détecteur est disponible : la SpO2 peut être faussement normale.", "Demander une assistance ALS ou transporter."], doses: ["O2 15 L/min"] },
    { id: "als", title: "Monitorage", lines: ["ALS: Contrôle avancé des voies aériennes si nécessaire.", "ALS: Monitorage cardiaque (LIFEPAK 15)."], tag: "Transport" },
  ];
}
export const monoxyde: Protocol = {
  key: "monoxyde", title: "Monoxyde de carbone", desc: "Intoxication par fumées, chauffage, moteur", category: "Toxicologie",
  questions: [{ id: "etat", label: "État du patient", options: [{ id: "cephalee", label: "Céphalées, nausées" }, { id: "confus", label: "Confus, somnolent" }, { id: "coma", label: "Coma" }] }],
  build: coSteps,
  stages: [
    stage("Céphalées, nausées", [92, 108], [16, 22], [118, 140], [97, 100], [0.9, 1.3], [36.4, 37.1], "2 s", 15, "Égales, réactives", "Rosée, sueurs", "Radial présent", "Normale (SpO2 faussement normale)"),
    stage("Confusion", [105, 125], [20, 26], [105, 130], [96, 100], [0.9, 1.3], [36.2, 37], "2 s", 12, "Égales, réactives", "Rosée à pâle", "Radial rapide", "Rapide (SpO2 faussement normale)"),
    stage("Coma", [120, 145], [24, 30], [80, 100], [95, 100], [0.9, 1.3], [36, 36.8], "3 s", 7, "Moyennes, lentes", "Pâle, moite", "Radial filant", "Rapide, superficielle (SpO2 faussement normale)"),
  ],
  startStage: (a) => (a.etat === "coma" ? 2 : a.etat === "confus" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};
