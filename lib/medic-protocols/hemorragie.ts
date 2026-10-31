import { stage, type Answers, type Protocol, type Step } from "../medic-types";

function steps(a: Answers): Step[] {
  const s: Step[] = [];
  const loc = a.loc;
  s.push({
    id: "secu", title: "Sécurité",
    lines: [
      "Attendre le feu vert du LSPD/LSSD avant d'approcher le blessé.",
      "Gants, lunettes, tenue de protection. Repérer le nombre de victimes.",
    ],
    detail: ["Feu vert du LSPD/LSSD demandé par radio avant toute approche ; rester à couvert jusqu'à confirmation.", "Se présenter au patient dès l'abord, même en l'absence de réponse."],
  });
  const x: string[] = ["Compression directe ferme, à pleine main, sur la plaie. Gaze hémostatique possible."];
  if (loc === "membre") {
    x.push("Garrot à 5 à 7 cm au-dessus de la plaie si la compression ne suffit pas, en cas d'amputation, d'objet planté ou de saignement abondant : jamais sur une articulation, serrer jusqu'à l'arrêt du saignement.");
    x.push("Noter l'heure et l'emplacement du garrot sur le garrot et sur la fiche. Le membre reste exposé. Ne jamais desserrer le garrot sans l'accord d'un médecin.");
    x.push("Saignement persistant : deuxième garrot juste au-dessus du premier. Saignement qui traverse un pansement : le recouvrir avec un second.");
  } else if (loc === "jonction") {
    x.push("Plaie de jonction : méchage de la plaie avec un pansement hémostatique, compression maintenue 3 minutes.");
    x.push("Puis pansement compressif.");
  } else if (loc === "tronc") {
    x.push("Plaie du tronc : pansement compressif ; couvrir un organe éviscéré avec une gaze humide imprégnée de NaCl, sans le rentrer.");
    x.push("Ne pas retirer un objet planté : le stabiliser.");
  } else if (loc === "thorax") {
    x.push("Plaie thoracique : pansement occlusif à valve (ou fixé sur trois côtés).");
    x.push("Surveiller la respiration à chaque réévaluation (risque de pneumothorax sous tension).");
  } else {
    x.push("Plaie de la tête ou du cou : pression directe, immobiliser le patient si possible.");
    x.push("Corps étranger présent : le couvrir avec une gaze humide, sans le retirer. Blessure à l'œil : pansement imbibé de NaCl.");
  }
  s.push({
    id: "x", title: "X : arrêter l'hémorragie", lines: x, tag: "Tout de suite",
    detail: ["Garrot appliqué sur peau nue, serré jusqu'à disparition du saignement. Le pansement compressif se fixe en serrant, avec contrôle de l'absence de reprise du saignement."],
  });
  s.push({
    id: "dress", title: "Déshabiller et chercher les autres plaies",
    lines: [
      "Couper les vêtements en évitant les trous de balle.",
      "Chercher orifices d'entrée ET de sortie : dos, aisselles, périnée, cuir chevelu. Le trajet d'une balle est imprévisible.",
      "Ne pas se focaliser sur la plaie spectaculaire : chercher l'autre.",
      "Mettre les vêtements de côté pour le LSPD/LSSD (preuves).",
    ],
    detail: ["Découper les vêtements aux ciseaux traumatiques, du bas vers le haut, sans traction sur les plaies.", "Glisser la main sous le patient pour rechercher les saignements dorsaux ; inspecter cuir chevelu, aisselles et périnée."],
  });
  s.push({
    id: "ab", title: "A et B : voies aériennes et respiration",
    lines: [
      "Parler au patient, vérifier la liberté des voies aériennes.",
      "Observer et écouter le thorax : fréquence, symétrie, bruits.",
      "SpO2 : si < 94 % ou en cas de choc, masque haute concentration à 15 L/min.",
      "Ventiler au BAVU si la respiration est inefficace.",
      "Demander une assistance ALS ou transporter sans attendre.",
    ],
    doses: ["O2 15 L/min si SpO2 < 94 % ou choc"],
    detail: ["Masque haute concentration : ballon réservoir gonflé avant application, débit 15 L/min.", "Comparer l'ampliation des deux hémithorax."],
  });
  const tete = loc === "tete";
  const penetrant = a.meca !== "autre";
  s.push({
    id: "c", title: "C : accès vasculaire et remplissage prudent",
    lines: [
      "ALS: Poser deux voies veineuses de gros calibre (16G ou 18G).",
      "ALS: Deux essais ou 90 secondes sans succès : intra-osseuse au tibia proximal.",
      tete
        ? "ALS: Traumatisme crânien : l'hypotension permissive est contre-indiquée, maintenir une TA systolique ≥ 90 mmHg ; NaCl 1 L rapide si TAS ≤ 90, par paliers de 250 mL."
        : penetrant
          ? "ALS: Trauma pénétrant, patient conscient : hypotension permissive. Objectif pouls radial présent, TA systolique ≥ 70 mmHg. Si conscience altérée ou TAS < 70 : remplir jusqu'à amélioration."
          : "ALS: Traumatisme fermé : objectif TA systolique ≥ 90 mmHg, NaCl 250 mL rapide puis contact OLMC. Lésion isolée d'un membre avec mauvaise perfusion : 1 L, réévalué tous les 250 mL.",
      "ALS: Bolus de NaCl 250 mL seulement si la cible n'est pas atteinte, réévaluer après chaque bolus ; arrêter en cas d'œdème pulmonaire.",
      "ALS: Ne pas chercher une tension normale : trop de liquide dilue la coagulation et fait resaigner.",
      "ALS: TXA si blessure de moins de 3 heures et TAS < 90, ou FC > TAS, ou hémorragie non contrôlée ; contre-indiqué en traumatisme crânien isolé.",
    ],
    doses: ["ALS: NaCl 0,9 % bolus 250 mL", "ALS: Acide tranexamique 1 g dans 50–100 mL de NaCl en 10 min, en même temps que le remplissage"],
    tag: "Réévaluer à chaque bolus",
    detail: ["Garrot veineux posé sur le bras opposé à la plaie principale. Voie de gros calibre, fixation au Tegaderm, calibre, site et heure inscrits.", "Bolus en poche pressurisée, pouls radial contrôlé après chaque bolus ; interrompre dès que la cible est atteinte."],
  });
  s.push({
    id: "d", title: "D : neurologique",
    lines: [
      "Score AVPU / Glasgow, pupilles.",
      "Glycémie capillaire.",
      "ALS: Glasgow ≤ 8 : contrôle avancé des voies aériennes (i-gel).",
    ],
    detail: ["AVPU ou Glasgow. Pupilles examinées à la lampe : taille, symétrie, réactivité."],
  });
  s.push({
    id: "e", title: "E : protéger du froid",
    lines: ["Couvrir avec une couverture de survie, limiter le temps de déshabillage, ambulance chauffée."],
    detail: ["La couverture de survie enveloppe le patient sans recouvrir ni masquer les pansements et garrots."],
  });
  s.push({
    id: "antalgie", title: "Antalgie",
    lines: [
      "ALS: Patient conscient et TA suffisante : antalgie par titration, réévaluer la douleur après chaque dose.",
      "ALS: Pas de kétorolac en cas d'hémorragie, de traumatisme crânien ou multiple.",
    ],
    doses: ["ALS: Fentanyl 50 µg IV/IM/IN toutes les 5 min (150 µg max avant contact OLMC)", "ALS: ou morphine 4 mg IV/IM toutes les 5 min (12 mg max), contre-indiquée si TA basse"],
    detail: ["Titration lente, douleur réévaluée (0 à 10) après chaque dose."],
  });
  s.push({
    id: "depart", title: "Départ et transmission",
    lines: [
      "Temps total sur place inférieur à 10 minutes pour un traumatisé grave.",
      "Transport vers un centre de traumatologie, pré-alerte de l'hôpital.",
      "Transmission MIST : Mécanisme, lésions (Injuries), Signes vitaux, Traitements.",
      "Remettre les vêtements au LSPD/LSSD.",
    ],
    detail: ["Brancardage à quatre, garrots et pansements restant visibles pendant le transport.", "Fiche complétée : heure de pose des garrots, voies, volumes perfusés."],
  });
  s.push({
    id: "reeval", title: "Réévaluation toutes les 5 minutes",
    lines: [
      "Contrôler les garrots et les pansements : saignement repris ?",
      "Constantes complètes, pouls radial, conscience, respiration.",
      "Si le patient bascule en arrêt : massage, hémorragies déjà contrôlées, décompression des deux côtés, NaCl 2 L en route.",
    ],
    tag: "Si arrêt → bouton « Arrêt cardiaque »",
  });
  return s;
}

