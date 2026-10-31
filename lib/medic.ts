/**
 * RAPID LS County Medic : contenu et logique (100 % client, sans base de données).
 * Source : « Protocoles et Procédures Paramédic » (Los Santos EMS Agency, v2). Aide RP à valider par vos medics.
 */

export type SituationKey = "arret" | "hemorragie";
export type Choice = { id: string; label: string; hint?: string };
export type Question = { id: string; label: string; options: Choice[] };

export const SITUATIONS: { key: SituationKey; title: string; desc: string }[] = [
  { key: "arret", title: "Arrêt cardiaque", desc: "Adulte · médical ou traumatique" },
  { key: "hemorragie", title: "Hémorragie / plaie par balle", desc: "Balle, arme blanche, hémorragie externe" },
];

export const QUESTIONS: Record<SituationKey, Question[]> = {
  arret: [
    { id: "cause", label: "Cause probable", options: [{ id: "med", label: "Médicale / inconnue" }, { id: "trauma", label: "Traumatique (balle, accident…)" }] },
    { id: "wit", label: "Arrêt vu par un témoin", options: [{ id: "oui", label: "Oui" }, { id: "non", label: "Non / inconnu" }] },
  ],
  hemorragie: [
    { id: "meca", label: "Mécanisme", options: [{ id: "balle", label: "Plaie par balle" }, { id: "blanche", label: "Arme blanche" }, { id: "autre", label: "Autre plaie" }] },
    { id: "loc", label: "Siège de la plaie principale", options: [{ id: "membre", label: "Membre" }, { id: "jonction", label: "Jonction (aine, aisselle, cou)" }, { id: "tronc", label: "Tronc / abdomen" }, { id: "thorax", label: "Thorax" }] },
    { id: "conscience", label: "Conscience du patient", options: [{ id: "alerte", label: "Alerte, parle" }, { id: "confus", label: "Agité / confus / somnolent" }, { id: "inconscient", label: "Ne répond plus" }] },
    { id: "radial", label: "Pouls radial", options: [{ id: "present", label: "Présent, bien frappé" }, { id: "faible", label: "Rapide et faible" }, { id: "absent", label: "Absent" }] },
    { id: "saigne", label: "Saignement au contact", options: [{ id: "abondant", label: "Abondant / jet" }, { id: "modere", label: "Modéré" }] },
  ],
};

export type Step = {
  id: string;
  title: string;
  /** Manœuvres lues telles quelles par le paramedic. */
  lines: string[];
  /** Posologies / matériel à retenir. */
  doses?: string[];
  /** Si présent : choix obligatoire pour continuer (ex. rythme du scope). */
  choice?: { key: string; options: Choice[] };
  /** Temps de répétition ou de réévaluation. */
  tag?: string;
};

type Answers = Record<string, string>;

/* ───────────────────────── Étapes ───────────────────────── */

export function buildSteps(s: SituationKey, a: Answers, extra: Answers): Step[] {
  return s === "arret" ? arretSteps(a, extra) : hemoSteps(a);
}

