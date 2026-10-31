import { T } from "./medic-techniques";

/** Marche à suivre pratique : manœuvres et procédures. */
export const PRACTICE_C: Record<string, string[]> = {
  "smr.indic": [
    "## Marche à suivre",
    "Évaluer d'abord : mécanisme (chute de hauteur, accident à haute énergie), douleur ou sensibilité à la palpation de la colonne (de la nuque au sacrum), déficit neurologique, intoxication ou distraction qui rendent l'examen peu fiable.",
    "Palper chaque vertèbre du doigt, sans bouger la tête, en demandant au patient de ne pas se mouvoir.",
    "Tous critères négatifs et patient fiable : pas de SMR. Un critère positif : SMR complète.",
  ],
  "smr.tech": [...T.smr],
  "smr.neuro": [
    "## Marche à suivre",
    "Sensibilité : toucher léger puis pincement au bout des doigts et des orteils, comparer côté droit/gauche.",
    "Motricité : serrer les mains, écarter les doigts, pousser le pied contre la main de l'intervenant (flexion plantaire), tirer le pied vers soi (dorsiflexion).",
    "Répéter après chaque mobilisation et à l'arrivée à l'hôpital ; inscrire l'heure et le résultat dans l'ePCR.",
  ],
  "casque.prep": [
    "## Marche à suivre",
    "Expliquer chaque temps au patient conscient. Intervenant 1 derrière la tête : paumes sur les côtés du casque, doigts sous les bords inférieurs, tête et cou maintenus alignés.",
    "Intervenant 2 sur le côté : relever la visière, ôter les lunettes, défaire ou couper la jugulaire.",
    "Casque intégral : ne jamais tirer vers le haut sans avoir ouvert le menton et dégagé les oreilles.",
  ],
  "casque.retrait": [
    "## Marche à suivre",
    "Intervenant 2 : une main sous la nuque (occiput), l'autre à l'angle de la mandibule, et prend le relais de la stabilisation manuelle.",
    "Intervenant 1 écarte les côtés du casque et le fait tourner doucement vers l'arrière puis vers l'avant, en dégageant d'abord le nez.",
    "Glisser un coussin sous la tête, vérifier l'alignement, poser le collier cervical, examen neurologique avant et après.",
  ],
  "tension-palpatoire.proc": [
    "## Marche à suivre",
    "Bras à hauteur du cœur, brassard bien ajusté, tube vers le bas. Pouce sur le pouls radial.",
    "Gonfler jusqu'à disparition du pouls, puis 30 mmHg de plus. Dégonfler lentement (2 à 3 mmHg par seconde). La valeur de retour du pouls est la TA systolique.",
    "Noter « 90/P » (palpée). Utile en environnement bruyant ou si le patient est en choc.",
  ],
  "glycemie.proc": [
    "## Marche à suivre",
    "Choisir le côté du doigt (annulaire ou majeur, jamais le pouce ni l'index), le réchauffer. Désinfecter, laisser sécher 30 secondes (alcool humide fausse le résultat).",
    "Piquer d'un geste net, jeter la première goutte, appliquer la seconde sur la bandelette. Compresse sur le point de piqûre.",
    "Interpréter avec la clinique : < 0,60 g/L avec signes = hypoglycémie ; > 3 g/L = hyperglycémie à signaler. Tracer valeur et heure.",
  ],
  "bavu.proc": [...T.bavu],
  "mort.cond": [
    "## Marche à suivre",
    "Constat à deux, avec le moniteur : absence de respiration (30 secondes), de pouls (60 secondes), de réflexes pupillaires, tracé plat sur au moins deux dérivations.",
    "Ne pas s'appuyer sur un seul critère. En cas de doute, commencer la réanimation et contacter l'OLMC.",
    "Annoncer l'heure du décès à haute voix et la noter.",
  ],
  "mort.suite": [
    "## Marche à suivre",
    "Laisser en place les cathéters, électrodes, dispositifs ; ne pas nettoyer le corps ni les lieux. Couvrir le visage avec un drap en respectant la dignité.",
    "Prévenir les forces de l'ordre et le Département de Médecine Légale. Les soigneurs restent disponibles pour les proches : annonce avec des mots simples, sans détails choquants.",
    ...T.tracer,
  ],
  "refus.capacite": [
    "## Marche à suivre",
    "Évaluer la capacité : le patient sait où il est, la date, comprend sa situation, peut expliquer pourquoi il refuse et ce qui peut arriver.",
    "Alcool, substance, traumatisme crânien, trouble psychiatrique aigu, âge : la capacité est mise en doute et le refus n'est pas accepté.",
    "Mineur : le représentant légal décide.",
  ],
  "refus.info": [
    "## Marche à suivre",
    "Expliquer en termes simples les risques précis (aggravation, décès) et l'alternative proposée. Faire reformuler au patient.",
    "Proposer le transport à nouveau, indiquer qu'il peut rappeler à tout moment. Faire signer, un témoin signe.",
  ],
  "refus.fiche": [
    "## Marche à suivre",
    "Compléter la fiche avant la signature : constantes, glycémie, âge, substances, raison du refus, traitements, plans du patient, personnes présentes.",
    ...T.tracer,
  ],
  "transport-precoce.criteres": [
    "## Marche à suivre",
    "Décision rapide à l'évaluation initiale. Ne pas attendre une confirmation : départ avec soins en route.",
    ...T.mist,
    ...T.prealerte,
  ],
  "transport-precoce.trajet": [
    "## Marche à suivre",
    "Comparer le temps de trajet vers l'hôpital au délai d'arrivée de l'ALS. Fixer par radio un point de rendez-vous si le transfert est choisi.",
    "En route : constantes toutes les 5 minutes, voies aériennes, hémorragies.",
  ],
  "contention.principes": [
    "## Marche à suivre",
    "Désescalade d'abord : se placer de côté à distance, voix calme, nommer la situation, proposer un choix. Rechercher une cause médicale (glycémie, hypoxie, traumatisme, intoxication).",
    "La contention n'intervient qu'en dernier recours, coordonnée avec le LSPD/LSSD, la responsabilité des soins revenant au personnel médical.",
  ],
  "contention.dispositifs": [
    "## Marche à suivre",
    "Contention à 4 points (poignets et chevilles) ou 2 points, bandes rembourrées à ouverture rapide, jamais serrées au point de couper la circulation (deux doigts passent sous la bande).",
    "Patient couché sur le dos ou sur le côté, tête surélevée, aucune pression sur le thorax. Contrôle des pouls distaux, de la couleur et de la sensibilité toutes les 5 minutes.",
    "Surveillance continue et motif de la contention tracé avec l'heure.",
  ],
  "contention.interdits": [
    "## Marche à suivre",
    "Remplacer toute contention policière non adaptée (menottes dans le dos, position ventrale) par une contention approuvée, sous responsabilité médicale.",
    "Ne jamais laisser un patient attaché sans surveillance ; sédation seulement sur ordre de l'OLMC, avec BAVU prêt.",
  ],
  "detention.eval": [
    "## Marche à suivre",
    "Évaluer comme tout patient, en présence de l'agent. Chercher les blessures cachées (dos, côtes), la consommation de substances, les traitements médicaux.",
    "Parler directement au patient, ne pas supposer qu'il simule.",
  ],
  "detention.transport": [
    "## Marche à suivre",
    "Contention des forces de l'ordre : vérifier qu'elle permet une respiration libre ; patient assis ou sur le côté, jamais sur le ventre.",
    "Contrôle des membres immobilisés toutes les 5 minutes (pouls, couleur, sensibilité). L'agent reste dans l'ambulance.",
  ],
  "scene-crime.autorite": [
    "## Marche à suivre",
    "Ne rien déplacer ni nettoyer en dehors de ce qui est nécessaire aux soins. Noter les positions initiales des objets et du patient.",
    "Gilet pare-balle en cas de risque armé. Garder une issue de repli, rester à couvert jusqu'à confirmation de sécurité par le LSPD/LSSD.",
    "Conserver les vêtements découpés dans un sac pour les forces de l'ordre.",
  ],
  "epcr.contenu": [
    "## Marche à suivre",
    "Remplir la fiche pendant le trajet ou immédiatement après. Heures de chaque geste et médicament, dose et voie, constantes avec leur heure.",
    "Écrire factuellement : ce qui est vu, entendu, mesuré. Aucune interprétation, aucune opinion.",
    "Remettre une copie à l'équipe réceptrice à l'arrivée.",
  ],
};
