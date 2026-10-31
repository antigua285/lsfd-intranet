import { stage, type Answers, type Protocol, type Step } from "../medic-types";

/* ─────────── AVC ─────────── */
function avcSteps(a: Answers): Step[] {
  return [
    {
      id: "eval", title: "Évaluation et glycémie",
      lines: [
        "Sécurité de la scène, gants. Évaluation ABCD, signes vitaux.",
        "Glycémie capillaire obligatoire : une hypoglycémie peut imiter un AVC.",
        "Oxygène seulement si SpO2 < 94 %.",
        "Tête surélevée à 30–45° si possible. Rien par la bouche.",
        "Transporter sans retard.",
      ],
      doses: ["O2 : seulement si SpO2 < 94 %"],
      detail: ["Glycémie : piquer le côté du doigt, première goutte essuyée, lecture notée avec l'heure."],
    },
    {
      id: "befast", title: "BE-FAST et heure du dernier moment vu normal",
      lines: [
        "B (équilibre) : trouble de l'équilibre, marche impossible.",
        "E (yeux) : trouble brutal de la vision.",
        "F (visage) : demander de sourire, rechercher une asymétrie.",
        "A (bras) : bras tendus, yeux fermés, un bras qui tombe.",
        "S (parole) : parole anormale, mots qui ne viennent pas.",
        "T (temps) : noter l'heure du dernier moment où le patient a été vu normal.",
      ],
      doses: ["L'heure qui compte : le dernier moment vu normal, ni l'heure de l'appel ni celle de la découverte"],
      detail: ["Demander à un témoin plutôt qu'au patient pour l'heure exacte, et l'inscrire sur la fiche."],
    },
    {
      id: "als", title: "Monitorage, gravité et destination",
      lines: [
        "ALS: Monitorage cardiaque, accès intraveineux. Ne pas retarder le transport.",
        a.deficit === "grave"
          ? "ALS: Score LAMS ≥ 4 probable (bras qui chute rapidement ou force nulle) : transport vers un centre de thrombectomie."
          : "ALS: Calculer le score LAMS (asymétrie faciale, chute du bras, force de la main) : ≥ 4 vers un centre de thrombectomie, sinon vers le centre AVC le plus proche.",
        "Prévenir l'hôpital en route (« alerte AVC »).",
      ],
      tag: "Ne pas retarder le transport",
    },
  ];
}
export const avc: Protocol = {
  key: "avc", title: "AVC", desc: "Déficit neurologique brutal, BE-FAST", category: "Neurologie",
  questions: [
    { id: "deficit", label: "Déficit", options: [{ id: "leger", label: "Léger : visage ou parole" }, { id: "grave", label: "Important : bras qui tombe, force nulle" }] },
    { id: "glyc", label: "Glycémie", options: [{ id: "normale", label: "Normale" }, { id: "basse", label: "Basse (< 0,60 g/L)" }] },
  ],
  build: avcSteps,
  stages: [
    stage("Déficit léger", [74, 92], [14, 18], [150, 175], [95, 98], [1.0, 1.4], [36.4, 37.1], "2 s", 14, "Égales, réactives", "Normale, sèche", "Radial présent, régulier", "Normale"),
    stage("Déficit marqué", [80, 100], [14, 20], [170, 205], [94, 97], [1.0, 1.4], [36.5, 37.3], "2 s", 12, "Égales, réactives", "Normale", "Radial présent, bien frappé", "Normale, ronflante"),
    stage("Dégradation neurologique", [58, 72], [10, 14], [180, 215], [90, 94], [1.0, 1.5], [36.5, 37.5], "2 s", 8, "Asymétriques", "Normale", "Radial fort, lent", "Irrégulière"),
  ],
  startStage: (a) => (a.deficit === "grave" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
};

/* ─────────── Convulsions ─────────── */
function convSteps(a: Answers): Step[] {
  const s: Step[] = [
    {
      id: "crise", title: "Pendant la crise",
      lines: [
        "Protéger la tête, écarter les objets dangereux. Ne rien mettre dans la bouche, ne pas maintenir les membres.",
        "Positionner le patient pour garder les voies aériennes libres. Pas de canule de Guedel pendant les convulsions.",
        "Chronométrer la crise.",
        "Oxygène.",
        "Traiter les blessures éventuelles. Demander une assistance ALS si le patient convulse encore à l'évaluation initiale.",
      ],
      detail: ["Coussin ou vêtement plié sous la tête, patient laissé au sol, vêtements du cou desserrés. Le chrono est lancé dès le début et annoncé à voix haute."],
    },
    {
      id: "als", title: "Crise de plus de 5 minutes ou répétée",
      lines: [
        "ALS: Établir l'accès intraveineux, monitorage cardiaque.",
        "ALS: Crise de plus de 5 minutes ou crises répétées sans reprise de conscience : midazolam 10 mg IM ou IN, ou 5 mg IV/IO si une voie est déjà posée, à répéter une fois après 2 minutes. 10 mg maximum avant contact OLMC.",
        "ALS: Contrôle avancé des voies aériennes si nécessaire.",
      ],
      doses: ["ALS: Midazolam 10 mg (2 mL) IM/IN", "ALS: ou midazolam 5 mg (1 mL) IV/IO, répéter 1× après 2 min"],
      detail: ["BAVU et oxygène prêts avant le midazolam, surveillance continue de la respiration et de la SpO2."],
    },
  ];
  if (a.grossesse === "oui") {
    s.push({
      id: "eclampsie", title: "Éclampsie suspectée",
      lines: ["Femme enceinte de 20 semaines ou plus, ou jusqu'à 6 semaines après l'accouchement : éclampsie.", "ALS: Contact OLMC (sulfate de magnésium).", "Transport immédiat, position latérale gauche."],
    });
  }
  s.push({
    id: "apres", title: "Après la crise",
    lines: [
      "La confusion est normale après une crise : ne pas la prendre pour un AVC.",
      "Position latérale de sécurité, surveiller la respiration.",
      "Glycémie capillaire et recherche d'une cause : chute, hypoglycémie, toxique, alcool, grossesse.",
      "Transporter.",
    ],
  });
  return s;
}
export const convulsions: Protocol = {
  key: "convulsions", title: "Convulsions", desc: "Crise en cours ou post-critique", category: "Neurologie",
  questions: [
    { id: "etat", label: "État", options: [{ id: "postcritique", label: "Crise terminée, patient confus" }, { id: "cours", label: "Crise en cours" }, { id: "repetee", label: "Crises répétées / plus de 5 min" }] },
    { id: "grossesse", label: "Grossesse (≥ 20 sem.) ou post-partum récent", options: [{ id: "non", label: "Non" }, { id: "oui", label: "Oui" }] },
  ],
  build: convSteps,
  stages: [
    stage("Post-critique", [90, 108], [14, 20], [118, 140], [93, 97], [0.8, 1.3], [36.8, 37.5], "2 s", 12, "Égales, réactives lentes", "Pâle, moite", "Radial présent", "Régulière, ronflante"),
    stage("Crise en cours", [115, 140], [8, 14], [140, 170], [84, 91], [0.8, 1.3], [37.2, 38], "2 s", 6, "Dilatées, fixes", "Cyanose péribuccale, sueurs", "Radial rapide", "Irrégulière, bruyante"),
    stage("Crise prolongée", [130, 155], [6, 10], [150, 185], [76, 86], [0.7, 1.3], [38, 39], "3 s", 4, "Dilatées, fixes", "Cyanosée, chaude", "Radial rapide", "Superficielle, cyanose"),
  ],
  startStage: (a) => (a.etat === "repetee" ? 2 : a.etat === "cours" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
};

/* ─────────── Hypoglycémie ─────────── */
function hypoSteps(a: Answers): Step[] {
  const s: Step[] = [{
    id: "eval", title: "Évaluation et glycémie",
    lines: [
      "Sécurité de la scène, gants. Évaluation ABCD, signes vitaux.",
      "Glycémie capillaire. Hypoglycémie : < 0,60 g/L (60 mg/dL) avec signes (sueurs, confusion, agressivité, faiblesse d'un côté, convulsion, coma).",
      "Oxygène si nécessaire.",
    ],
    detail: ["Piquer le côté du doigt, essuyer la première goutte, lire et noter la valeur avec l'heure."],
  }];
  if (a.conscience === "avale") {
    s.push({ id: "sucre", title: "Sucre par la bouche", lines: ["Patient conscient et capable d'avaler : gel de glucose 15 g, ou sucre par la bouche. À répéter si besoin."], doses: ["Gel de glucose 15 g PO, à répéter"], detail: ["Surveiller la déglutition, ne rien donner par la bouche si la conscience baisse."] });
  } else {
    s.push({
      id: "iv", title: "Patient qui n'avale pas",
      lines: [
        "ALS: Accès intraveineux ou intra-osseux.",
        "ALS: Dextrose 10 % 125 mL IV/IO ; répéter 125 mL si la glycémie reste < 0,60 g/L.",
        "ALS: Pas d'accès veineux : glucagon 1 mg IM.",
        "Rien par la bouche chez un patient inconscient ou convulsant.",
      ],
      doses: ["ALS: Dextrose 10 % 125 mL IV/IO, répéter 125 mL", "ALS: Glucagon 1 mg IM si pas d'accès"],
    });
  }
  s.push({ id: "suivi", title: "Recontrôle et transport", lines: ["Recontrôler la glycémie 10 minutes après le traitement.", "Un patient sous antidiabétiques oraux est transporté (risque de rechute)."], tag: "Glycémie à 10 min" });
  return s;
}
export const hypoglycemie: Protocol = {
  key: "hypoglycemie", title: "Hypoglycémie", desc: "Glycémie < 0,60 g/L, malaise, coma", category: "Neurologie",
  questions: [{ id: "conscience", label: "Le patient peut-il avaler ?", options: [{ id: "avale", label: "Oui, conscient" }, { id: "non", label: "Non / inconscient" }] }],
  build: hypoSteps,
  stages: [
    stage("Hypoglycémie légère", [90, 105], [14, 18], [118, 138], [96, 99], [0.45, 0.58], [36.2, 36.8], "2 s", 15, "Égales, réactives", "Pâle, sueurs", "Radial présent", "Normale"),
    stage("Hypoglycémie modérée", [100, 120], [16, 22], [110, 135], [95, 98], [0.3, 0.45], [35.8, 36.5], "2 s", 13, "Égales, réactives", "Pâle, sueurs abondantes", "Radial rapide", "Normale, patient confus ou agressif"),
    stage("Hypoglycémie sévère", [90, 120], [12, 18], [100, 128], [94, 98], [0.12, 0.3], [35.4, 36.2], "2 s", 8, "Moyennes, réactives", "Pâle, moite", "Radial présent", "Normale, coma ou convulsion"),
  ],
  startStage: (a) => (a.conscience === "avale" ? 0 : 2),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
};

/* ─────────── Syncope ─────────── */
function syncSteps(a: Answers): Step[] {
  return [
    { id: "eval", title: "Évaluation", lines: ["Sécurité de la scène. Évaluation ABCD, signes vitaux.", "Patient allongé, jambes surélevées s'il n'a pas de détresse respiratoire.", "Oxygène si nécessaire.", "Glycémie capillaire.", "Demander une assistance ALS ou transporter."], detail: ["Se renseigner sur les circonstances : debout depuis longtemps, effort, douleur thoracique, palpitations, chute associée."] },
    {
      id: "als", title: "Monitorage et ECG",
      lines: [
        "ALS: Établir l'accès intraveineux, monitorage cardiaque.",
        "ALS: ECG 12 dérivations, à rechercher : bradycardie, bloc, tachycardie, sus-décalage ST.",
        a.deshydratation === "oui" ? "ALS: Signes de déshydratation : NaCl 0,9 % 1 L IV." : "ALS: Si signes de déshydratation : NaCl 0,9 % 1 L IV.",
      ],
      doses: ["ALS: NaCl 0,9 % 1 L IV si déshydratation"],
    },
  ];
}
export const syncope: Protocol = {
  key: "syncope", title: "Syncope / malaise", desc: "Perte de connaissance brève", category: "Neurologie",
  questions: [
    { id: "reveil", label: "État actuel", options: [{ id: "recupere", label: "Récupéré, parle normalement" }, { id: "confus", label: "Encore pâle, confus" }, { id: "bradycardie", label: "Pouls très lent" }] },
    { id: "deshydratation", label: "Signes de déshydratation", options: [{ id: "non", label: "Non" }, { id: "oui", label: "Oui" }] },
  ],
  build: syncSteps,
  stages: [
    stage("Récupéré", [66, 86], [14, 18], [108, 126], [96, 99], [0.8, 1.2], [36.3, 36.9], "2 s", 15, "Égales, réactives", "Pâle puis rosée", "Radial présent", "Normale"),
    stage("Hypotension", [92, 110], [16, 22], [82, 98], [94, 97], [0.8, 1.2], [36.0, 36.8], "3 s", 14, "Égales, réactives", "Pâle, moite", "Radial faible", "Normale"),
    stage("Bradycardie", [36, 46], [14, 20], [78, 92], [93, 97], [0.8, 1.2], [36.0, 36.8], "3 s", 13, "Égales, réactives", "Pâle, froide", "Radial lent, faible", "Normale"),
  ],
  startStage: (a) => (a.reveil === "bradycardie" ? 2 : a.reveil === "confus" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};