function arretSteps(a: Answers, x: Answers): Step[] {
  const trauma = a.cause === "trauma";
  const steps: Step[] = [];
  steps.push({
    id: "constat", title: "Constat de l'arrêt",
    lines: [
      "Sécurité de la scène, gants, tenue de protection.",
      "Stimuler le patient et l'appeler fort : aucune réaction.",
      "Ouvrir les voies aériennes, regarder le thorax pendant 10 secondes : pas de respiration normale (gasps possibles).",
      "Palper le pouls carotidien pendant 10 secondes maximum : absent.",
      "Annoncer l'heure de l'arrêt et noter-la sur la fiche.",
    ],
  });
  if (trauma) {
    steps.push({
      id: "x", title: "X : arrêter les hémorragies d'abord",
      lines: [
        "Repérer les hémorragies massives, déshabiller le patient.",
        "Membre : garrot haut et serré, jamais sur une articulation, noter l'heure de pose.",
        "Jonction : méchage avec pansement hémostatique et compression 3 minutes.",
        "Tronc : pansement compressif.",
      ],
      tag: "Avant le massage",
    });
  }
  steps.push({
    id: "rcp", title: "Massage cardiaque immédiat",
    lines: [
      "Patient sur plan dur, thorax dénudé.",
      "Talon de la main au milieu du thorax, bras tendus, épaules à l'aplomb.",
      "Compressions à 100–120 par minute, enfoncement de 5 à 6 cm, thorax relâché complètement.",
      "Rapport 30 compressions / 2 insufflations. Interruptions de moins de 10 secondes.",
      "Changer de masseur toutes les 2 minutes.",
    ],
    tag: "Cycles de 2 min",
  });
  steps.push({
    id: "scope", title: "Scope, oxygène, répartition des rôles",
    lines: [
      "Poser les patchs en antéro-latéral : sous la clavicule droite et sous l'aisselle gauche.",
      "BAVU raccordé à l'oxygène 15 L/min, canule oropharyngée de Guedel si pas de réflexe nauséeux (taille : commissure des lèvres → lobe de l'oreille).",
      "Un compte à voix haute pour éviter l'hyperventilation.",
      "Rôles : un chef d'équipe, deux masseurs, un voies aériennes, un accès veineux / médicaments, un scribe qui chronomètre.",
    ],
    doses: ["O2 15 L/min au BAVU"],
  });
  steps.push({
    id: "analyse", title: "Analyse du rythme",
    lines: [
      "Interrompre le massage uniquement pour l'analyse, regarder le tracé.",
      "Ligne plate : vérifier d'abord le patient, les câbles, le gain, une autre dérivation.",
      "Annoncer le rythme à voix haute.",
    ],
    choice: { key: "rythme", options: [
      { id: "fv", label: "FV / TV sans pouls", hint: "Chocable" },
      { id: "asy", label: "Asystolie", hint: "Non chocable" },
      { id: "aesp", label: "AESP", hint: "Non chocable" },
    ] },
  });

  const r = x.rythme;
  if (r === "fv") {
    steps.push({
      id: "choc1", title: "Choc n°1",
      lines: [
        "Charger le défibrillateur pendant le massage : 200 J biphasique.",
        "Annoncer « Tout le monde s'écarte », vérifier que personne ne touche le patient ni le brancard.",
        "Délivrer le choc, reprendre immédiatement le massage 2 minutes, sans vérifier le pouls.",
      ],
      doses: ["Choc 200 J"],
    });
    steps.push({
      id: "acces", title: "Accès vasculaire",
      lines: [
        "Voie veineuse périphérique, bras en priorité.",
        "Deux essais ou 90 secondes sans succès : intra-osseuse. Tibia proximal (deux doigts sous la tubérosité, face interne), à défaut humérus proximal.",
        "Aiguille à 90°, percer jusqu'à la perte de résistance, retirer le mandrin, rincer 10 mL de NaCl, fixer.",
      ],
    });
    steps.push({
      id: "choc2", title: "Analyse, choc n°2 et adrénaline",
      lines: [
        "Analyser le rythme. Toujours chocable : 300 J.",
        "Choc, puis reprise immédiate du massage.",
        "Injecter l'adrénaline en IV/IO direct, puis rincer au NaCl.",
      ],
      doses: ["Choc 300 J", "Adrénaline 1 mg (0,1 mg/mL) IV/IO, puis toutes les 3–5 min, 3 mg maximum"],
      tag: "Adrénaline puis /3–5 min",
    });
    steps.push({
      id: "choc3", title: "Analyse, choc n°3 et amiodarone",
      lines: [
        "Analyser le rythme. Toujours chocable : 360 J, changer la position des patchs.",
        "Choc, reprise du massage.",
        "Injecter l'amiodarone en IV/IO.",
      ],
      doses: ["Choc 360 J", "Amiodarone 300 mg IV/IO, puis 150 mg (450 mg maximum)"],
    });
  } else {
    steps.push({
      id: "adr", title: r === "asy" ? "Asystolie : adrénaline sans attendre" : "AESP : adrénaline sans attendre",
      lines: [
        "Reprise immédiate du massage, on ne choque pas.",
        "Poser la voie veineuse (ou intra-osseuse après deux essais / 90 secondes).",
        "Injecter l'adrénaline dès que possible, puis rincer.",
        "NaCl 0,9 % 1 L en perfusion rapide, à répéter une fois si besoin.",
      ],
      doses: ["Adrénaline 1 mg (0,1 mg/mL) IV/IO, puis toutes les 3–5 min, 3 mg maximum", "NaCl 0,9 % 1 L rapide (2 L en tout si hémorragie)"],
      tag: "Adrénaline /3–5 min",
    });
  }
  steps.push({
    id: "airway", title: "Voies aériennes avancées",
    lines: [
      "Dispositif supraglottique i-gel, premier choix en arrêt cardiaque : adulte moyen (50–90 kg) taille 4, grand adulte taille 5, petit adulte taille 3.",
      "Lubrifier la face arrière, glisser le long du palais jusqu'à la résistance, raccorder le BAVU.",
      "Brancher le capteur d'EtCO2, confirmer la ventilation.",
      "Passer à 1 insufflation toutes les 6 secondes, massage continu.",
    ],
    doses: ["EtCO2 > 10 mmHg : massage efficace ; < 10 : améliorer le massage"],
  });
  steps.push({
    id: "hht", title: "Causes réversibles (4H / 4T)",
    lines: trauma
      ? [
          "Décompression à l'aiguille des deux côtés en cas de traumatisme thoracique.",
          "En route : deux voies veineuses de gros calibre ou IO, NaCl 2 L en perfusion rapide.",
          "Rythme chocable en trauma pénétrant : défibriller mais partir immédiatement.",
        ]
      : [
          "Hypoxie, hypovolémie, hypo/hyperkaliémie, hypothermie.",
          "Pneumothorax suffocant, tamponnade, thrombose (cœur, poumon), toxiques.",
          "Glycémie capillaire, traiter la cause trouvée.",
        ],
  });
  steps.push({
    id: "reeval", title: "Réévaluation toutes les 2 minutes",
    lines: [
      "À chaque analyse : rythme, puis pouls carotidien seulement si le tracé est organisé.",
      "Poursuivre selon le rythme tant qu'il n'y a pas de retour à la circulation spontanée.",
      "Ne pas commencer ni poursuivre la réanimation devant des signes évidents de décès, ou après décision du médecin régulateur (OLMC).",
    ],
    tag: "Si retour de pouls → bouton « Retour à la circulation »",
  });
  return steps;
}

