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
  /** Posologies / matériel à retenir. Préfixe « ALS: » = geste ou produit avancé. */
  doses?: string[];
  /** Précisions sur ce à quoi le geste doit ressembler (sans texte RP prérédigé). */
  detail?: string[];
  /** Si présent : choix obligatoire pour continuer (ex. rythme du scope). */
  choice?: { key: string; options: Choice[] };
  /** Temps de répétition ou de réévaluation. */
  tag?: string;
};

type Answers = Record<string, string>;

/* ───────────────────────── Étapes ───────────────────────── */

export function buildSteps(s: SituationKey, a: Answers, extra: Answers): Step[] {
  const list = s === "arret" ? arretSteps(a, extra) : hemoSteps(a);
  return list.map((st) => ({ ...st, detail: DETAILS[st.id] }));
}

/** Précisions affichées sous chaque étape : à quoi le geste doit ressembler. */
const DETAILS: Record<string, string[]> = {
  constat: ["Évaluer la respiration et le pouls carotidien simultanément, 10 secondes maximum.", "Des gasps (respiration agonique, bruyante, irrégulière) ne constituent pas une respiration normale."],
  x: ["Garrot appliqué sur peau nue, quelques centimètres au-dessus de la plaie, jamais sur une articulation : serrer jusqu'à disparition du saignement.", "Pansement compressif : maintenir la compression pendant la fixation, puis contrôler l'absence de reprise du saignement."],
  rcp: ["Patient sur plan dur, thorax dénudé. Bras tendus, épaules à l'aplomb du sternum, relâchement complet entre deux compressions.", "Compter à voix haute. La relève du masseur se fait sans interrompre le rythme."],
  scope: ["Peau sèche, pilosité rasée si nécessaire. Les deux patchs ne doivent pas entrer en contact.", "BAVU : masque maintenu en C, mandibule soulevée par les trois autres doigts, insufflation jusqu'à l'élévation visible du thorax."],
  analyse: ["Pause complète du massage et aucun contact avec le patient pendant l'analyse. Le chef d'équipe annonce « analyse en cours ».", "La décision de choc est annoncée à voix haute avant la charge."],
  choc1: ["Contrôle visuel avant le choc : aucun contact avec le patient ni le brancard, source d'oxygène écartée du thorax."],
  acces: ["Garrot veineux quelques centimètres au-dessus du pli du coude. Repérer la veine antécubitale, la tapoter pour la faire saillir.", "Désinfection par friction, laisser sécher sans retoucher la zone. Cathéter de gros calibre, biseau vers le haut, angle d'environ 20°, dans l'axe de la veine.", "Au retour veineux (flashback) : abaisser l'angle, avancer de quelques millimètres, glisser le cathéter, relâcher le garrot, retirer l'aiguille dans le collecteur.", "Rincer au NaCl 10 mL en surveillant l'infiltration, fixer au Tegaderm, inscrire calibre, site et heure.", "IO : lidocaïne 2 % 40 mg en injection lente si le patient est conscient ; le rinçage doit passer sans résistance ni gonflement."],
  choc2: ["Préparer et étiqueter la seringue d'adrénaline pendant les compressions, non pendant l'analyse."],
  choc3: ["Modifier la position des patchs (antéro-postérieure) pour changer l'axe du courant.", "Dose d'amiodarone annoncée à voix haute, confirmée par un second intervenant, rinçage au NaCl après injection."],
  adr: ["Dose annoncée à voix haute, confirmée par un second intervenant, rinçage au NaCl après injection.", "Heure de chaque dose reportée sur la fiche ; la suivante est due dans 3 à 5 minutes."],
  airway: ["Capteur d'EtCO2 placé entre le dispositif et le BAVU : une courbe doit apparaître à chaque insufflation.", "Ventilation asynchrone : le masseur ne marque plus de pause pour les insufflations."],
  hht: ["Énoncer les causes à voix haute et les cocher au fur et à mesure sur la fiche."],
  reeval: ["La pause du massage pour l'analyse n'excède pas 10 secondes."],
  secu: ["Feu vert du LSPD/LSSD demandé par radio avant toute approche ; rester à couvert jusqu'à confirmation.", "Se présenter au patient dès l'abord, même en l'absence de réponse."],
  dress: ["Découper les vêtements aux ciseaux traumatiques, du bas vers le haut, sans traction sur les plaies.", "Glisser la main sous le patient pour rechercher les saignements dorsaux ; inspecter cuir chevelu, aisselles et périnée."],
  ab: ["Masque haute concentration : ballon réservoir gonflé avant application, débit 15 L/min.", "Comparer l'ampliation des deux hémithorax."],
  c: ["Garrot veineux posé sur le bras opposé à la plaie principale. Voie de gros calibre, fixation au Tegaderm, calibre, site et heure inscrits.", "Bolus en poche pressurisée, pouls radial contrôlé après chaque bolus ; interrompre dès que la cible est atteinte."],
  d: ["AVPU ou Glasgow. Pupilles examinées à la lampe : taille, symétrie, réactivité."],
  e: ["La couverture de survie enveloppe le patient sans recouvrir ni masquer les pansements et garrots."],
  antalgie: ["Titration lente, douleur réévaluée (0 à 10) après chaque dose."],
  depart: ["Brancardage à quatre, garrots et pansements restant visibles pendant le transport.", "Fiche complétée : heure de pose des garrots, voies, volumes perfusés."],
};

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
        "ALS: Voie veineuse périphérique, bras en priorité.",
        "ALS: Deux essais ou 90 secondes sans succès : intra-osseuse. Tibia proximal (deux doigts sous la tubérosité, face interne), à défaut humérus proximal.",
        "ALS: Aiguille à 90°, percer jusqu'à la perte de résistance, retirer le mandrin, rincer 10 mL de NaCl, fixer.",
      ],
    });
    steps.push({
      id: "choc2", title: "Analyse, choc n°2 et adrénaline",
      lines: [
        "Analyser le rythme. Toujours chocable : 300 J.",
        "Choc, puis reprise immédiate du massage.",
        "ALS: Injecter l'adrénaline en IV/IO direct, puis rincer au NaCl.",
      ],
      doses: ["Choc 300 J", "ALS: Adrénaline 1 mg (0,1 mg/mL) IV/IO, puis toutes les 3–5 min, 3 mg maximum"],
      tag: "Adrénaline puis /3–5 min",
    });
    steps.push({
      id: "choc3", title: "Analyse, choc n°3 et amiodarone",
      lines: [
        "Analyser le rythme. Toujours chocable : 360 J, changer la position des patchs.",
        "Choc, reprise du massage.",
        "ALS: Injecter l'amiodarone en IV/IO.",
      ],
      doses: ["Choc 360 J", "ALS: Amiodarone 300 mg IV/IO, puis 150 mg (450 mg maximum)"],
    });
  } else {
    steps.push({
      id: "adr", title: r === "asy" ? "Asystolie : adrénaline sans attendre" : "AESP : adrénaline sans attendre",
      lines: [
        "Reprise immédiate du massage, on ne choque pas.",
        "ALS: Poser la voie veineuse (ou intra-osseuse après deux essais / 90 secondes).",
        "ALS: Injecter l'adrénaline dès que possible, puis rincer.",
        "ALS: NaCl 0,9 % 1 L en perfusion rapide, à répéter une fois si besoin.",
      ],
      doses: ["ALS: Adrénaline 1 mg (0,1 mg/mL) IV/IO, puis toutes les 3–5 min, 3 mg maximum", "ALS: NaCl 0,9 % 1 L rapide (2 L en tout si hémorragie)"],
      tag: "Adrénaline /3–5 min",
    });
  }
  steps.push({
    id: "airway", title: "Voies aériennes avancées",
    lines: [
      "ALS: Dispositif supraglottique i-gel, premier choix en arrêt cardiaque : adulte moyen (50–90 kg) taille 4, grand adulte taille 5, petit adulte taille 3.",
      "ALS: Lubrifier la face arrière, glisser le long du palais jusqu'à la résistance, raccorder le BAVU.",
      "ALS: Brancher le capteur d'EtCO2, confirmer la ventilation.",
      "ALS: Passer à 1 insufflation toutes les 6 secondes, massage continu.",
    ],
    doses: ["ALS: EtCO2 > 10 mmHg : massage efficace ; < 10 : améliorer le massage"],
  });
  steps.push({
    id: "hht", title: "Causes réversibles (4H / 4T)",
    lines: trauma
      ? [
          "ALS: Décompression à l'aiguille des deux côtés en cas de traumatisme thoracique.",
          "ALS: En route : deux voies veineuses de gros calibre ou IO, NaCl 2 L en perfusion rapide.",
          "Rythme chocable en trauma pénétrant : défibriller mais partir immédiatement.",
        ]
      : [
          "ALS: Hypoxie, hypovolémie, hypo/hyperkaliémie, hypothermie.",
          "ALS: Pneumothorax suffocant, tamponnade, thrombose (cœur, poumon), toxiques.",
          "ALS: Glycémie capillaire, traiter la cause trouvée.",
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
      "Attendre le feu vert du LSPD/LSSD avant d'approcher le blessé.",
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
      "Mettre les vêtements de côté pour le LSPD/LSSD (preuves).",
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
      "ALS: Poser deux voies veineuses de gros calibre (16G ou 18G).",
      "ALS: Deux essais ou 90 secondes sans succès : intra-osseuse au tibia proximal.",
      a.meca === "autre"
        ? "ALS: Objectif : pouls radial présent et patient conscient. Traumatisme fermé : TA systolique ≥ 90 mmHg, NaCl 250 mL rapide puis contact OLMC."
        : "ALS: Trauma pénétrant, patient conscient : hypotension permissive. Objectif pouls radial présent, TA systolique ≥ 70 mmHg.",
      a.meca === "autre" ? "ALS: Réévaluer après le bolus." : "ALS: Bolus de NaCl 250 mL seulement si la cible n'est pas atteinte, réévaluer après chaque bolus.",
      "ALS: Ne pas chercher une tension normale : trop de liquide dilue la coagulation et fait resaigner.",
    ],
    doses: ["ALS: NaCl 0,9 % bolus 250 mL", "ALS: Acide tranexamique 1 g dans 50–100 mL de NaCl en 10 min (blessure < 3 h et TAS < 90, ou FC > TAS, ou hémorragie non contrôlée)"],
    tag: "Réévaluer à chaque bolus",
  });
  steps.push({
    id: "d", title: "D : neurologique",
    lines: [
      "Score AVPU / Glasgow, pupilles.",
      "Glycémie capillaire.",
      "ALS: Glasgow ≤ 8 : contrôle avancé des voies aériennes (i-gel).",
    ],
  });
  steps.push({
    id: "e", title: "E : protéger du froid",
    lines: ["Couvrir avec une couverture de survie, limiter le temps de déshabillage, ambulance chauffée."],
  });
  steps.push({
    id: "antalgie", title: "Antalgie",
    lines: ["ALS: Patient conscient et TA suffisante : antalgie par titration, réévaluer la douleur après chaque dose."],
    doses: ["ALS: Fentanyl 50 µg IV toutes les 5 min (150 µg max)", "ALS: Morphine 4 mg IV toutes les 5 min (12 mg max)"],
  });
  steps.push({
    id: "depart", title: "Départ et transmission",
    lines: [
      "Temps total sur place inférieur à 10 minutes pour un traumatisé grave.",
      "Transport vers un centre de traumatologie, pré-alerte de l'hôpital.",
      "Transmission MIST : Mécanisme, lésions (Injuries), Signes vitaux, Traitements.",
      "Remettre les vêtements au LSPD/LSSD.",
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
  { label: "Pré-arrêt", fc: [40, 55], fr: [6, 10], tas: [40, 58], spo2: [70, 84], gly: [0.8, 1.2], temp: [34.5, 35.2], trc: "> 5 s", gcs: 6, pupilles: "Dilatées, peu réactives", peau: "Cireuse, glacée", pouls: "Radial à peine perceptible, carotidien présent mais filant", resp: "Gasps irréguliers" },
];

export const ARREST_STAGES: Stage[] = [
  { label: "Arrêt, massage en cours", fc: [0, 0], fr: [0, 0], tas: [0, 0], spo2: [0, 0], gly: [0.7, 1.4], temp: [35.8, 36.8], etco2: [14, 26], trc: "Non mesurable", gcs: 3, pupilles: "Dilatées, aréactives", peau: "Pâle à cyanosée, froide", pouls: "Carotidien absent, pouls perçu = massage", resp: "Apnée (gasps éventuels)" },
  { label: "Retour à la circulation", fc: [96, 122], fr: [10, 12], tas: [78, 98], spo2: [88, 94], gly: [0.8, 1.6], temp: [35.4, 36.4], etco2: [34, 44], trc: "3 s", gcs: 5, pupilles: "Moyennes, réactives lentes", peau: "Pâle, moite", pouls: "Carotidien présent, radial faible", resp: "Ventilé au BAVU" },
  { label: "Stabilisé", fc: [84, 104], fr: [10, 12], tas: [100, 126], spo2: [94, 98], gly: [0.9, 1.4], temp: [35.8, 36.6], etco2: [35, 45], trc: "2 s", gcs: 7, pupilles: "Égales, réactives", peau: "Rosée, sèche", pouls: "Radial présent", resp: "Ventilé, thorax symétrique" },
];

export type Vitals = { fc: string; fr: string; ta: string; spo2: string; gly: string; temp: string; etco2: string | null; trc: string; gcs: string; pupilles: string; peau: string; pouls: string; resp: string; label: string; tasHi: number; spo2Hi: number; etco2Hi: number | null };

/** Plages typiques du stade (le patient est considéré en vie sauf en arrêt cardiaque). */
export function measure(stage: Stage): Vitals {
  const arrest = stage.fc[1] === 0;
  const rg = (r: Rng, dec = 0) => {
    const f = (v: number) => (dec ? v.toFixed(dec).replace(".", ",") : String(Math.round(v)));
    return r[0] === r[1] ? f(r[0]) : `${f(r[0])} à ${f(r[1])}`;
  };
  const tad: Rng = [Math.round(stage.tas[0] * 0.58), Math.round(stage.tas[1] * 0.62)];
  return {
    fc: arrest ? "—" : rg(stage.fc),
    fr: arrest ? "0" : rg(stage.fr),
    ta: arrest ? "Imprenable" : `${rg(stage.tas)} / ${rg(tad)}`,
    spo2: arrest ? "Non mesurable" : rg(stage.spo2),
    gly: rg(stage.gly, 2),
    temp: rg(stage.temp, 1),
    etco2: stage.etco2 ? rg(stage.etco2) : null,
    trc: stage.trc, gcs: String(stage.gcs), pupilles: stage.pupilles, peau: stage.peau, pouls: stage.pouls, resp: stage.resp, label: stage.label,
    tasHi: stage.tas[1], spo2Hi: stage.spo2[1], etco2Hi: stage.etco2 ? stage.etco2[1] : null,
  };
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

/** Niveau d'une ligne : « ALS: » en tête = geste ou produit avancé (réservé aux medics formés). */
export const isAls = (l: string) => l.startsWith("ALS:");
export const stripAls = (l: string) => l.replace(/^ALS:\s*/, "");
export type Level = "BLS" | "ALS" | "MIX";
export function stepLevel(st: Step): Level {
  const n = st.lines.filter(isAls).length;
  return n === 0 ? "BLS" : n === st.lines.length ? "ALS" : "MIX";
}
/** Étapes affichées en mode « BLS seul » : on retire les lignes, doses et étapes avancées. */
export function onlyBls(steps: Step[]): Step[] {
  return steps
    .filter((st) => stepLevel(st) !== "ALS")
    .map((st) => ({ ...st, lines: st.lines.filter((l) => !isAls(l)), doses: st.doses?.filter((d) => !isAls(d)) }));
}
