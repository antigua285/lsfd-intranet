import { stage, type Answers, type Protocol, type Step } from "../medic-types";

function steps(a: Answers): Step[] {
  const s: Step[] = [];
  s.push({
    id: "eval", title: "Évaluation et mise en confiance",
    lines: [
      "Sécurité de la scène, gants. Évaluation ABCD, signes vitaux complets.",
      "Patient en position de confort, de préférence assis ou demi-assis.",
      "Oxygène seulement si SpO2 < 94 % (aucun oxygène si SpO2 ≥ 94 %, même en cas de douleur).",
      "Interrogatoire OPQRST et recherche des allergies avant tout médicament.",
      "Demander une assistance ALS, ne pas retarder le transport.",
    ],
    doses: ["O2 : seulement si SpO2 < 94 %"],
    detail: ["Signes d'alerte : douleur en serre, irradiation au bras ou à la mâchoire, sueurs, nausées. Chez la femme, le diabétique et la personne âgée : simple gêne, fatigue, essoufflement.", "Un patient qui se plaint de douleur thoracique est considéré comme infarctus jusqu'à preuve du contraire."],
  });
  s.push({
    id: "aspirine", title: "Aspirine",
    lines: a.aspirine === "oui"
      ? ["Allergie à l'aspirine ou saignement digestif actif : ne pas donner d'aspirine. Le noter sur la fiche."]
      : ["Aspirine 325 mg à croquer par voie orale (4 comprimés de 81 mg), même si le patient en a déjà pris.", "Vérifier l'absence d'allergie à l'aspirine et de saignement digestif actif avant."],
    doses: a.aspirine === "oui" ? undefined : ["Aspirine 325 mg PO, à croquer"],
    detail: ["Faire croquer et avaler les comprimés, sans eau en grande quantité. Noter l'heure de prise sur la fiche."],
  });
  s.push({
    id: "ecg", title: "Monitorage et ECG 12 dérivations",
    lines: [
      "ALS: Monitorage cardiaque (LIFEPAK 15).",
      "ALS: ECG 12 dérivations dans les 10 minutes, à répéter si l'état change.",
      "ALS: Sus-décalage ST ≥ 1 mm dans deux dérivations voisines : alerte « infarctus » à l'hôpital cardiologique et transmission de l'ECG.",
      "ALS: Établir l'accès intraveineux. Constantes vitales toutes les 2 à 3 minutes.",
    ],
    detail: ["Électrodes sur peau sèche, thorax rasé si nécessaire, patient immobile pendant l'enregistrement.", "Sus-décalage en II, III, aVF : possible atteinte du ventricule droit, prudence avec la nitroglycérine."],
    tag: "ECG < 10 min",
  });
  const nitroOk = a.ta !== "basse" && a.pde !== "oui";
  s.push({
    id: "nitro", title: "Nitroglycérine",
    lines: nitroOk
      ? [
          "ALS: Mesurer la TA, puis nitroglycérine 0,4 mg sublinguale après l'ECG.",
          "ALS: Répéter toutes les 5 minutes, 3 doses maximum, TA recontrôlée après chaque dose.",
          "ALS: Ne pas donner si TA systolique < 100 mmHg, en cas de médicament pour troubles de l'érection pris dans les 48 heures, ou d'infarctus du ventricule droit suspecté (prudence).",
        ]
      : ["ALS: Nitroglycérine contre-indiquée ici (TA systolique < 100 mmHg ou médicament pour troubles de l'érection dans les 48 h). Ne pas en donner et le noter sur la fiche."],
    doses: nitroOk ? ["ALS: Nitroglycérine 0,4 mg SL toutes les 5 min, 3 doses maximum"] : undefined,
    detail: ["Demander précisément la prise de médicament pour troubles de l'érection : le patient ne la signale pas spontanément.", "Patient assis, comprimé ou spray sous la langue, sans avaler."],
  });
  s.push({
    id: "douleur", title: "Douleur et nausées",
    lines: [
      "ALS: Douleur persistante : fentanyl de préférence (ou morphine), pas de kétorolac en douleur cardiaque.",
      "ALS: Nausées ou vomissements : ondansétron.",
    ],
    doses: ["ALS: Fentanyl 50 µg IV/IM/IN toutes les 5 min (150 µg max avant contact OLMC)", "ALS: Ondansétron 4 mg IV/IM, à répéter une fois après 15 min"],
    detail: ["Titration lente, douleur réévaluée (0 à 10) après chaque dose. Morphine contre-indiquée si TA basse."],
  });
  s.push({
    id: "autres", title: "Autres causes graves et transport",
    lines: [
      "Transport vers un centre cardiologique, pré-alerte de l'hôpital avec l'ECG.",
      "ALS: Penser à la dissection aortique (douleur « déchirante » vers le dos, TA différente de plus de 20 mmHg entre les bras) : pas de nitroglycérine, antalgie par opioïdes.",
      "ALS: Penser aussi à l'embolie pulmonaire et au pneumothorax.",
      "Si le patient perd connaissance sans pouls : protocole d'arrêt cardiaque (bouton ci-dessous).",
    ],
    tag: "Si arrêt → bouton « Arrêt cardiaque »",
  });
  return s;
}

export const douleurThoracique: Protocol = {
  key: "douleur-thoracique", title: "Douleur thoracique", desc: "Infarctus suspecté, adulte", category: "Cardio",
  questions: [
    { id: "gravite", label: "Aspect du patient", options: [{ id: "stable", label: "Conscient, parle normalement" }, { id: "sueurs", label: "Sueurs, pâleur, gêne importante" }, { id: "choc", label: "Très pâle, confus, TA basse" }] },
    { id: "aspirine", label: "Allergie à l'aspirine ou saignement digestif actif", options: [{ id: "non", label: "Non" }, { id: "oui", label: "Oui" }] },
    { id: "ta", label: "TA systolique", options: [{ id: "ok", label: "≥ 100 mmHg" }, { id: "basse", label: "< 100 mmHg" }] },
    { id: "pde", label: "Médicament pour troubles de l'érection (48 h)", options: [{ id: "non", label: "Non" }, { id: "oui", label: "Oui" }] },
  ],
  build: steps,
  stages: [
    stage("Stable", [78, 98], [16, 20], [128, 150], [95, 98], [0.9, 1.3], [36.4, 37], "2 s", 15, "Égales, réactives", "Pâle, légèrement moite", "Radial présent, régulier", "Normale, un peu superficielle"),
    stage("Douleur intense, sueurs", [100, 120], [20, 26], [150, 170], [93, 96], [0.9, 1.4], [36.2, 36.9], "2 s", 15, "Égales, réactives", "Pâle, sueurs abondantes", "Radial rapide, bien frappé", "Rapide, parole hachée"),
    stage("Choc cardiogénique", [108, 135], [24, 32], [76, 92], [88, 92], [0.9, 1.4], [35.6, 36.4], "> 3 s", 13, "Égales, réactives", "Grise, froide, moite", "Radial filant", "Rapide, patient angoissé"),
  ],
  startStage: (a) => (a.gravite === "choc" ? 2 : a.gravite === "sueurs" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};