function hemoSteps(a: Answers): Step[] {
  const steps: Step[] = [];
  steps.push({
    id: "secu", title: "Sécurité",
    lines: [
      "Attendre le feu vert du LSPD avant d'approcher le blessé.",
      "Gants, lunettes, tenue de protection. Repérer le nombre de victimes.",
    ],
  });
  const loc = a.loc;
  const x: string[] = ["Compression directe ferme, à pleine main, sur la plaie."];
  if (loc === "membre") {
    x.push("Saignement abondant : poser un garrot haut et serré au-dessus de la plaie, jamais sur une articulation, serrer jusqu'à l'arrêt du saignement.");
    x.push("Noter l'heure de pose sur le garrot et sur la fiche. Ne jamais le desserrer sur le terrain.");
    x.push("Saignement persistant : deuxième garrot juste au-dessus du premier.");
  } else if (loc === "jonction") {
    x.push("Plaie de jonction : méchage de la plaie avec un pansement hémostatique, compression maintenue 3 minutes.");
    x.push("Puis pansement compressif.");
  } else if (loc === "tronc") {
    x.push("Plaie du tronc : pansement compressif.");
    x.push("Ne pas retirer un objet planté : le stabiliser.");
  } else {
    x.push("Plaie thoracique : pansement occlusif.");
    x.push("Surveiller la respiration à chaque réévaluation (risque de pneumothorax sous tension).");
  }
  steps.push({ id: "x", title: "X : arrêter l'hémorragie", lines: x, tag: "Tout de suite" });
  steps.push({
    id: "dress", title: "Déshabiller et chercher les autres plaies",
    lines: [
      "Couper les vêtements en évitant les trous de balle.",
      "Chercher orifices d'entrée ET de sortie : dos, aisselles, périnée, cuir chevelu. Le trajet d'une balle est imprévisible.",
      "Ne pas se focaliser sur la plaie spectaculaire : chercher l'autre.",
      "Mettre les vêtements de côté pour le LSPD (preuves).",
    ],
  });
  steps.push({
    id: "ab", title: "A et B : voies aériennes et respiration",
    lines: [
      "Parler au patient, vérifier la liberté des voies aériennes.",
      "Observer et écouter le thorax : fréquence, symétrie, bruits.",
      "SpO2 : si < 94 %, masque haute concentration à 15 L/min. Sinon pas d'oxygène.",
      "Ventiler au BAVU si la respiration est inefficace.",
    ],
    doses: ["O2 15 L/min si SpO2 < 94 % ou choc"],
  });
  steps.push({
    id: "c", title: "C : accès vasculaire et remplissage prudent",
    lines: [
      "Poser deux voies veineuses de gros calibre (16G ou 18G).",
      "Deux essais ou 90 secondes sans succès : intra-osseuse au tibia proximal.",
      a.meca === "autre"
        ? "Objectif : pouls radial présent et patient conscient. Traumatisme fermé : TA systolique ≥ 90 mmHg, NaCl 250 mL rapide puis contact OLMC."
        : "Trauma pénétrant, patient conscient : hypotension permissive. Objectif pouls radial présent, TA systolique ≥ 70 mmHg.",
      a.meca === "autre" ? "Réévaluer après le bolus." : "Bolus de NaCl 250 mL seulement si la cible n'est pas atteinte, réévaluer après chaque bolus.",
      "Ne pas chercher une tension normale : trop de liquide dilue la coagulation et fait resaigner.",
    ],
    doses: ["NaCl 0,9 % bolus 250 mL", "Acide tranexamique 1 g dans 50–100 mL de NaCl en 10 min (blessure < 3 h et TAS < 90, ou FC > TAS, ou hémorragie non contrôlée)"],
    tag: "Réévaluer à chaque bolus",
  });
  steps.push({
    id: "d", title: "D : neurologique",
    lines: [
      "Score AVPU / Glasgow, pupilles.",
      "Glycémie capillaire.",
      "Glasgow ≤ 8 : contrôle avancé des voies aériennes (i-gel).",
    ],
  });
  steps.push({
    id: "e", title: "E : protéger du froid, antalgie",
    lines: [
      "Couvrir avec une couverture de survie, limiter le temps de déshabillage, ambulance chauffée.",
      "Patient conscient et TA suffisante : antalgie par titration.",
    ],
    doses: ["Fentanyl 50 µg IV toutes les 5 min (150 µg max)", "Morphine 4 mg IV toutes les 5 min (12 mg max)"],
  });
  steps.push({
    id: "depart", title: "Départ et transmission",
    lines: [
      "Temps total sur place inférieur à 10 minutes pour un traumatisé grave.",
      "Transport vers un centre de traumatologie, pré-alerte de l'hôpital.",
      "Transmission MIST : Mécanisme, lésions (Injuries), Signes vitaux, Traitements.",
      "Remettre les vêtements au LSPD.",
    ],
  });
  steps.push({
    id: "reeval", title: "Réévaluation toutes les 5 minutes",
    lines: [
      "Contrôler les garrots et les pansements : saignement repris ?",
      "Constantes complètes, pouls radial, conscience, respiration.",
      "Si le patient bascule en arrêt : massage, hémorragies déjà contrôlées, décompression des deux côtés, NaCl 2 L en route.",
    ],
    tag: "Si arrêt → bouton « Arrêt cardiaque »",
  });
  return steps;
}

