import { stage, type Answers, type Protocol, type Step } from "../medic-types";

/* ─────────── Traumatisme thoracique ─────────── */
function thoraxSteps(a: Answers): Step[] {
  const s: Step[] = [
    {
      id: "secu", title: "Sécurité et examen du thorax",
      lines: [
        "Attendre le feu vert du LSPD/LSSD en cas de fusillade ou d'agression.",
        "Arrêter d'abord les hémorragies massives (X), oxygène haut débit.",
        "Thorax déshabillé, examiné devant et derrière, des deux côtés.",
        "Regarder : asymétrie, plaie, bulles d'air, segment qui bouge à l'envers.",
        "Palper : crépitements, douleur, segment mobile. Écouter : murmure vésiculaire des deux côtés.",
        "Demander une assistance ALS ou transporter sans attendre.",
      ],
      doses: ["O2 15 L/min"],
      detail: ["Examen recto-verso : glisser la main sous le patient pour chercher les plaies dorsales.", "Comparer l'auscultation des deux côtés, au même endroit, avant de conclure."],
    },
  ];
  if (a.type === "soufflante") {
    s.push({
      id: "soufflante", title: "Plaie soufflante",
      lines: [
        "Pansement occlusif à valve (ou pansement fixé sur trois côtés), posé vite.",
        "Surveiller : un pneumothorax sous tension peut apparaître malgré le pansement.",
        "Transport précoce (thorax ouvert).",
      ],
      detail: ["Poser le pansement à l'expiration, peau sèche autant que possible, bords bien collés. Un côté reste libre si le pansement est fixé sur trois côtés."],
    });
  }
  if (a.type === "volet") {
    s.push({
      id: "volet", title: "Volet costal",
      lines: [
        "Un segment du thorax bouge à l'envers de la respiration.",
        "Oxygène. Ventilation assistée au BAVU si épuisement ou désaturation.",
        "ALS: Antalgie (fentanyl ou morphine).",
        "Transport.",
      ],
      doses: ["ALS: Fentanyl 50 µg IV/IM/IN toutes les 5 min (150 µg max)"],
    });
  }
  if (a.type === "tamponnade") {
    s.push({
      id: "tamponnade", title: "Tamponnade suspectée",
      lines: [
        "Plaie du thorax + choc + veines du cou gonflées + bruits du cœur assourdis.",
        "Transport immédiat vers le centre de traumatologie, alerte de l'hôpital.",
        "ALS: Remplissage prudent.",
      ],
    });
  }
  if (a.type === "tension" || a.type === "soufflante") {
    s.push({
      id: "tension", title: "Pneumothorax sous tension",
      lines: [
        "Signes : détresse qui s'aggrave (FR > 30 ou < 10, agitation), murmure absent d'un côté, TA qui chute (< 90), veines du cou gonflées, SpO2 < 90 % malgré l'oxygène.",
        "Y penser chez un traumatisé qui se dégrade après la mise sous ventilation, et devant un arrêt traumatique en AESP.",
        "ALS: Oxygène haut débit, confirmer le côté par l'auscultation, désinfecter.",
        "ALS: Cathéter de décompression 14G (8 cm), 2e espace intercostal sur la ligne médio-claviculaire, ou 4e–5e espace sur le côté, juste en avant de la ligne axillaire moyenne.",
        "ALS: Piquer perpendiculairement, au ras du bord supérieur de la côte inférieure (jamais sous une côte, jamais près du sternum), avancer en aspirant jusqu'au retour d'air, pousser le cathéter, retirer l'aiguille, fixer.",
        "ALS: Réévaluer : réécouter, reprendre les constantes. Nouvelle dégradation : répéter du même côté ou de l'autre.",
      ],
      detail: ["Le côté est confirmé par l'auscultation avant de piquer : le geste est toujours précédé d'une comparaison des deux murmures.", "Un sifflement d'air à la décompression et une amélioration du patient confirment le geste."],
      tag: "Réévaluer après le geste",
    });
  }
  s.push({
    id: "depart", title: "Départ et réévaluation",
    lines: ["Temps sur place inférieur à 10 minutes pour un traumatisé grave.", "Transport vers un centre de traumatologie, transmission MIST.", "Réévaluer la respiration à chaque contrôle : le thorax peut se dégrader en quelques minutes."],
    tag: "Si arrêt → bouton « Arrêt cardiaque traumatique »",
  });
  return s;
}
export const thorax: Protocol = {
  key: "thorax", title: "Traumatisme thoracique", desc: "Plaie soufflante, pneumothorax, volet costal", category: "Trauma",
  questions: [
    { id: "type", label: "Tableau", options: [{ id: "soufflante", label: "Plaie soufflante (bulles d'air)" }, { id: "tension", label: "Détresse, murmure absent d'un côté" }, { id: "volet", label: "Segment du thorax qui bouge à l'envers" }, { id: "tamponnade", label: "Choc, veines du cou gonflées" }] },
    { id: "gravite", label: "État", options: [{ id: "stable", label: "Respire, parle" }, { id: "detresse", label: "Détresse respiratoire" }] },
  ],
  build: thoraxSteps,
  stages: [
    stage("Stable", [96, 112], [20, 26], [112, 132], [93, 96], [0.9, 1.2], [36.2, 36.8], "2 s", 15, "Égales, réactives", "Pâle, moite", "Radial présent", "Rapide, douloureuse"),
    stage("Détresse", [118, 138], [28, 36], [90, 105], [86, 90], [0.9, 1.2], [35.6, 36.2], "3 s", 14, "Égales, réactives", "Pâle, sueurs", "Radial rapide, faible", "Haletante, murmure diminué d'un côté"),
    stage("Pneumothorax sous tension", [135, 155], [34, 40], [60, 82], [70, 84], [0.9, 1.2], [35.2, 35.8], "> 4 s", 11, "Dilatées, lentes", "Grise, cyanose, veines du cou gonflées", "Radial filant", "Murmure absent d'un côté"),
  ],
  startStage: (a) => (a.gravite === "detresse" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: true },
};

