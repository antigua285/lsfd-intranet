import { stage, type Answers, type Protocol, type Step } from "../medic-types";

function obsSteps(a: Answers): Step[] {
  const s: Step[] = [{
    id: "eval", title: "Évaluation",
    lines: ["Évaluation ABCD, signes vitaux. Voies aériennes, oxygénothérapie.", "Demander une assistance ALS et transporter si l'obstruction n'est pas levée."],
  }];
  if (a.etat === "inconscient") {
    s.push({ id: "rcp", title: "Patient inconscient", lines: ["Allonger le patient au sol et commencer immédiatement la RCP pendant 2 minutes (compressions thoraciques).", "Demander une ressource ALS et se référer au protocole d'arrêt cardiaque non traumatique.", "Transporter.", "ALS: Laryngoscopie directe pour visualiser l'obstruction, retirer le corps étranger visible à la pince de Magill."], tag: "Si arrêt → bouton « Arrêt cardiaque »", detail: ["Avant chaque insufflation, regarder dans la bouche : retirer tout corps étranger visible."] });
  } else {
    s.push({ id: "heim", title: "Patient conscient qui ne peut plus parler", lines: ["Corps étranger : si le patient est incapable de parler mais conscient, effectuer 5 compressions abdominales, puis réévaluer.", "S'il perd connaissance, l'allonger au sol et commencer les compressions thoraciques.", "ALS: Laryngoscopie directe et pince de Magill si l'obstruction persiste."], detail: ["Se placer derrière le patient, un poing au creux de l'estomac, l'autre main par-dessus, compressions vers l'arrière et vers le haut."] });
  }
  s.push({ id: "als", title: "Œdème des voies aériennes", lines: ["ALS: Suspicion d'anaphylaxie : traiter selon le protocole adéquat.", "ALS: Stridor : épinéphrine 5 mg (5 mL à 1 mg/mL) en nébulisation, à répéter une fois après 10 minutes ; préparer la gestion des voies aériennes si l'état se dégrade.", "ALS: Gonflement visible des voies aériennes ou de la langue : épinéphrine 1 mg/mL, 0,5 mg (0,5 mL) IM, à répéter toutes les 10 minutes, 3 doses au maximum."], doses: ["ALS: Épinéphrine 0,5 mg IM q10 min, 3 doses max", "ALS: Stridor : épinéphrine 5 mg (5 mL) nébulisée"] });
  return s;
}
export const obstruction: Protocol = {
  key: "obstruction", title: "Obstruction des voies aériennes", desc: "Étouffement, corps étranger", category: "Respiratoire",
  questions: [{ id: "etat", label: "État", options: [{ id: "conscient", label: "Conscient, ne peut plus parler" }, { id: "inconscient", label: "Inconscient" }] }],
  build: obsSteps,
  stages: [
    stage("Obstruction partielle", [100, 120], [26, 34], [130, 155], [84, 91], [0.9, 1.3], [36.4, 37.1], "2 s", 15, "Égales, réactives", "Rouge, cyanose légère", "Radial rapide", "Stridor, toux inefficace"),
    stage("Obstruction complète", [120, 145], [2, 8], [140, 170], [60, 78], [0.9, 1.3], [36.4, 37.1], "3 s", 10, "Dilatées", "Cyanose, sueurs", "Radial rapide", "Aucun passage d'air, patient se tient la gorge"),
    stage("Perte de connaissance", [50, 72], [0, 4], [70, 98], [40, 62], [0.9, 1.3], [36.2, 37], "> 4 s", 3, "Dilatées", "Cyanosée", "Carotidien présent mais lent", "Apnée"),
  ],
  startStage: (a) => (a.etat === "inconscient" ? 2 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};

function inhalSteps(): Step[] { return [
  { id: "eval", title: "Évaluation", lines: ["Évaluation ABCD, signes vitaux. Voies aériennes, oxygène 15 L/min.", "Traiter toute brûlure associée.", "Mesurer le taux de monoxyde de carbone (SpCO) si possible : la SpO2 peut être faussement élevée.", "Demander une assistance ALS et transporter."], doses: ["O2 15 L/min"] },
  { id: "als", title: "Soins avancés", lines: ["ALS: Contrôle avancé des voies aériennes si nécessaire (œdème, voix rauque, suie dans la bouche).", "ALS: Accès intraveineux, NaCl 2 L IV, monitorage cardiaque."], doses: ["ALS: NaCl 0,9 % 2 L IV"], tag: "Transport précoce" },
]; }
export const inhalation: Protocol = {
  key: "inhalation", title: "Blessure par inhalation", desc: "Fumées, gaz irritants", category: "Respiratoire",
  questions: [{ id: "etat", label: "État", options: [{ id: "toux", label: "Toux, gêne respiratoire" }, { id: "voix", label: "Voix rauque, suie dans la bouche" }] }],
  build: inhalSteps,
  stages: [
    stage("Irritation", [96, 116], [22, 28], [120, 145], [95, 98], [0.9, 1.3], [36.4, 37.1], "2 s", 15, "Égales, réactives", "Suie sur le visage", "Radial rapide", "Toux, sifflements (SpO2 parfois faussée)"),
    stage("Atteinte des voies aériennes", [118, 140], [28, 36], [105, 130], [90, 96], [0.9, 1.3], [36.4, 37.3], "2 s", 13, "Égales, réactives", "Suie dans la bouche, brûlures du visage", "Radial rapide", "Voix rauque, stridor (SpO2 parfois faussée)"),
    stage("Détresse sévère", [130, 155], [34, 40], [80, 105], [80, 90], [0.9, 1.3], [36.2, 37.2], "3 s", 9, "Dilatées, lentes", "Cyanose, suie", "Radial filant", "Stridor, épuisement"),
  ],
  startStage: (a) => (a.etat === "voix" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};
