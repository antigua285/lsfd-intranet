import { stage, type Answers, type Protocol, type Step } from "../medic-types";

/* ─────────── Hyperthermie ─────────── */
function hyperSteps(): Step[] { return [
  { id: "eval", title: "Évaluation et mise à l'abri", lines: ["Évaluation ABCD, signes vitaux, température. Oxygène si nécessaire.", "Aider le patient à se déplacer vers une zone fraîche, retirer ses vêtements extérieurs (veste, pull).", "Patient conscient et capable de boire seul : lui donner de l'eau.", "État mental altéré : glycémie capillaire et demander une assistance ALS.", "Transporter. Le refroidissement ne doit pas retarder le transport."], detail: ["Ne pas abaisser agressivement la température. Surveiller en particulier les personnes âgées, les patients avec comorbidités ou sous diurétiques ou médicaments psychiatriques, et les athlètes."] },
  { id: "als", title: "Soins avancés", lines: ["ALS: Établir l'accès intraveineux.", "ALS: Patient incapable de boire : NaCl 0,9 % 1 L IV."], doses: ["ALS: NaCl 0,9 % 1 L IV"], tag: "Signes de choc → traiter et transporter vite" },
]; }
export const hyperthermie: Protocol = {
  key: "hyperthermie", title: "Hyperthermie / coup de chaleur", desc: "Chaleur, effort, déshydratation", category: "Environnement",
  questions: [{ id: "etat", label: "État", options: [{ id: "epuisement", label: "Épuisement : sueurs, crampes" }, { id: "coup", label: "Confusion, peau chaude et sèche" }] }],
  build: hyperSteps,
  stages: [
    stage("Épuisement par la chaleur", [100, 116], [20, 26], [100, 124], [95, 98], [0.8, 1.2], [38, 39], "2 s", 15, "Égales, réactives", "Rouge, sueurs, crampes", "Radial rapide", "Rapide"),
    stage("Coup de chaleur", [118, 140], [24, 32], [86, 105], [92, 96], [0.7, 1.2], [39.5, 41], "3 s", 11, "Dilatées", "Rouge, chaude, sèche", "Radial rapide, faible", "Rapide"),
    stage("Choc", [135, 155], [28, 36], [60, 82], [86, 92], [0.7, 1.2], [40, 42], "> 3 s", 8, "Dilatées, lentes", "Rouge puis grise, chaude", "Radial filant", "Haletante"),
  ],
  startStage: (a) => (a.etat === "coup" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};

/* ─────────── Hypothermie ─────────── */
function hypoSteps(a: Answers): Step[] { return [
  { id: "eval", title: "Évaluation et réchauffement", lines: [
    "Évaluation ABCD, signes vitaux. Oxygène si nécessaire.",
    "Aider le patient à se déplacer vers une zone chauffée. Patient conscient et capable de boire : boisson tiède.",
    a.type === "locale" ? "Gelure locale : retirer les vêtements et bijoux de la zone, protéger la zone atteinte." : "Hypothermie généralisée : vérifier le pouls pendant une minute et débuter la RCP si nécessaire.",
    "Retirer tout vêtement mouillé et les bijoux.",
    "Placer des poches de chaud instantanées à l'aine, au cou et sur les côtés de la poitrine. Recouvrir de couvertures chauffantes.",
    "État mental altéré : glycémie capillaire et demander une assistance ALS. Transporter.",
  ], detail: ["Les signes vitaux peuvent être extrêmement difficiles à obtenir. Couvrir la tête réduit la perte de chaleur. Une manipulation brusque peut provoquer une arythmie ou un arrêt cardiaque."] },
  { id: "als", title: "Soins avancés", lines: ["ALS: Contrôle avancé des voies aériennes si nécessaire.", "ALS: Monitorage cardiaque, ECG 12 dérivations, accès intraveineux."] },
]; }
export const hypothermie: Protocol = {
  key: "hypothermie", title: "Hypothermie / gelure", desc: "Froid, immersion, exposition", category: "Environnement",
  questions: [{ id: "type", label: "Atteinte", options: [{ id: "generale", label: "Généralisée (frissons, confusion)" }, { id: "locale", label: "Locale (gelure)" }] }],
  build: hypoSteps,
  stages: [
    stage("Légère", [88, 108], [16, 22], [118, 142], [95, 98], [0.8, 1.2], [34.5, 35.5], "2 s", 15, "Égales, réactives", "Pâle, frissons", "Radial présent", "Rapide"),
    stage("Modérée", [48, 66], [10, 14], [90, 112], [90, 94], [0.8, 1.2], [31.5, 34], "3 s", 12, "Égales, lentes", "Pâle, froide, sans frissons", "Radial lent, faible", "Lente"),
    stage("Sévère", [28, 42], [4, 8], [60, 84], [82, 90], [0.8, 1.2], [28, 31], "> 4 s", 6, "Dilatées, fixes", "Cireuse, glacée", "Très difficile à percevoir (vérifier 1 minute)", "Très lente"),
  ],
  startStage: (a) => (a.type === "locale" ? 0 : 1),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};

/* ─────────── Morsure / piqûre ─────────── */
function biteSteps(a: Answers): Step[] {
  const lines = ["Évaluation ABCD, signes vitaux. Oxygène si nécessaire.", "Garder le patient calme et limiter ses mouvements. Placer le membre atteint au niveau ou en dessous du cœur."];
  if (a.type === "serpent") lines.push("Morsure de serpent : immobiliser la zone avec une attelle, membre à hauteur du cœur.");
  if (a.type === "insecte") lines.push("Piqûre d'insecte : retirer le dard s'il est visible en grattant avec le bord d'une carte (pas de pince ni d'ongles), refroidir la zone.");
  if (a.type === "marin") lines.push("Animal marin : retirer l'ardillon si nécessaire, tremper la zone dans de l'eau chaude si disponible.");
  lines.push("Surveiller l'apparition de signes d'allergie : voir le protocole « Anaphylaxie » si besoin.", "Demander une assistance ALS ou transporter.");
  return [
    { id: "eval", title: "Prise en charge", lines },
    { id: "als", title: "Soins avancés", lines: ["ALS: Contrôle avancé des voies aériennes si nécessaire. Monitorage cardiaque, accès intraveineux.", "ALS: Nausées ou vomissements : ondansétron 4 mg IV/IM, à répéter une fois après 15 minutes."], doses: ["ALS: Ondansétron 4 mg IV/IM"] },
  ];
}
export const morsure: Protocol = {
  key: "morsure", title: "Morsure / piqûre venimeuse", desc: "Serpent, insecte, animal marin", category: "Environnement",
  questions: [{ id: "type", label: "Origine", options: [{ id: "serpent", label: "Serpent" }, { id: "insecte", label: "Insecte" }, { id: "marin", label: "Animal marin" }] }],
  build: biteSteps,
  stages: [
    stage("Réaction locale", [84, 100], [16, 20], [118, 138], [96, 99], [0.9, 1.3], [36.4, 37.1], "2 s", 15, "Égales, réactives", "Gonflement et douleur locale", "Radial présent", "Normale"),
    stage("Atteinte générale", [104, 124], [20, 26], [96, 114], [93, 97], [0.9, 1.3], [36.2, 37.2], "2 à 3 s", 14, "Égales, réactives", "Sueurs, nausées, gonflement qui progresse", "Radial rapide", "Rapide"),
    stage("Choc", [128, 150], [26, 34], [62, 84], [86, 92], [0.9, 1.3], [35.8, 36.8], "> 3 s", 12, "Égales, lentes", "Pâle, froide", "Radial filant", "Rapide, superficielle"),
  ],
  startStage: () => 0,
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};

/* ─────────── Électrisation ─────────── */
function elecSteps(): Step[] { return [
  { id: "secu", title: "Sécurité électrique", lines: ["Ne pas toucher le patient tant que la source d'électricité n'est pas coupée : le courant peut être conduit par l'eau et la peau.", "S'assurer que la zone autour du patient est sèche avant de s'approcher.", "S'il est impossible de couper la source, éloigner la victime si possible."], detail: ["Le courant électrique se conduit par l'eau : aucune approche tant que la coupure n'est pas confirmée."] },
  { id: "eval", title: "Évaluation", lines: ["Évaluation ABCD, signes vitaux. Oxygène 15 L/min si nécessaire.", "Arrêt cardiaque : voir le protocole d'arrêt cardiaque. Brûlure : voir le protocole « Brûlure ».", "Retirer les vêtements et bijoux de la victime si possible.", "Contacter une unité ALS ou transporter dès que possible."], doses: ["O2 15 L/min si nécessaire"] },
  { id: "als", title: "Soins avancés", lines: ["ALS: Contrôle avancé des voies aériennes si nécessaire. Monitorage cardiaque, accès intraveineux.", "ALS: L'électrisation peut provoquer tachycardie, fibrillation ventriculaire, asystolie. Un rythme régulier à l'évaluation rend une arythmie peu probable.", "ALS: Nausées ou vomissements : ondansétron 4 mg IV/IM, à répéter une fois après 15 minutes."], doses: ["ALS: Ondansétron 4 mg IV/IM"] },
]; }
export const electrisation: Protocol = {
  key: "electrisation", title: "Électrisation", desc: "Électrocution, courant domestique ou industriel", category: "Environnement",
  questions: [{ id: "etat", label: "État", options: [{ id: "brulure", label: "Conscient, brûlure d'entrée" }, { id: "arythmie", label: "Palpitations, malaise" }] }],
  build: elecSteps,
  stages: [
    stage("Brûlure locale", [86, 104], [16, 22], [118, 140], [96, 99], [0.9, 1.3], [36.3, 37], "2 s", 15, "Égales, réactives", "Brûlure d'entrée et de sortie", "Radial présent", "Normale"),
    stage("Arythmie", [128, 168], [22, 28], [90, 112], [92, 96], [0.9, 1.3], [36.3, 37], "3 s", 14, "Égales, réactives", "Pâle, moite", "Radial rapide, irrégulier", "Rapide"),
    stage("Risque d'arrêt", [150, 200], [26, 34], [60, 84], [84, 90], [0.9, 1.3], [36, 36.8], "> 4 s", 8, "Dilatées", "Grise, froide", "Radial filant, très irrégulier", "Superficielle"),
  ],
  startStage: (a) => (a.etat === "arythmie" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};