export const hemorragie: Protocol = {
  key: "hemorragie", title: "Hémorragie / plaie par balle", desc: "Balle, arme blanche, hémorragie externe", category: "Trauma",
  questions: [
    { id: "meca", label: "Mécanisme", options: [{ id: "balle", label: "Plaie par balle" }, { id: "blanche", label: "Arme blanche" }, { id: "autre", label: "Autre plaie / traumatisme fermé" }] },
    { id: "loc", label: "Siège de la plaie principale", options: [{ id: "membre", label: "Membre" }, { id: "jonction", label: "Jonction (aine, aisselle, cou)" }, { id: "tronc", label: "Tronc / abdomen" }, { id: "thorax", label: "Thorax" }, { id: "tete", label: "Tête / cou" }] },
    { id: "conscience", label: "Conscience du patient", options: [{ id: "alerte", label: "Alerte, parle" }, { id: "confus", label: "Agité / confus / somnolent" }, { id: "inconscient", label: "Ne répond plus" }] },
    { id: "radial", label: "Pouls radial", options: [{ id: "present", label: "Présent, bien frappé" }, { id: "faible", label: "Rapide et faible" }, { id: "absent", label: "Absent" }] },
    { id: "saigne", label: "Saignement au contact", options: [{ id: "abondant", label: "Abondant / jet" }, { id: "modere", label: "Modéré" }] },
  ],
  build: steps,
  stages: [
    stage("Compensé", [98, 112], [18, 22], [112, 130], [95, 98], [0.9, 1.2], [36.2, 36.8], "2 s", 15, "Égales, réactives", "Pâle, un peu moite", "Radial présent, rapide", "Rapide, superficielle"),
    stage("Choc modéré", [118, 136], [24, 28], [85, 100], [92, 95], [0.9, 1.2], [35.6, 36.2], "3 s", 14, "Égales, réactives", "Pâle, froide, sueurs", "Radial rapide et faible", "Rapide, patient agité"),
    stage("Choc sévère", [140, 158], [30, 36], [60, 80], [86, 91], [0.8, 1.2], [35, 35.6], "> 4 s", 10, "Dilatées, réactives lentes", "Grise, froide, marbrée", "Radial très filant, fémoral présent", "Haletante"),
    stage("Pré-arrêt", [40, 55], [6, 10], [40, 58], [70, 84], [0.8, 1.2], [34.5, 35.2], "> 5 s", 6, "Dilatées, peu réactives", "Cireuse, glacée", "Radial à peine perceptible, carotidien présent mais filant", "Gasps irréguliers"),
  ],
  startStage: (a) => {
    let n = 0;
    if (a.conscience === "confus") n += 1;
    if (a.conscience === "inconscient") n += 2;
    if (a.radial === "faible") n += 1;
    if (a.radial === "absent") n += 2;
    if (a.saigne === "abondant") n += 1;
    return Math.min(3, Math.floor(n / 2));
  },
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 3, trauma: true },
};
