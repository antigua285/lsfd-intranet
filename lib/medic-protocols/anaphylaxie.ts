import { stage, type Answers, type Protocol, type Step } from "../medic-types";

function steps(a: Answers): Step[] {
  const s: Step[] = [];
  const cutane = a.atteinte === "cutane";
  const choc = a.atteinte === "choc";
  s.push({
    id: "eval", title: "Évaluation et éviction",
    lines: [
      "Écarter la cause si elle est identifiable (piqûre, aliment, médicament). Évaluation ABCD, signes vitaux.",
      "Reconnaître l'anaphylaxie : deux systèmes touchés après une exposition (peau + respiration, ou TA basse), gonflement des lèvres ou de la langue, voix rauque, sifflements.",
      "Oxygène 15 L/min.",
      "Demander une assistance ALS ou transporter, sans retarder le départ.",
    ],
    doses: ["O2 15 L/min"],
    detail: ["Retirer le dard en grattant la peau avec le bord d'une surface plane (carte), sans pince ni ongles."],
  });
  if (cutane) {
    s.push({
      id: "cutane", title: "Atteinte cutanée isolée",
      lines: [
        "Surveillance étroite : réévaluer toutes les 3 à 5 minutes pour détecter une évolution vers l'anaphylaxie.",
        "ALS: Démangeaisons ou urticaire isolés (un seul système) : diphenhydramine 50 mg IV lent ou IM profonde.",
        "L'antihistaminique ne traite pas l'anaphylaxie : en cas d'apparition de signes respiratoires ou de TA basse, passer à l'adrénaline.",
      ],
      doses: ["ALS: Diphenhydramine 50 mg (1 mL) IV lent ou IM"],
    });
  } else {
    s.push({
      id: "adr-im", title: "Adrénaline intramusculaire",
      lines: [
        "Adrénaline IM immédiatement, dans la face antéro-latérale de la cuisse : on n'attend jamais que « ça passe ».",
        "BLS : auto-injecteur d'adrénaline (EpiPen). Si les symptômes persistent, nouvelle injection (2 doses maximum au niveau BLS).",
        "ALS: Adrénaline 0,5 mg IM (1 mg/mL), à répéter toutes les 10 minutes, 3 doses, contact OLMC.",
        "Ne jamais donner l'adrénaline de l'arrêt cardiaque (0,1 mg/mL IV) à un patient qui a un pouls.",
        "Ne pas retarder le transport, même en attendant une deuxième dose.",
      ],
      doses: ["BLS : EpiPen IM cuisse", "ALS: Adrénaline 0,5 mg IM (1 mg/mL) toutes les 10 min, 3 doses max"],
      detail: ["Auto-injecteur tenu à pleine main, appliqué perpendiculairement sur la cuisse, maintenu environ 3 secondes. Noter l'heure de chaque injection.", "Réévaluer toutes les 3 à 5 minutes après l'injection."],
    });
    s.push({
      id: "als", title: "Monitorage et traitements associés",
      lines: [
        "ALS: Monitorage cardiaque, ECG 12 dérivations, accès intraveineux.",
        "ALS: Sifflements persistants : albutérol 5 mg nébulisé, en plus de l'adrénaline.",
        choc
          ? "ALS: Choc anaphylactique : O2 15 L/min, NaCl 1 L en perfusion rapide, puis adrénaline push-dose (contact OLMC). Patient allongé, jambes surélevées s'il n'a pas de détresse respiratoire."
          : "ALS: Si la TA chute : NaCl 1 L en perfusion rapide, patient allongé jambes surélevées s'il n'a pas de détresse respiratoire.",
        "ALS: Démangeaisons : diphenhydramine 50 mg IV lent ou IM, en complément (non à la place) de l'adrénaline.",
      ],
      doses: ["ALS: Albutérol 5 mg nébulisé", "ALS: NaCl 0,9 % 1 L rapide si choc", "ALS: Diphenhydramine 50 mg IV/IM"],
    });
  }
  s.push({
    id: "transport", title: "Transport et surveillance",
    lines: [
      "Transport systématique, même si le patient va mieux : les symptômes peuvent revenir.",
      "Réévaluer toutes les 3 à 5 minutes : respiration, TA, peau, voix.",
      "Noter l'exposition (aliment, piqûre, médicament) pour l'hôpital.",
    ],
    tag: "Si arrêt → bouton « Arrêt cardiaque »",
  });
  return s;
}

export const anaphylaxie: Protocol = {
  key: "anaphylaxie", title: "Réaction allergique / anaphylaxie", desc: "Allergie, piqûre, aliment, médicament", category: "Respiratoire",
  questions: [
    { id: "atteinte", label: "Présentation", options: [{ id: "cutane", label: "Urticaire / démangeaisons seulement" }, { id: "anaph", label: "Peau + respiration (gonflement, sifflements)" }, { id: "choc", label: "Malaise, TA basse" }] },
    { id: "expo", label: "Exposition", options: [{ id: "aliment", label: "Aliment" }, { id: "piqure", label: "Piqûre / venin" }, { id: "medic", label: "Médicament" }, { id: "inconnue", label: "Inconnue" }] },
  ],
  build: steps,
  stages: [
    stage("Réaction cutanée", [88, 104], [16, 20], [118, 136], [96, 99], [0.9, 1.3], [36.5, 37.2], "2 s", 15, "Égales, réactives", "Urticaire diffuse, prurit", "Radial présent, régulier", "Normale"),
    stage("Anaphylaxie", [112, 132], [22, 30], [96, 112], [90, 95], [0.9, 1.4], [36.4, 37.2], "2 à 3 s", 15, "Égales, réactives", "Urticaire, lèvres et langue gonflées", "Radial rapide", "Voix rauque, sifflements"),
    stage("Choc anaphylactique", [130, 152], [28, 34], [60, 82], [84, 90], [0.9, 1.4], [36, 36.8], "> 3 s", 12, "Égales, réactives", "Pâle, marbrée, gonflement du visage", "Radial très filant", "Stridor, sifflements"),
  ],
  startStage: (a) => (a.atteinte === "choc" ? 2 : a.atteinte === "anaph" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};
