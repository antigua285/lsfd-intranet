import type { Protocol, Step } from "../medic-types";

const fiche = (key: string, title: string, desc: string, steps: Step[]): Protocol => ({
  key, title, desc, category: "Procédures", questions: [], build: () => steps, stages: [],
  startStage: () => 0, better: -1, betterLabel: "", worseLabel: "", noVitals: true,
});

export const mort = fiche("mort", "Détermination de la mort", "Conditions et suites à donner", [
  { id: "cond", title: "Conditions", lines: [
    "Un patient est considéré comme décédé lorsque l'absence de respiration, d'activité cardiaque et de réflexes neurologiques s'additionne à au moins l'un des éléments suivants.",
    "Décapitation, incinération, écrasement massif, décomposition, rigidité cadavérique.",
    "Traumatisme pénétrant ou contondant avec éviscération du cœur, du cerveau ou des poumons.",
    "Désincarcération supérieure à 15 minutes sans tentative de réanimation.",
    "Arrêt cardio-respiratoire lors d'un incident à victimes multiples sans ressources appropriées.",
    "Patient noyé, immergé sous l'eau pendant au moins une heure.",
    "Après trois tentatives de RCP.",
  ], detail: ["Les constatations (absence de respiration, de pouls, de réflexes) sont faites et notées avec l'heure avant toute conclusion."] },
  { id: "suite", title: "Après la détermination", lines: [
    "Tous les traitements initiés pendant la réanimation restent en place : cathéters, tubulures, électrodes, pansements.",
    "Le défunt ne doit pas être déplacé sans l'autorisation explicite d'un membre du Département de Médecine Légale (coroners).",
    "Si un déplacement est nécessaire pour des raisons de sécurité, le déplacer vers la zone la plus accessible, ou à défaut le transporter vers un centre adapté.",
    "Scène de crime ou suicide suspecté : la scène est gérée avec les forces de l'ordre (voir la fiche dédiée).",
  ] },
]);

export const refus = fiche("refus", "Refus de soins ou de transport", "Capacité à décider, fiche de refus", [
  { id: "capacite", title: "Capacité à décider", lines: [
    "Une personne en situation de handicap, de détresse claire, ou dont l'état mental ou de conscience ne permet pas de décision éclairée n'est pas considérée comme capable de refuser.",
    "Il en va de même d'une personne qui vient de tenter de se suicider, évoque des pensées suicidaires, ou est décrite comme suicidaire par ses proches.",
    "Dans ces cas, l'EMT décide du transport et de la prise en charge.",
  ] },
  { id: "info", title: "Informer le patient", lines: [
    "Avertir le patient des risques que le refus peut représenter pour sa santé.",
    "Confirmer que ces risques ont été compris.",
    "Faire signer la fiche de refus au patient.",
  ], detail: ["Les explications sont données calmement, en termes simples, en laissant le patient reformuler ce qu'il a compris."] },
  { id: "fiche", title: "Fiche de refus : éléments nécessaires", lines: [
    "Constantes vitales, glycémie, âge du patient.",
    "Consommation de drogues ou d'alcool.",
    "Raison du refus.",
    "Liste des traitements effectués.",
    "Plans du patient après le refus : ce qu'il compte faire et les personnes qui seront avec lui.",
    "Personnes présentes aux côtés du patient.",
  ] },
]);

export const transportPrecoce = fiche("transport-precoce", "Transport précoce (BLS)", "Quand ne pas attendre l'ALS", [
  { id: "criteres", title: "Critères de transport précoce", lines: [
    "Détresse ou arrêt respiratoire, obstruction des voies aériennes.",
    "Dégradation neurologique significative depuis l'évaluation initiale, traumatisme crânien avec perte de connaissance initiale.",
    "Brûlures graves (deuxième ou troisième degré).",
    "Accouchement imminent.",
    "Hémorragie non maîtrisée, thorax ou abdomen ouvert, polytraumatisme, pneumothorax.",
  ] },
  { id: "trajet", title: "Selon le temps de trajet", lines: [
    "Trajet vers un établissement adapté plus rapide que l'arrivée estimée d'une unité ALS : transporter et envisager un point de rendez-vous pour le transfert avec l'ALS.",
    "Transport estimé à plus de 10 minutes et aucune unité ALS immédiatement disponible : transporter.",
  ] },
]);

