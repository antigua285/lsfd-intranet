import { D, T } from "./medic-techniques";

/** Marche à suivre pratique : cardio, rythmes, respiratoire, allergie, voies aériennes. */
export const PRACTICE_A: Record<string, string[]> = {
  /* ═════════ Arrêt cardiaque ═════════ */
  "arret.constat": [
    "## Marche à suivre",
    "Approcher en sécurité (circulation, câbles, produits), enfiler les gants, s'agenouiller à hauteur du thorax du patient.",
    "Stimuler franchement : secouer les épaules et appeler fort (« Vous m'entendez ? »). Aucune réaction : basculer la tête en arrière, élever le menton, pencher la joue au-dessus de la bouche et regarder le thorax pendant 10 secondes.",
    "Simultanément, palper le pouls carotidien (deux doigts dans la gouttière entre trachée et muscle sterno-cléido-mastoïdien), 10 secondes maximum. Un gasp isolé ne compte pas comme respiration.",
    "Absence de signe de vie : annoncer à voix haute « arrêt cardiaque, début à 14 h 32 », demander le matériel (DAE, BAVU, oxygène) et l'assistance ALS par radio.",
    "Adaptation : sur un patient au sol sur un sol mou ou dans un lit, le déplacer sur un plan dur ; patient trauma, ne pas basculer la tête et utiliser la subluxation de la mâchoire.",
  ],
  "arret.rcp": [...T.rcp],
  "arret.scope": [
    ...T.dae,
    ...T.bavu,
    "## Répartition des rôles",
    "Chef d'équipe (reste à distance du patient pour garder une vue d'ensemble), deux masseurs en alternance, un responsable des voies aériennes, un responsable de l'accès vasculaire et des médicaments, un scribe qui note les heures.",
    ...T.scope,
  ],
  "arret.analyse": [
    "## Marche à suivre",
    "Annoncer « pause pour analyse » : les mains quittent le thorax, personne ne touche le patient, durée la plus courte possible (moins de 10 secondes).",
    "Lire le rythme sur le moniteur : FV/TV sans pouls = chocable ; asystolie ou activité électrique sans pouls = non chocable.",
    "Ligne plate : confirmer avant de conclure à l'asystolie (électrodes décollées, câble débranché, gain trop faible, changer de dérivation).",
    "Annoncer le résultat à voix haute (« FV, chocable » ou « asystolie, pas de choc »), puis agir : charger si chocable, reprendre les compressions sinon.",
  ],
  "arret.choc1": [...T.defib],
  "arret.acces": [...T.vvp, ...T.io, ...T.verif],
  "arret.choc2": [...T.defib, ...D.adrArret, ...T.pushIV],
  "arret.choc3": [...T.defib, ...D.amio, ...T.pushIV],
  "arret.airway": [...T.igel, ...T.bavu, ...T.aspiration],
  "arret.hht": [
    "## Marche à suivre",
    "Les causes réversibles se cherchent pendant que le massage continue, sans l'interrompre : un équipier en charge de la réflexion clinique.",
    "Hypoxie : ventilation efficace, thorax qui se soulève, courbe de capnographie. Hypovolémie : hémorragie, abdomen distendu, sol sanglant. Hypo/hyperkaliémie : dialysé, insuffisant rénal. Hypothermie : peau froide, environnement.",
    "Pneumothorax suffocant : thorax asymétrique, difficulté croissante à ventiler (décompression à l'aiguille). Tamponnade : plaie thoracique. Thrombose : antécédents. Toxiques : médicaments, seringues sur la scène.",
    ...T.decompression,
  ],
  "arret.reeval": [
    "## Marche à suivre",
    "À chaque cycle de 2 minutes : pause pour analyse, lecture du rythme, pouls carotidien seulement si le tracé est organisé, 10 secondes maximum.",
    "Le scribe annonce le temps et les doses dues (« 2 minutes, adrénaline due dans 1 minute »).",
    "Mêmes rôles, rotation du masseur. Envisager le transport après 3 cycles ; 20 minutes sur scène : OLMC ou transport.",
    ...T.mist,
  ],
  "arret.adr": [...D.adrArret, ...T.vvp, ...T.pushIV, ...T.bolus],
  "arret.x": [...T.garrot, ...T.packing],

  /* ═════════ Douleur thoracique ═════════ */
  "douleur-thoracique.eval": [
    "## Marche à suivre",
    "Se présenter, installer le patient en position de confort (assis ou demi-assis), le calmer : l'anxiété aggrave la douleur.",
    "OPQRST : début (O), provoquant/soulageant (P), type (Q), irradiation (R), intensité 0 à 10 (S), durée (T). SAMPLE : allergies avant tout médicament.",
    "Prendre TA aux deux bras (différence > 20 mmHg = alerte dissection), FC, FR, SpO2, glycémie.",
    ...T.o2,
    ...T.prealerte,
  ],
  "douleur-thoracique.aspirine": [...T.verif, ...D.aspirine, ...T.po],
  "douleur-thoracique.ecg": [...T.scope, ...T.ecg12, ...T.vvp],
  "douleur-thoracique.nitro": [...D.nitro, ...T.sl],
  "douleur-thoracique.douleur": [...D.fentanyl, ...T.slowIV, ...T.in, ...D.ondansetron, ...T.titration],
  "douleur-thoracique.autres": [
    "## Marche à suivre",
    "Dissection aortique : douleur brutale « déchirante », dos, TA différente entre les bras : pas de nitroglycérine, antalgie par opioïdes, transport rapide.",
    "Embolie pulmonaire : douleur pleurale, dyspnée, tachycardie, jambe gonflée. Pneumothorax : murmure diminué d'un côté.",
    ...T.prealerte,
    "Patient en arrêt : bouton « Arrêt cardiaque » de la fiche.",
  ],

  /* ═════════ Rythmes ═════════ */
  "bradycardie.eval": [
    "## Marche à suivre",
    "Compter le pouls radial sur 30 secondes, doubler, comparer avec le moniteur ; rechercher une mauvaise perfusion : TA < 90, confusion, douleur thoracique, peau froide et moite.",
    ...T.pose,
    ...T.scope,
    "Rechercher des causes : bêtabloquants, inhibiteurs calciques, hypoxie, hypothermie, infarctus inférieur.",
  ],
  "bradycardie.als": [
    ...T.vvp,
    ...T.ecg12,
    ...D.atropine,
    ...T.pushIV,
    ...T.pacing,
    ...D.midazolam.slice(0, 1),
    ...D.fentanyl,
    ...T.pushDose,
    ...D.calcium,
    ...D.albuterol,
  ],
  "tachycardie.eval": [
    "## Marche à suivre",
    "Compter le pouls radial sur 30 secondes, doubler, comparer avec le moniteur ; évaluer perfusion (TA, conscience, peau) et symptômes (douleur thoracique, dyspnée).",
    "Instable : TA < 90, trouble de conscience, choc, œdème pulmonaire, douleur thoracique ischémique. Stable : bonne perfusion, patient parle.",
    ...T.pose,
    ...T.scope,
  ],
  "tachycardie.traitement": [
    ...T.vvp,
    ...T.ecg12,
    ...D.adenosine,
    ...T.rapidIV,
    ...T.cardioversion,
    ...T.bolus,
  ],
  "tachycardie.suivi": [
    "## Marche à suivre",
    "Après chaque traitement : rythme au scope (impression d'une bande), TA, SpO2, conscience, symptômes.",
    "ECG 12 dérivations après conversion, imprimé et remis à l'hôpital.",
    ...T.prealerte,
  ],

  /* ═════════ Respiratoire ═════════ */
  "detresse-respiratoire.eval": [
    "## Marche à suivre",
    "Entrée dans la pièce : repérer sans toucher la position, le tirage, l'état de conscience. Gants, présentation calme, tutoiement évité.",
    "Aider le patient à adopter la position qu'il choisit (assis, penché en avant, mains sur les genoux) ; ne jamais l'allonger de force.",
    "Fréquence respiratoire sur 30 secondes, SpO2 au doigt, auscultation (sifflements, crépitants, murmure absent), phrases complètes ou mots isolés.",
    "Renouveler l'évaluation à chaque réévaluation : un patient qui devient calme et somnolent est en train de s'épuiser.",
    ...T.o2,
  ],
  "detresse-respiratoire.o2": [...T.o2, ...T.bavu],
  "detresse-respiratoire.als": [...T.scope, ...T.vvp, ...T.decompression],
  "detresse-respiratoire.reeval": [
    "## Marche à suivre",
    "Toutes les 5 minutes : fréquence respiratoire, SpO2, capacité à parler, auscultation, conscience, tension.",
    ...T.prealerte,
  ],
  "detresse-respiratoire.asthme": [...D.albuterol, ...T.neb, ...D.adrIM, ...T.im, ...T.cpap],
  "detresse-respiratoire.oap": [...T.cpap, ...D.nitro, ...T.sl, ...D.aspirine, ...T.ecg12],

  /* ═════════ Anaphylaxie ═════════ */
  "anaphylaxie.eval": [
    "## Marche à suivre",
    "Écarter ou retirer l'allergène (dard, aliment, médicament en cours de perfusion à arrêter).",
    "Chercher deux systèmes touchés : peau (urticaire, rougeur), respiratoire (sifflements, voix rauque, gonflement des lèvres), cardio (TA basse, pouls rapide), digestif (vomissements).",
    "Oxygène à 15 L/min au masque haute concentration, patient assis s'il est dyspnéique, allongé jambes surélevées s'il est en choc.",
    "Préparer l'adrénaline pendant l'évaluation, sans attendre la confirmation du tableau complet.",
  ],
  "anaphylaxie.cutane": [
    "## Marche à suivre",
    "Surveillance étroite : réévaluer toutes les 3 à 5 minutes la respiration, la voix, la TA, la peau.",
    ...D.diphen,
    ...T.slowIV,
    ...T.im,
  ],
  "anaphylaxie.transport": [
    "## Marche à suivre",
    "Transport systématique, même si le patient va mieux : les symptômes peuvent revenir 4 à 8 heures plus tard.",
    "Pendant le trajet : constantes toutes les 3 à 5 minutes, voie aérienne accessible, adrénaline prête.",
    ...T.prealerte,
  ],
  "anaphylaxie.adr-im": [...T.verif, ...D.adrIM, ...T.im],
  "anaphylaxie.als": [...T.scope, ...T.vvp, ...D.albuterol, ...T.neb, ...T.bolus, ...D.diphen],

  /* ═════════ Voies aériennes ═════════ */
  "obstruction.eval": [
    "## Marche à suivre",
    "Obstruction partielle (patient tousse, parle) : l'encourager à tousser, ne pas intervenir. Obstruction complète (ne tousse plus, ne parle plus, main à la gorge, cyanose) : agir immédiatement.",
    ...T.aspiration,
    ...T.o2,
  ],
  "obstruction.heim": [
    "## Marche à suivre",
    "Placé derrière le patient, un pied entre les siens pour le soutenir. Poing fermé, pouce vers l'abdomen, au-dessus du nombril et sous le sternum, deuxième main sur le poing.",
    "Cinq compressions franches vers l'arrière et vers le haut, en « J ». Contrôler si le corps étranger est expulsé ; sinon, cinq nouvelles compressions.",
    "Femme enceinte ou obèse : compressions thoraciques à la place de l'abdomen. Nourrisson : 5 tapes dorsales alternées avec 5 compressions thoraciques.",
    "Patient qui perd connaissance : l'allonger au sol, appeler l'assistance ALS et commencer les compressions thoraciques. À chaque ouverture de la bouche, regarder et retirer ce qui est visible (jamais un balayage à l'aveugle).",
  ],
  "obstruction.als": [...D.epiNeb, ...T.neb, ...D.adrIM, ...T.im],
  "obstruction.rcp": [...T.rcp, ...T.bavu, ...T.aspiration],
  "inhalation.eval": [
    "## Marche à suivre",
    "Sortir le patient de l'atmosphère enfumée. Examiner : suie dans la bouche et les narines, poils brûlés, voix rauque, toux, brûlures du visage.",
    ...T.o2,
    "Une SpO2 normale n'élimine pas une intoxication au monoxyde de carbone : mesurer le SpCO si disponible.",
    ...T.prealerte,
  ],
  "inhalation.als": [...T.vvp, ...T.bolus, ...T.scope, ...T.bavu],
};