/* ─────────── Brûlure ─────────── */
function burnSteps(a: Answers): Step[] {
  const chim = a.type === "chimique";
  const s: Step[] = [
    {
      id: "scene", title: "Sécurité et éviction",
      lines: [
        chim ? "Assurer la sécurité des lieux (décontamination, matières dangereuses) avant d'approcher." : "Éloigner la victime de la source de combustion si possible.",
        "Évaluation ABCD, signes vitaux. Oxygène 15 L/min si nécessaire.",
        "Retirer les vêtements qui n'adhèrent pas à la peau, et les bijoux des membres brûlés si possible.",
        "Demander une assistance ALS ou transporter dès que possible.",
      ],
      doses: ["O2 15 L/min si nécessaire"],
      detail: ["Ne jamais tirer sur un vêtement collé à la peau : le laisser en place."],
    },
    {
      id: "refroid", title: chim ? "Décontamination" : "Refroidissement et pansement",
      lines: chim
        ? [
            "Brûlure chimique liquide : rincer abondamment à l'eau ou au NaCl, idéalement 20 minutes minimum.",
            "Poudre sèche : brosser la poudre avant de rincer.",
            "Éviter de propager le contaminant aux zones saines (surtout d'un œil à l'autre).",
            "Brûlure oculaire : irriguer immédiatement au NaCl ou à l'eau.",
            "Matières dangereuses suspectées : avertir l'hôpital de destination pour la décontamination.",
          ]
        : [
            "Refroidir à l'eau tempérée 10 minutes maximum, jamais de glace.",
            "Couvrir d'un pansement stérile non adhérent ou d'un drap sec. Compresses BURNAID pour les brûlures profondes.",
            "Brûlure oculaire : irriguer immédiatement au NaCl ou à l'eau.",
            "Estimer la surface par la règle des 9 : tête 9 %, chaque bras 9 %, face avant du tronc 18 %, dos 18 %, chaque jambe 18 %, périnée 1 %.",
          ],
      detail: chim ? ["Rincer en éloignant l'eau de la peau saine ; retirer les vêtements imprégnés avant ou pendant le rinçage."] : ["La brûlure est refroidie sans frotter. Le patient est ensuite couvert pour éviter l'hypothermie."],
    },
  ];
  if (a.voies === "oui") {
    s.push({
      id: "voies", title: "Atteinte des voies aériennes",
      lines: [
        "Brûlure du visage, suie dans la bouche, voix rauque : risque d'œdème des voies aériennes.",
        "La SpO2 peut être faussement élevée en cas d'inhalation de fumée : mesurer le CO (SpCO) si possible.",
        "ALS: Contrôle avancé des voies aériennes précoce si nécessaire.",
        "ALS: NaCl 2 L IV en cas de blessure par inhalation.",
      ],
      tag: "Transport précoce",
    });
  }
  s.push({
    id: "als", title: "Soins avancés",
    lines: [
      "ALS: Monitorage cardiaque, accès intraveineux.",
      a.surface === "grande" ? "ALS: Brûlure du 2e degré ou plus de plus de 20 % de la surface : NaCl 1 L IV/IO." : "ALS: Brûlure de plus de 20 % de surface (2e degré ou plus) : NaCl 1 L IV/IO.",
      "ALS: Accès intraveineux impossible chez un patient alerte : lidocaïne 2 % 40 mg IO.",
      "ALS: Antalgie : fentanyl ou morphine selon la douleur.",
    ],
    doses: ["ALS: NaCl 0,9 % 1 L IV/IO si > 20 %", "ALS: Fentanyl 50 µg IV/IM/IN toutes les 5 min (150 µg max)"],
  });
  s.push({ id: "depart", title: "Transport", lines: ["Transport précoce pour les brûlures graves (2e ou 3e degré, visage, mains, étendue).", "Couvrir le patient, éviter le refroidissement."], tag: "Brûlure grave → départ rapide" });
  return s;
}
export const brulure: Protocol = {
  key: "brulure", title: "Brûlure", desc: "Thermique ou chimique", category: "Trauma",
  questions: [
    { id: "type", label: "Type", options: [{ id: "thermique", label: "Thermique (feu, eau chaude)" }, { id: "chimique", label: "Chimique" }] },
    { id: "surface", label: "Surface brûlée (2e degré ou plus)", options: [{ id: "petite", label: "Moins de 20 %" }, { id: "grande", label: "Plus de 20 %" }] },
    { id: "voies", label: "Visage, suie dans la bouche, voix rauque", options: [{ id: "non", label: "Non" }, { id: "oui", label: "Oui" }] },
  ],
  build: burnSteps,
  stages: [
    stage("Brûlure limitée", [92, 110], [18, 24], [120, 140], [95, 98], [0.9, 1.3], [36.2, 36.9], "2 s", 15, "Égales, réactives", "Rouge, phlyctènes, douloureuse", "Radial présent", "Normale"),
    stage("Brûlure étendue", [115, 135], [22, 28], [95, 115], [92, 96], [0.9, 1.3], [35.4, 36.2], "3 s", 14, "Égales, réactives", "Phlyctènes étendues, plaques blanches", "Radial rapide", "Rapide, voix un peu rauque"),
    stage("Choc, voies aériennes", [130, 150], [28, 36], [70, 90], [85, 92], [0.9, 1.3], [34.8, 35.6], "> 3 s", 12, "Égales, lentes", "Brûlures étendues, suie dans la bouche", "Radial filant", "Stridor, voix rauque (SpO2 parfois faussée)"),
  ],
  startStage: (a) => (a.voies === "oui" ? 2 : a.surface === "grande" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: true },
};