/* ───────────────────────── Constantes ───────────────────────── */

type Rng = [number, number];
type Stage = {
  label: string;
  fc: Rng; fr: Rng; tas: Rng; spo2: Rng; gly: Rng; temp: Rng; etco2?: Rng;
  trc: string; gcs: number; pupilles: string; peau: string; pouls: string; resp: string;
};

export const HEMO_STAGES: Stage[] = [
  { label: "Compensé", fc: [98, 112], fr: [18, 22], tas: [112, 130], spo2: [95, 98], gly: [0.9, 1.2], temp: [36.2, 36.8], trc: "2 s", gcs: 15, pupilles: "Égales, réactives", peau: "Pâle, un peu moite", pouls: "Radial présent, rapide", resp: "Rapide, superficielle" },
  { label: "Choc modéré", fc: [118, 136], fr: [24, 28], tas: [85, 100], spo2: [92, 95], gly: [0.9, 1.2], temp: [35.6, 36.2], trc: "3 s", gcs: 14, pupilles: "Égales, réactives", peau: "Pâle, froide, sueurs", pouls: "Radial rapide et faible", resp: "Rapide, patient agité" },
  { label: "Choc sévère", fc: [140, 158], fr: [30, 36], tas: [60, 80], spo2: [86, 91], gly: [0.8, 1.2], temp: [35, 35.6], trc: "> 4 s", gcs: 10, pupilles: "Dilatées, réactives lentes", peau: "Grise, froide, marbrée", pouls: "Radial très filant, fémoral présent", resp: "Haletante" },
  { label: "Pré-arrêt", fc: [38, 52], fr: [6, 9], tas: [40, 58], spo2: [70, 84], gly: [0.8, 1.2], temp: [34.5, 35.2], trc: "> 5 s", gcs: 6, pupilles: "Dilatées, peu réactives", peau: "Cireuse, glacée", pouls: "Radial absent, carotide faible", resp: "Gasps irréguliers" },
];

