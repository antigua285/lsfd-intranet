import type { Protocol, Step } from "../medic-types";

const fiche = (key: string, title: string, desc: string, steps: Step[]): Protocol => ({
  key, title, desc, category: "Manœuvres", questions: [], build: () => steps, stages: [],
  startStage: () => 0, better: -1, betterLabel: "", worseLabel: "", noVitals: true,
});

export const smr = fiche("smr", "Immobilisation du rachis (SMR)", "Restriction des mouvements du rachis", [
  { id: "indic", title: "Quand immobiliser", lines: [
    "Tout patient victime d'un traumatisme, y compris ambulatoire, est évalué.",
    "Si un élément de l'évaluation est anormal (déformation ou sensibilité le long de la colonne, déficit neurologique), une SMR est indiquée.",
    "Une SMR peut aussi être envisagée sans signe neurologique si une lésion médullaire instable est suspectée.",
  ] },
  { id: "tech", title: "Technique", lines: [
    "Maintenir une position neutre et alignée de la colonne : stabiliser la tête, le cou et le torse.",
    "Un collier cervical seul ne constitue pas une SMR adéquate.",
    "La planche dorsale aide à stabiliser, mais n'apporte aucun avantage une fois le patient sur le brancard et peut causer des douleurs. Ne pas l'utiliser sur un patient ambulatoire.",
  ], detail: ["Un intervenant tient la tête en position neutre, les paumes sur les côtés, pendant que les autres installent le matériel."] },
  { id: "neuro", title: "Examen neurologique", lines: [
    "Rechercher des troubles sensitifs (paresthésies) aux quatre membres.",
    "Évaluer la motricité des quatre extrémités : flexion et extension du poignet et des doigts, flexion plantaire et dorsiflexion du pied.",
    "Répéter l'examen fréquemment. Tout patient placé en SMR par un BLS puis transféré à un ALS est réévalué.",
    "Inscrire l'anamnèse et l'examen dans l'ePCR.",
  ] },
]);

export const casque = fiche("casque", "Retrait du casque", "Motard, casque intégral", [
  { id: "prep", title: "Préparation", lines: ["Si le patient est conscient, lui expliquer la procédure.", "Un premier intervenant se place derrière la tête : stabiliser la tête et le cou en position neutre, paumes sur les côtés du casque, bords inférieurs tenus fermement.", "Un deuxième intervenant, à côté du patient : ouvrir ou retirer la visière, retirer les lunettes, détacher ou couper la jugulaire."] },
  { id: "retrait", title: "Retrait", lines: ["Le deuxième intervenant saisit l'angle de la mandibule avec trois doigts et place l'autre main sous la nuque, au niveau de l'occiput.", "Écarter les parties latérales du casque en le faisant tourner lentement, sans toucher le nez du patient.", "Placer un coussin ou un rembourrage sous la tête pour la maintenir dans l'axe.", "Immobiliser le patient au moyen d'un collier cervical."], detail: ["Le premier intervenant ne lâche jamais la tête tant que le deuxième n'a pas repris la stabilisation."] },
]);

export const tensionPalpatoire = fiche("tension-palpatoire", "Tension par palpation", "Systolique sans stéthoscope", [
  { id: "proc", title: "Procédure", lines: [
    "Placer le patient avec le bras au niveau du cœur.",
    "Palper le pouls brachial ou radial.",
    "Appliquer le brassard autour du membre.",
    "Gonfler le brassard à 30 mmHg au-dessus du point où le pouls disparaît.",
    "Dégonfler lentement en notant la valeur à laquelle le pouls revient.",
    "Enregistrer la pression systolique sous la forme « #/P ».",
  ], detail: ["Le brassard est posé à nu ou sur un vêtement fin, deux doigts au-dessus du pli du coude."] },
]);

export const glycemie = fiche("glycemie", "Glycémie capillaire", "Au doigt, glucomètre", [
  { id: "proc", title: "Procédure", lines: [
    "Préparer le matériel à l'avance : glucomètre, lancette, lingettes, pansement, gaze, conteneur pour objets tranchants.",
    "Désinfecter le doigt avec une lingette, laisser sécher 30 secondes.",
    "Allumer l'appareil et confirmer le code de la bandelette avec l'écran.",
    "Piquer le doigt avec la lancette, appliquer l'échantillon sur la bandelette.",
    "Couvrir le point de ponction si le saignement continue.",
    "Noter la lecture.",
  ], detail: ["Piquer le côté du doigt, sans presser fortement, et jeter la lancette dans le conteneur."] },
]);

export const bavu = fiche("bavu", "Ventilation au BAVU", "Adulte, pédiatrique, nourrisson", [
  { id: "proc", title: "Procédure", lines: [
    "Sélectionner le BAVU de la bonne taille (adulte, pédiatrique, nourrisson) et assembler les composants.",
    "Fixer l'alimentation en oxygène au BAVU, régler au débit recommandé (15 L/min).",
    "Sceller le masque sur le visage en maintenant l'inclinaison de la tête et l'élévation du menton.",
    "Presser le ballon, observer le soulèvement et l'abaissement du thorax à chaque ventilation.",
    "Si le thorax ne se soulève pas : réévaluer l'équipement, la technique et le patient.",
    "Deux secouristes si possible : l'un maintient le masque à deux mains, l'autre comprime le ballon.",
    "Adulte : 1 insufflation toutes les 6 secondes (10/min), juste assez pour voir le thorax se soulever.",
  ], detail: ["Masque tenu en C avec le pouce et l'index, les trois autres doigts soulèvent la mandibule. Compter à voix haute pour ne pas hyperventiler."] },
]);