/* ─────────── Écrasement ─────────── */
function crushSteps(): Step[] {
  return [
    { id: "eval", title: "Évaluation et mise en sécurité", lines: ["Sécurité de la scène. Évaluation ABCD, signes vitaux. Oxygène.", "Arrêter d'abord les hémorragies (garrot si nécessaire).", "Prioriser l'immobilisation si nécessaire.", "Recouvrir la victime avec une couverture de survie.", "Demander une assistance ALS ou transporter."], doses: ["O2 15 L/min"], detail: ["Le membre écrasé reste exposé et immobilisé en position de confort, pouls et sensibilité contrôlés."] },
    {
      id: "als", title: "Soins avancés",
      lines: [
        "ALS: Contrôle avancé des voies aériennes si nécessaire. Monitorage cardiaque.",
        "ALS: Établir l'accès intraveineux. NaCl 1 L IV, à répéter une fois pour un total de 2 L.",
        "ALS: Constantes vitales toutes les 2 à 3 minutes.",
        "ALS: Hémorragie incontrôlée d'un membre malgré compression et garrot, dans les 3 heures : acide tranexamique.",
      ],
      doses: ["ALS: NaCl 0,9 % 1 L IV, puis 1 L (2 L au total)", "ALS: TXA 1 g dans 50–100 mL NaCl en 10 min"],
    },
    { id: "depart", title: "Départ", lines: ["Transport vers un centre de traumatologie, pré-alerte, transmission MIST."], tag: "Si arrêt → bouton « Arrêt cardiaque traumatique »" },
  ];
}
export const ecrasement: Protocol = {
  key: "ecrasement", title: "Blessure par écrasement", desc: "Membre ou corps coincé, écrasé", category: "Trauma",
  questions: [{ id: "etat", label: "État du patient", options: [{ id: "stable", label: "Conscient, douloureux" }, { id: "choc", label: "Pâle, tachycarde, agité" }] }],
  build: crushSteps,
  stages: [
    stage("Douleur, stable", [96, 112], [18, 24], [110, 132], [95, 98], [0.9, 1.3], [35.8, 36.6], "2 s", 15, "Égales, réactives", "Pâle, moite", "Radial présent", "Rapide"),
    stage("Choc", [120, 140], [26, 32], [80, 98], [90, 94], [0.9, 1.3], [35.2, 36.0], "3 s", 13, "Égales, réactives", "Pâle, froide, sueurs", "Radial rapide, faible", "Rapide"),
    stage("Choc sévère", [138, 158], [30, 36], [58, 78], [84, 90], [0.8, 1.2], [34.8, 35.6], "> 4 s", 9, "Dilatées, lentes", "Grise, froide", "Radial très filant", "Haletante"),
  ],
  startStage: (a) => (a.etat === "choc" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: true },
};

