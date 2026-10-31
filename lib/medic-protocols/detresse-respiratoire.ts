import { stage, type Answers, type Protocol, type Step } from "../medic-types";

function steps(a: Answers): Step[] {
  const s: Step[] = [];
  const bpco = a.cause === "bpco";
  const asthme = a.cause === "asthme";
  const oap = a.cause === "oap";
  s.push({
    id: "eval", title: "Évaluation et position",
    lines: [
      "Sécurité de la scène, gants. Évaluation ABCD, signes vitaux, SpO2.",
      "Position assise ou demi-assise, jamais allongé de force. Aider le patient à rester dans la position qu'il choisit.",
      "Rechercher les signes de gravité : ne finit pas ses phrases, tirage, sueurs, lèvres bleues, confusion, silence à l'auscultation.",
      "Surveiller la fréquence respiratoire et la capacité à parler à chaque réévaluation.",
      "Envisager un masque chirurgical pour le soignant et le patient si l'origine est incertaine.",
    ],
    detail: ["Un patient qui se tait et s'endort ne va pas mieux : il s'épuise."],
  });
  s.push({
    id: "o2", title: "Oxygénothérapie",
    lines: [
      bpco
        ? "Insuffisant respiratoire chronique connu : lunettes nasales 1 à 4 L/min, titrer pour une SpO2 de 88 à 92 %."
        : "Cible SpO2 94 à 98 %. Hypoxie légère : lunettes nasales 2 à 6 L/min. Hypoxie modérée : masque simple 8 à 10 L/min. Hypoxie non corrigée ou détresse sévère : masque haute concentration 15 L/min.",
      "Insuffisance respiratoire (respiration trop lente ou inefficace) : assister la ventilation au BAVU, 1 insufflation toutes les 6 secondes (10 par minute), avec oxygène.",
      "Overdose suspectée : se référer au protocole d'overdose.",
      "Demander une assistance ALS ou transporter.",
    ],
    doses: bpco ? ["O2 1–4 L/min, cible 88–92 %"] : ["O2 selon le tableau : 2–6 / 8–10 / 15 L/min", "BAVU 10 insufflations/min"],
    detail: ["Masque simple ou haute concentration appliqué sur le nez et la bouche, ballon réservoir gonflé avant application.", "BAVU : masque maintenu en C, mandibule soulevée, insufflation jusqu'à l'élévation visible du thorax, une insufflation toutes les 6 secondes."],
  });
  s.push({
    id: "als", title: "Monitorage et accès",
    lines: [
      "ALS: Monitorage cardiaque (LIFEPAK 15), capnographie si disponible.",
      "ALS: Établir l'accès intraveineux. Constantes vitales toutes les 2 à 3 minutes.",
      "ALS: Pneumothorax suspecté (murmure absent d'un côté, TA qui chute, SpO2 qui s'effondre) : décompression à l'aiguille, côté confirmé à l'auscultation.",
      "ALS: Contrôle avancé des voies aériennes si nécessaire.",
    ],
    detail: ["Confirmer le côté en comparant l'auscultation des deux hémithorax avant toute décompression."],
  });
  if (asthme) {
    s.push({
      id: "asthme", title: "Asthme / bronchospasme",
      lines: [
        "ALS: Albutérol 5 mg nébulisé, à répéter 2 fois ; peut être donné dans la CPAP.",
        "ALS: Aggravation malgré l'albutérol ou crise grave : adrénaline 0,5 mg IM (1 mg/mL) dans la cuisse.",
        "ALS: Réévaluer après chaque traitement : fréquence respiratoire, SpO2, capacité à parler.",
      ],
      doses: ["ALS: Albutérol 5 mg nébulisé × 3", "ALS: Adrénaline 0,5 mg IM (1 mg/mL), cuisse"],
      detail: ["Nébuliseur raccordé à l'oxygène à haut débit, patient assis, masque bien appliqué.", "Adrénaline IM dans la face antéro-latérale de la cuisse, à travers les vêtements si besoin."],
    });
  }
  if (oap) {
    s.push({
      id: "oap", title: "Œdème pulmonaire",
      lines: [
        "Oxygène 15 L/min si nécessaire. Aspirine 325 mg à croquer si douleur thoracique associée.",
        "ALS: ECG 12 dérivations, accès intraveineux, constantes toutes les 2 à 3 minutes.",
        "ALS: CPAP pour tout patient conscient en détresse modérée à sévère.",
        "ALS: Nitroglycérine 0,4 mg sublinguale toutes les 5 minutes, 3 doses maximum, si TA systolique > 100 mmHg.",
        "ALS: Pas de remplissage vasculaire.",
      ],
      doses: ["ALS: Nitroglycérine 0,4 mg SL toutes les 5 min, 3 doses max (TAS > 100)"],
      detail: ["TA recontrôlée avant et après chaque dose de nitroglycérine."],
    });
  }
  s.push({
    id: "reeval", title: "Réévaluation et transport",
    lines: [
      "Réévaluer après chaque traitement : fréquence respiratoire, SpO2, capacité à parler.",
      "Transport précoce en cas de détresse ou d'arrêt respiratoire, d'obstruction des voies aériennes ou de pneumothorax.",
      "Pré-alerte de l'hôpital.",
    ],
    tag: "Si arrêt → bouton « Arrêt cardiaque »",
  });
  return s;
}

export const detresseRespiratoire: Protocol = {
  key: "detresse-respiratoire", title: "Détresse respiratoire", desc: "Asthme, BPCO, œdème pulmonaire, cause inconnue", category: "Respiratoire",
  questions: [
    { id: "cause", label: "Cause évoquée", options: [{ id: "inconnue", label: "Inconnue" }, { id: "asthme", label: "Asthme / sifflements" }, { id: "oap", label: "Œdème pulmonaire (crépitants, cardiaque connu)" }, { id: "bpco", label: "BPCO connue" }] },
    { id: "gravite", label: "État du patient", options: [{ id: "modere", label: "Parle en phrases" }, { id: "severe", label: "Parle par mots, tirage, sueurs" }, { id: "epuise", label: "Ne parle plus, s'endort, lèvres bleues" }] },
  ],
  build: steps,
  stages: [
    stage("Détresse modérée", [100, 116], [24, 28], [128, 150], [91, 94], [0.9, 1.3], [36.5, 37.3], "2 s", 15, "Égales, réactives", "Pâle, un peu moite", "Radial rapide, régulier", "Rapide, parole en phrases"),
    stage("Détresse sévère", [120, 140], [30, 36], [135, 160], [86, 90], [0.9, 1.4], [36.5, 37.5], "2 à 3 s", 14, "Égales, réactives", "Sueurs, lèvres légèrement bleues", "Radial rapide", "Tirage, parole par mots"),
    stage("Épuisement", [128, 150], [8, 12], [95, 115], [76, 85], [0.9, 1.4], [36.4, 37.4], "3 s", 11, "Moyennes, réactives lentes", "Cyanose, froide", "Radial rapide, faible", "Superficielle, silence, somnolence"),
  ],
  startStage: (a) => (a.gravite === "epuise" ? 2 : a.gravite === "severe" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};
