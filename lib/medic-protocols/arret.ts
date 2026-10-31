import { stage, type Answers, type Protocol, type Step } from "../medic-types";

function steps(a: Answers, x: Answers): Step[] {
  const trauma = a.cause === "trauma";
  const s: Step[] = [];
  s.push({
    id: "constat", title: "Constat de l'arrêt",
    lines: [
      "Sécurité de la scène, gants, tenue de protection.",
      "Stimuler le patient et l'appeler fort : aucune réaction.",
      "Ouvrir les voies aériennes, regarder le thorax pendant 10 secondes : pas de respiration normale (gasps possibles).",
      "Palper le pouls carotidien 10 secondes maximum : absent.",
      "Annoncer l'heure de l'arrêt et la noter sur la fiche.",
      "Demander une assistance ALS et poursuivre la procédure en l'attendant.",
    ],
    detail: ["Évaluer la respiration et le pouls carotidien simultanément, 10 secondes maximum.", "Des gasps (respiration agonique, bruyante, irrégulière) ne constituent pas une respiration normale."],
  });
  if (trauma) {
    s.push({
      id: "x", title: "X : arrêter les hémorragies d'abord",
      lines: [
        "Repérer les hémorragies massives, déshabiller le patient.",
        "Membre : garrot à 5 à 7 cm au-dessus de la plaie, jamais sur une articulation, noter l'heure de pose.",
        "Jonction : méchage avec pansement hémostatique et compression 3 minutes.",
        "Tronc : pansement compressif.",
      ],
      tag: "Avant le massage",
      detail: ["Garrot appliqué sur peau nue, serré jusqu'à disparition du saignement. Le membre reste exposé.", "Pansement compressif : maintenir la compression pendant la fixation, puis contrôler l'absence de reprise du saignement."],
    });
  }
  s.push({
    id: "rcp", title: "Massage cardiaque immédiat",
    lines: [
      "Patient sur plan dur, thorax dénudé.",
      "Talon de la main au milieu du thorax, bras tendus, épaules à l'aplomb.",
      "Compressions à 100–120 par minute, enfoncement de 5 à 6 cm, thorax relâché complètement.",
      "Rapport 30 compressions / 2 insufflations. Interruptions de moins de 10 secondes.",
      "Changer de masseur toutes les 2 minutes.",
    ],
    tag: "Cycles de 2 min",
    detail: ["Patient sur plan dur, thorax dénudé. Bras tendus, épaules à l'aplomb du sternum, relâchement complet entre deux compressions.", "Compter à voix haute. La relève du masseur se fait sans interrompre le rythme."],
  });
  s.push({
    id: "scope", title: "Oxygène, DAE, répartition des rôles",
    lines: [
      "BAVU raccordé à l'oxygène 15 L/min ; canule de Guedel si pas de réflexe nauséeux (taille : commissure des lèvres → lobe de l'oreille).",
      "Se munir du DAE et l'allumer, sans interrompre les compressions.",
      "Patchs sur le torse nu en antéro-latéral : sous la clavicule droite et sous l'aisselle gauche. Connecter, suivre les consignes vocales.",
      "ALS: Transition du DAE vers le moniteur LIFEPAK 15, sans interrompre le massage.",
      "Rôles : un chef d'équipe, deux masseurs, un voies aériennes, un accès veineux / médicaments, un scribe qui chronomètre.",
    ],
    doses: ["O2 15 L/min au BAVU"],
    detail: ["Peau sèche, pilosité rasée si nécessaire. Les deux patchs ne doivent pas entrer en contact.", "BAVU : masque maintenu en C, mandibule soulevée par les trois autres doigts, insufflation jusqu'à l'élévation visible du thorax."],
  });
  s.push({
    id: "analyse", title: "Analyse du rythme",
    lines: [
      "Interrompre le massage uniquement pour l'analyse.",
      "ALS: Lire le tracé. Ligne plate : vérifier d'abord le patient, les câbles, le gain, une autre dérivation.",
      "Annoncer le résultat à voix haute.",
    ],
    choice: { key: "rythme", options: [
      { id: "fv", label: "FV / TV sans pouls", hint: "Choc conseillé" },
      { id: "asy", label: "Asystolie", hint: "Pas de choc" },
      { id: "aesp", label: "AESP", hint: "Pas de choc" },
    ] },
    detail: ["Pause complète du massage et aucun contact avec le patient pendant l'analyse. Le chef d'équipe annonce « analyse en cours ».", "La décision de choc est annoncée à voix haute avant la charge."],
  });
  const r = x.rythme;
  if (r === "fv") {
    s.push({
      id: "choc1", title: "Choc n°1",
      lines: [
        "Annoncer « Tout le monde s'écarte », vérifier que personne ne touche le patient ni le brancard.",
        "Délivrer le choc (DAE : à l'annonce « choc conseillé »).",
        "Reprendre immédiatement le massage 2 minutes, sans vérifier le pouls.",
        "ALS: Défibrillation manuelle : charger pendant le massage, énergie maximale du LIFEPAK 15, 200 J.",
      ],
      doses: ["ALS: Choc manuel 200 J"],
      detail: ["Contrôle visuel avant le choc : aucun contact avec le patient ni le brancard, source d'oxygène écartée du thorax."],
    });
    s.push({
      id: "acces", title: "Accès vasculaire",
      lines: [
        "ALS: Voie veineuse périphérique, bras en priorité.",
        "ALS: Deux essais ou 90 secondes sans succès : intra-osseuse. Tibia proximal (deux doigts sous la tubérosité, face interne), à défaut humérus proximal.",
        "ALS: Aiguille à 90°, percer jusqu'à la perte de résistance, retirer le mandrin, rincer 10 mL de NaCl, fixer.",
      ],
      detail: ["Garrot veineux quelques centimètres au-dessus du pli du coude. Repérer la veine antécubitale, la tapoter pour la faire saillir.", "Désinfection par friction, laisser sécher sans retoucher la zone. Cathéter de gros calibre, biseau vers le haut, angle d'environ 20°, dans l'axe de la veine.", "Au retour veineux (flashback) : abaisser l'angle, avancer de quelques millimètres, glisser le cathéter, relâcher le garrot, retirer l'aiguille dans le collecteur.", "Rincer au NaCl 10 mL en surveillant l'infiltration, fixer au Tegaderm, inscrire calibre, site et heure.", "IO : lidocaïne 2 % 40 mg en injection lente si le patient est conscient ; le rinçage doit passer sans résistance ni gonflement."],
    });
    s.push({
      id: "choc2", title: "Analyse, choc n°2 et adrénaline",
      lines: [
        "Analyser le rythme. Toujours chocable : choc, puis reprise immédiate du massage.",
        "ALS: Choc manuel 300 J.",
        "ALS: Injecter l'adrénaline en IV/IO direct, puis rincer au NaCl.",
      ],
      doses: ["ALS: Choc manuel 300 J", "ALS: Adrénaline 1 mg (0,1 mg/mL) IV/IO, puis toutes les 3–5 min, 3 mg maximum"],
      tag: "Adrénaline puis /3–5 min",
      detail: ["Préparer et étiqueter la seringue d'adrénaline pendant les compressions, non pendant l'analyse."],
    });
    s.push({
      id: "choc3", title: "Analyse, choc n°3 et amiodarone",
      lines: [
        "Analyser le rythme. Toujours chocable : choc, reprise du massage.",
        "ALS: Choc manuel 360 J, changer la position des patchs.",
        "ALS: Injecter l'amiodarone en IV/IO.",
      ],
      doses: ["ALS: Choc manuel 360 J", "ALS: Amiodarone 300 mg IV/IO, puis 150 mg (450 mg maximum)"],
      detail: ["Modifier la position des patchs (antéro-postérieure) pour changer l'axe du courant.", "Dose d'amiodarone annoncée à voix haute, confirmée par un second intervenant, rinçage au NaCl après injection."],
    });
  } else {
    s.push({
      id: "adr", title: r === "asy" ? "Asystolie : pas de choc" : "AESP : pas de choc",
      lines: [
        "Reprendre immédiatement le massage, on ne choque pas. Ré-analyser toutes les 2 minutes.",
        "ALS: Poser la voie veineuse (ou intra-osseuse après deux essais / 90 secondes).",
        "ALS: Injecter l'adrénaline dès que possible, puis rincer.",
        "ALS: NaCl 0,9 % 1 L en perfusion rapide, à répéter une fois si besoin.",
      ],
      doses: ["ALS: Adrénaline 1 mg (0,1 mg/mL) IV/IO, puis toutes les 3–5 min, 3 mg maximum", "ALS: NaCl 0,9 % 1 L rapide (2 L en tout si hémorragie)"],
      tag: "Adrénaline /3–5 min",
      detail: ["Dose annoncée à voix haute, confirmée par un second intervenant, rinçage au NaCl après injection.", "Heure de chaque dose reportée sur la fiche ; la suivante est due dans 3 à 5 minutes."],
    });
  }
  s.push({
    id: "airway", title: "Voies aériennes avancées",
    lines: [
      "ALS: Dispositif supraglottique i-gel, premier choix en arrêt cardiaque : adulte moyen (50–90 kg) taille 4, grand adulte taille 5, petit adulte taille 3.",
      "ALS: Lubrifier la face arrière, glisser le long du palais jusqu'à la résistance, raccorder le BAVU.",
      "ALS: Brancher le capteur d'EtCO2, confirmer la ventilation.",
      "ALS: Passer à 1 insufflation toutes les 6 secondes, massage continu.",
      "ALS: Glycémie capillaire, traiter si nécessaire.",
    ],
    doses: ["ALS: EtCO2 > 10 mmHg : massage efficace ; < 10 : améliorer le massage"],
    detail: ["Capteur d'EtCO2 placé entre le dispositif et le BAVU : une courbe doit apparaître à chaque insufflation.", "Ventilation asynchrone : le masseur ne marque plus de pause pour les insufflations."],
  });
  s.push({
    id: "hht", title: "Causes réversibles (4H / 4T)",
    lines: trauma
      ? [
          "Rythme chocable en trauma pénétrant : défibriller mais partir immédiatement.",
          "ALS: Décompression à l'aiguille des deux côtés en cas de traumatisme thoracique.",
          "ALS: En route : deux voies veineuses de gros calibre ou IO, NaCl 2 L en perfusion rapide.",
        ]
      : [
          "ALS: Hypoxie, hypovolémie, hypo/hyperkaliémie, hypothermie.",
          "ALS: Pneumothorax suffocant, tamponnade, thrombose (cœur, poumon), toxiques.",
          "ALS: Traiter la cause trouvée.",
        ],
    detail: ["Énoncer les causes à voix haute et les cocher au fur et à mesure sur la fiche."],
  });
  s.push({
    id: "reeval", title: "Réévaluation toutes les 2 minutes",
    lines: [
      "À chaque analyse : rythme, puis pouls carotidien seulement si le tracé est organisé.",
      "Envisager le transport après trois cycles de RCP et d'analyse.",
      "Sur scène depuis 20 minutes : contacter l'OLMC ou transporter.",
      "Ne pas commencer ni poursuivre la réanimation devant des signes évidents de décès (voir la fiche « Détermination de la mort »).",
    ],
    tag: "Si retour de pouls → bouton « Retour à la circulation »",
    detail: ["La pause du massage pour l'analyse n'excède pas 10 secondes."],
  });
  return s;
}