export const ARREST_STAGES: Stage[] = [
  { label: "Arrêt, massage en cours", fc: [0, 0], fr: [0, 0], tas: [0, 0], spo2: [0, 0], gly: [0.7, 1.4], temp: [35.8, 36.8], etco2: [14, 26], trc: "Non mesurable", gcs: 3, pupilles: "Dilatées, aréactives", peau: "Pâle à cyanosée, froide", pouls: "Carotidien absent, pouls perçu = massage", resp: "Apnée (gasps éventuels)" },
  { label: "Retour à la circulation", fc: [96, 122], fr: [10, 12], tas: [78, 98], spo2: [88, 94], gly: [0.8, 1.6], temp: [35.4, 36.4], etco2: [34, 44], trc: "3 s", gcs: 5, pupilles: "Moyennes, réactives lentes", peau: "Pâle, moite", pouls: "Carotidien présent, radial faible", resp: "Ventilé au BAVU" },
  { label: "Stabilisé", fc: [84, 104], fr: [10, 12], tas: [100, 126], spo2: [94, 98], gly: [0.9, 1.4], temp: [35.8, 36.6], etco2: [35, 45], trc: "2 s", gcs: 7, pupilles: "Égales, réactives", peau: "Rosée, sèche", pouls: "Radial présent", resp: "Ventilé, thorax symétrique" },
];

function mulberry(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type Vitals = { fc: string; fr: string; ta: string; spo2: string; gly: string; temp: string; etco2: string | null; trc: string; gcs: string; pupilles: string; peau: string; pouls: string; resp: string; label: string };

export function measure(stage: Stage, seed: number, n: number): Vitals {
  const rnd = mulberry(seed * 131 + n * 7919 + 17);
  const pick = (r: Rng, dec = 0) => { const v = r[0] + (r[1] - r[0]) * rnd(); return dec ? v.toFixed(dec).replace(".", ",") : String(Math.round(v)); };
  const arrest = stage.fc[1] === 0;
  const tas = arrest ? 0 : Math.round(stage.tas[0] + (stage.tas[1] - stage.tas[0]) * rnd());
  const tad = Math.max(20, Math.round(tas * (0.55 + rnd() * 0.1)));
  return {
    fc: arrest ? "—" : pick(stage.fc),
    fr: arrest ? "0" : pick(stage.fr),
    ta: arrest ? "Imprenable" : `${tas}/${tad}`,
    spo2: arrest ? "Non mesurable" : pick(stage.spo2),
    gly: pick(stage.gly, 2),
    temp: pick(stage.temp, 1),
    etco2: stage.etco2 ? pick(stage.etco2) : null,
    trc: stage.trc, gcs: String(stage.gcs), pupilles: stage.pupilles, peau: stage.peau, pouls: stage.pouls, resp: stage.resp, label: stage.label,
  };
}

/** Phrase prête à annoncer en OOC pour un joueur absent ou qui ne réagit pas. */
export function oocAnnounce(v: Vitals): string {
  const parts = [
    v.fc !== "—" ? `FC ${v.fc}/min` : "pouls absent",
    v.ta === "Imprenable" ? "TA imprenable" : `TA ${v.ta} mmHg`,
    v.spo2 === "Non mesurable" ? "SpO2 non mesurable" : `SpO2 ${v.spo2} %`,
    `FR ${v.fr}/min`,
    `Glasgow ${v.gcs}`,
    `glycémie ${v.gly} g/L`,
  ];
  if (v.etco2) parts.push(`EtCO2 ${v.etco2} mmHg`);
  return `(( Constantes : ${parts.join(", ")}. ${v.peau}. Pupilles : ${v.pupilles.toLowerCase()}. ${v.resp}. ))`;
}

/** Stade de départ de l'hémorragie d'après les réponses (0 = compensé … 3 = pré-arrêt). */
export function hemoStartStage(a: Answers): number {
  let s = 0;
  if (a.conscience === "confus") s += 1;
  if (a.conscience === "inconscient") s += 2;
  if (a.radial === "faible") s += 1;
  if (a.radial === "absent") s += 2;
  if (a.saigne === "abondant") s += 1;
  return Math.min(3, Math.floor(s / 2));
}