export const contention = fiche("contention", "Contention", "Patient violent ou dangereux", [
  { id: "principes", title: "Principes", lines: [
    "La contention est réservée aux situations où le patient est violent ou dangereux pour lui-même ou les autres, et seulement après échec des mesures moins restrictives (désescalade verbale).",
    "Un comportement agressif peut être le symptôme d'une condition médicale : traumatisme crânien, alcool ou autres substances, trouble métabolique, stress, trouble psychiatrique.",
    "La sécurisation de la scène est coordonnée avec les forces de l'ordre, et la responsabilité des soins revient à la plus haute autorité médicale sur place.",
  ] },
  { id: "dispositifs", title: "Dispositifs autorisés", lines: [
    "Rigides rembourrés ou souples (gilets, bandes Velcro, ceintures), sans clé et à ouverture rapide.",
    "Poignets et chevilles rembourrés à quatre points, ou poignets et ceinture rembourrés à deux points.",
    "La méthode doit permettre la surveillance des signes vitaux et ne pas gêner les voies aériennes ni compromettre l'état neurologique ou vasculaire.",
  ] },
  { id: "interdits", title: "Interdits pour le personnel médical", lines: [
    "Attaches en plastique dur ou tout dispositif nécessitant une clé.",
    "Immobiliser mains et pieds derrière le dos, immobiliser un patient couché sur le ventre.",
    "Poser une planche sur un patient allongé sur un brancard (méthode « sandwich »).",
    "Toute application pouvant entraîner une atteinte vasculaire, neurologique ou respiratoire.",
    "Moyens des forces de l'ordre non adaptés à une prise en charge médicale : le patient est libéré par les forces de l'ordre au profit d'une contention approuvée par le personnel médical. Un agent accompagne le patient dans l'ambulance.",
  ] },
]);

export const detention = fiche("detention", "Patient en détention", "Évaluation et transport", [
  { id: "eval", title: "Évaluation", lines: [
    "Évaluation initiale et ciblée complète : constantes vitales, signes négatifs pertinents, motif principal ou raison de l'appel au 9-1-1.",
    "Garder à l'esprit que l'évaluation peut être peu fiable : consommation de substances, accès limité aux traitements, traumatismes sans signes évidents.",
  ] },
  { id: "transport", title: "Transport et contention", lines: [
    "La contention des forces de l'ordre doit laisser un jeu suffisant pour une ventilation efficace et ne pas compromettre la respiration ni la circulation.",
    "Présence continue d'un agent dans l'ambulance.",
    "Surveiller les membres immobilisés : pouls, remplissage capillaire, couleur et température de la peau, fonction nerveuse et motrice.",
    "Les contentions peuvent être fixées au châssis du brancard, mais pas aux barrières latérales mobiles.",
  ] },
]);

export const sceneCrime = fiche("scene-crime", "Scène de crime / suicide suspecté", "Autorité de scène et sécurité", [
  { id: "autorite", title: "Autorité de la scène", lines: [
    "La responsabilité de la gestion de la scène revient au personnel disposant des qualifications médicales les plus élevées.",
    "L'autorité de la gestion de la scène revient, si possible, aux forces de l'ordre présentes : demander leur assistance pour assurer la sécurité de l'intervention.",
    "Si les forces de l'ordre ne sont pas présentes, les contacter et assurer la sécurité de l'intervention jusqu'à leur arrivée.",
    "Gilet pare-balle obligatoire en cas d'agression armée, de fusillade, d'alerte tactique, de sniper, de violence domestique ou d'incident en zone à risque.",
  ] },
]);

export const epcr = fiche("epcr", "ePCR : informations minimales", "Rapport électronique du patient", [
  { id: "contenu", title: "Contenu minimal", lines: [
    "Identité du patient : nom, adresse, numéro de téléphone, date de naissance.",
    "Plainte principale, observations pertinentes, signes vitaux.",
    "Traitements suivis par le patient, allergies connues, médicaments administrés.",
    "Procédures et manœuvres réalisées, personnel intervenant.",
  ], detail: ["L'unité qui transporte le patient rédige l'ePCR et est responsable de l'exactitude des informations."] },
]);