export const arret: Protocol = {
  key: "arret", title: "Arrêt cardiaque", desc: "Adulte · médical ou traumatique", category: "Cardio",
  questions: [
    { id: "cause", label: "Cause probable", options: [{ id: "med", label: "Médicale / inconnue" }, { id: "trauma", label: "Traumatique (balle, accident…)" }] },
    { id: "wit", label: "Arrêt vu par un témoin", options: [{ id: "oui", label: "Oui" }, { id: "non", label: "Non / inconnu" }] },
  ],
  build: steps,
  stages: [
    stage("Arrêt, massage en cours", [0, 0], [0, 0], [0, 0], [0, 0], [0.7, 1.4], [35.8, 36.8], "Non mesurable", 3, "Dilatées, aréactives", "Pâle à cyanosée, froide", "Carotidien absent, pouls perçu = massage", "Apnée (gasps éventuels)", [14, 26]),
    stage("Retour à la circulation", [96, 122], [10, 12], [78, 98], [88, 94], [0.8, 1.6], [35.4, 36.4], "3 s", 5, "Moyennes, réactives lentes", "Pâle, moite", "Carotidien présent, radial faible", "Ventilé au BAVU", [34, 44]),
    stage("Stabilisé", [84, 104], [10, 12], [100, 126], [94, 98], [0.9, 1.4], [35.8, 36.6], "2 s", 7, "Égales, réactives", "Rosée, sèche", "Radial présent", "Ventilé, thorax symétrique", [35, 45]),
  ],
  startStage: () => 0,
  better: 1, betterLabel: "Retour à la circulation", worseLabel: "Re-arrêt",
};