/* ─────────── Traumatisme crânien ─────────── */
function tcSteps(a: Answers): Step[] {
  return [
    { id: "eval", title: "Évaluation et hémorragies", lines: ["Sécurité de la scène. Hémorragies d'abord : pression directe sur les plaies du cuir chevelu ou du visage.", "Corps étranger présent : le couvrir avec une gaze humide, sans le retirer. Blessure aux yeux : pansement imbibé de NaCl.", "Immobiliser la tête et le rachis cervical (SMR).", "Demander une assistance ALS ou transporter."], detail: ["Si le saignement traverse un pansement, le recouvrir d'un second sans retirer le premier."] },
    {
      id: "o2", title: "Oxygène et ventilation",
      lines: [
        "Oxygène 15 L/min : la moindre hypoxie aggrave les lésions.",
        a.gcs === "grave" ? "Glasgow ≤ 8 : ALS: contrôle avancé des voies aériennes (i-gel)." : "ALS: Glasgow ≤ 8 : contrôle avancé des voies aériennes (i-gel).",
        "ALS: Ventiler si besoin avec une cible d'EtCO2 de 35 à 45 mmHg ; ne jamais hyperventiler.",
      ],
      doses: ["O2 15 L/min", "ALS: EtCO2 cible 35–45 mmHg"],
    },
    {
      id: "ta", title: "Tension et position",
      lines: [
        "ALS: TA systolique ≥ 90 mmHg en permanence ; l'hypotension permissive est contre-indiquée. NaCl 1 L rapide si TAS ≤ 90 mmHg.",
        "Tête relevée à 30° si la TA le permet.",
        "ALS: Prévenir les vomissements : ondansétron 4 mg.",
      ],
      doses: ["ALS: NaCl 0,9 % 1 L rapide si TAS ≤ 90", "ALS: Ondansétron 4 mg IV/IM"],
    },
    {
      id: "neuro", title: "Surveillance neurologique",
      lines: [
        "Glasgow et pupilles toutes les 5 minutes.",
        a.pupilles === "asym" ? "Pupille dilatée d'un seul côté : urgence neurochirurgicale, transport immédiat, pré-alerte." : "Une pupille dilatée d'un seul côté est une urgence neurochirurgicale.",
        "ALS: Antalgie seulement si Glasgow 15. Kétorolac interdit.",
      ],
      doses: ["ALS: Fentanyl 50 µg IV (GCS 15 seulement)"],
      detail: ["Pupilles examinées à la lampe : taille, symétrie, réactivité, notées à chaque contrôle."],
    },
    { id: "depart", title: "Transport", lines: ["Transport vers un centre de traumatologie, transmission MIST."], tag: "Si arrêt → bouton « Arrêt cardiaque traumatique »" },
  ];
}
export const traumaCranien: Protocol = {
  key: "trauma-cranien", title: "Traumatisme crânien", desc: "Choc à la tête, perte de connaissance", category: "Trauma",
  questions: [
    { id: "gcs", label: "Conscience", options: [{ id: "bon", label: "Glasgow 14–15" }, { id: "moyen", label: "Glasgow 9–13" }, { id: "grave", label: "Glasgow ≤ 8" }] },
    { id: "pupilles", label: "Pupilles", options: [{ id: "egales", label: "Égales, réactives" }, { id: "asym", label: "Asymétriques" }] },
  ],
  build: tcSteps,
  stages: [
    stage("Glasgow 14–15", [76, 92], [14, 20], [122, 145], [95, 98], [0.9, 1.3], [36.3, 37], "2 s", 15, "Égales, réactives", "Normale, plaie du cuir chevelu", "Radial présent", "Normale"),
    stage("Dégradation", [66, 84], [12, 18], [140, 165], [92, 96], [0.9, 1.4], [36.4, 37.2], "2 s", 11, "Asymétriques", "Normale", "Radial fort", "Irrégulière"),
    stage("Engagement", [44, 58], [6, 10], [170, 205], [84, 91], [0.9, 1.4], [36.4, 37.4], "2 s", 6, "Une pupille dilatée fixe", "Rouge, chaude", "Radial fort, lent", "Irrégulière"),
  ],
  startStage: (a) => (a.gcs === "grave" ? 2 : a.gcs === "moyen" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: true },
};
