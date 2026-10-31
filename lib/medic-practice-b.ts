import { D, T } from "./medic-techniques";

/** Marche à suivre pratique : trauma, neurologie, toxicologie, environnement, obstétrique, pédiatrie. */
export const PRACTICE_B: Record<string, string[]> = {
  /* ═════════ Hémorragie ═════════ */
  "hemorragie.secu": [
    "## Marche à suivre",
    "Rester à couvert à bonne distance jusqu'au feu vert du LSPD/LSSD, puis approcher par le chemin que les agents indiquent. Compter les victimes et annoncer le nombre à la radio.",
    "Gants, lunettes, tenue de protection ; matériel hémorragique (garrots, gaze hémostatique, pansements) sorti avant l'approche.",
  ],
  "hemorragie.x": [...T.garrot, ...T.packing],
  "hemorragie.dress": [
    "## Marche à suivre",
    "Découper les vêtements aux ciseaux, du bas vers le haut, en évitant les trous de balle (preuves) et sans traction sur les plaies.",
    "Glisser la main sous le patient (dos, fesses, nuque), inspecter aisselles, plis de l'aine, périnée et cuir chevelu. Rechercher orifice d'entrée ET de sortie.",
    "Placer les vêtements dans un sac pour le LSPD/LSSD.",
  ],
  "hemorragie.ab": [...T.o2, ...T.bavu, ...T.smr],
  "hemorragie.c": [...T.vvp, ...T.io, ...T.bolus, ...D.txa, ...T.perf],
  "hemorragie.d": [
    "## Marche à suivre",
    "AVPU : Alerte, réagit à la Voix, à la Douleur, Inconscient. Glasgow : ouverture des yeux, réponse verbale, réponse motrice (pression sur l'ongle ou trapèze).",
    "Pupilles : taille, symétrie, réaction à la lumière (lampe orientée du côté externe vers le centre).",
    "Glycémie capillaire : un traumatisé peut aussi être hypoglycémique.",
    ...T.igel,
  ],
  "hemorragie.e": [
    "## Marche à suivre",
    "Retirer les vêtements mouillés, couvrir d'une couverture de survie argentée côté brillant vers le patient, puis d'une couverture.",
    "Chauffer l'ambulance. Limiter le temps de déshabillage à ce qui est nécessaire.",
  ],
  "hemorragie.antalgie": [...D.fentanyl, ...T.slowIV, ...T.in, ...D.morphine, ...T.titration],
  "hemorragie.depart": [
    "## Marche à suivre",
    "Installation sur le brancard en bloc, sans retarder le départ : moins de 10 minutes sur place pour un traumatisé grave.",
    ...T.mist,
    ...T.prealerte,
  ],
  "hemorragie.reeval": [
    "## Marche à suivre",
    "Toutes les 5 minutes pendant le transport : pansements et garrots (traces de sang, pas de reprise), pouls radial, conscience, respiration, TA.",
    "Garrot : relever l'heure de pose sur la fiche, elle sera redemandée à l'hôpital.",
    "Bascule en arrêt : bouton « Arrêt cardiaque (traumatique) » ; hémorragies déjà contrôlées, décompression des deux côtés, NaCl 2 L en route.",
  ],

  /* ═════════ Thorax ═════════ */
  "thorax.secu": [
    "## Marche à suivre",
    "Arrêter les hémorragies massives d'abord. Déshabiller le thorax, examiner devant, derrière, côté.",
    "Regarder : symétrie, plaie, bulles d'air à la respiration. Palper : crépitations, douleur, segment mobile. Ausculter : murmure vésiculaire comparé des deux côtés.",
    ...T.o2,
  ],
  "thorax.soufflante": [...T.occlusif],
  "thorax.tension": [...T.decompression, ...T.o2],
  "thorax.depart": [...T.mist, ...T.prealerte],
  "thorax.volet": [
    "## Marche à suivre",
    "Segment qui bouge à l'envers à la respiration : le stabiliser par un pansement en tampon et la main du patient posée dessus, sans bandage circulaire serré.",
    ...T.o2,
    ...T.bavu,
    ...D.fentanyl,
  ],
  "thorax.tamponnade": [
    "## Marche à suivre",
    "Choc, veines du cou gonflées, bruits du cœur assourdis après une plaie du thorax : départ immédiat, aucune perte de temps sur place.",
    ...T.vvp,
    ...T.bolus,
    ...T.prealerte,
  ],

  /* ═════════ Crâne, écrasement, brûlure ═════════ */
  "trauma-cranien.eval": [
    "## Marche à suivre",
    "Pression directe sur les plaies du cuir chevelu ou du visage, avec une compresse épaisse ; ne pas comprimer une fracture enfoncée.",
    "Corps étranger : le caler avec des compresses, sans le retirer. Œil : pansement imbibé de NaCl.",
    ...T.smr,
  ],
  "trauma-cranien.o2": [...T.o2, ...T.igel, ...T.bavu],
  "trauma-cranien.ta": [...T.bolus, ...D.ondansetron, ...T.pose],
  "trauma-cranien.neuro": [
    "## Marche à suivre",
    "Glasgow et pupilles toutes les 5 minutes, notés dans l'ordre pour repérer la tendance. Une pupille dilatée d'un seul côté ou un Glasgow qui baisse est une urgence neurochirurgicale : l'annoncer à la radio.",
    ...D.fentanyl,
  ],
  "trauma-cranien.depart": [...T.mist, ...T.prealerte],
  "ecrasement.eval": [
    "## Marche à suivre",
    "Le patient est resté coincé : annoncer la durée de l'écrasement à l'hôpital. Libération du membre = risque de choc et d'arythmie par libération de potassium.",
    ...T.garrot,
    ...T.smr,
    ...T.o2,
  ],
  "ecrasement.als": [...T.vvp, ...T.bolus, ...D.txa, ...T.perf, ...T.scope],
  "ecrasement.depart": [...T.mist, ...T.prealerte],
  "brulure.scene": [
    "## Marche à suivre",
    "Éloigner la victime de la source (flamme, produit, vapeur). Retirer les vêtements non adhérents et les bijoux avant le gonflement.",
    ...T.o2,
  ],
  "brulure.refroid": [
    "## Marche à suivre",
    "Eau tempérée en nappe douce pendant 10 minutes maximum (jamais de glace, pas d'eau trop froide). Couvrir ensuite d'un pansement non adhérent ou d'un drap propre sec.",
    "Règle des 9 pour estimer la surface (adulte) : tête 9 %, bras 9 % chacun, tronc avant 18 %, dos 18 %, jambe 18 % chacune.",
    "Brûlure oculaire : irrigation immédiate au NaCl, paupières ouvertes, de l'angle interne vers l'externe.",
  ],
  "brulure.als": [...T.vvp, ...T.io, ...T.bolus, ...D.fentanyl, ...T.titration],
  "brulure.depart": [...T.mist, ...T.prealerte, "## Marche à suivre", "Couvrir le patient pour limiter le refroidissement : une grande brûlure fait perdre la chaleur."],
  "brulure.voies": [...T.o2, ...T.bavu, ...T.igel],

  /* ═════════ Neurologie ═════════ */
  "avc.eval": [
    "## Marche à suivre",
    "Glycémie capillaire immédiate. Tête surélevée à 30–45°, rien par la bouche (risque de fausse route).",
    ...T.o2,
    "Donner un résumé clair au patient et à la famille : le transport est prioritaire.",
  ],
  "avc.befast": [
    "## Marche à suivre",
    "Visage : demander de sourire. Bras : tendre les deux bras paumes vers le haut, yeux fermés, 10 secondes. Parole : faire répéter une phrase simple. Équilibre : mettre debout seulement si prudent. Vision : perte brutale d'un champ visuel.",
    "Heure du dernier moment vu normal : se renseigner auprès des proches, noter l'heure exacte (essentielle pour le traitement).",
  ],
  "avc.als": [...T.scope, ...T.vvp, ...T.mist, "## LAMS", "LAMS : asymétrie faciale (0–1), faiblesse du bras (0–2), force de la main (0–2). Score ≥ 4 : centre de thrombectomie."],
  "convulsions.crise": [
    "## Marche à suivre",
    "Allonger au sol, protéger la tête (veste, coussin), éloigner les objets, desserrer le col. Chronométrer dès le début.",
    "Ne rien mettre dans la bouche, ne pas maintenir les membres, pas de canule pendant la crise.",
    "Après les secousses : position latérale de sécurité, aspiration si besoin, oxygène.",
  ],
  "convulsions.als": [...T.vvp, ...D.midazolam, ...T.im, ...T.in, ...T.slowIV],
  "convulsions.apres": [
    "## Marche à suivre",
    "Phase de confusion post-critique normale (10 à 30 minutes). Parler doucement, ne pas contraindre.",
    "Rechercher la cause : glycémie, traumatisme, alcool, toxique, grossesse, fièvre.",
    ...T.pose,
  ],
  "convulsions.eclampsie": [
    "## Marche à suivre",
    "Position latérale gauche (évite la compression de la veine cave). Oxygène, pression artérielle élevée à noter.",
    ...T.prealerte,
  ],
  "hypoglycemie.eval": [
    "## Marche à suivre",
    "Glycémie capillaire (désinfection, piqûre sur le côté du bout du doigt, goutte sur la bandelette). Seuil < 0,60 g/L avec signes.",
    ...T.o2,
  ],
  "hypoglycemie.sucre": [...T.po, "## Gel de glucose 15 g", "Un tube de gel, déposé entre la joue et la gencive ou avalé ; patient assis. Recontrôle à 10 minutes ; répéter si besoin."],
  "hypoglycemie.suivi": [
    "## Marche à suivre",
    "Glycémie à 10 minutes puis toutes les 15 minutes. Donner un aliment sucré lent (pain, biscuit) dès que le patient est lucide.",
    "Patient sous sulfamides ou insuline longue : risque de rechute, transport.",
  ],
  "hypoglycemie.iv": [...T.vvp, ...T.io, ...D.dextrose, ...D.glucagon, ...T.im],
  "syncope.eval": [
    "## Marche à suivre",
    "Allonger le patient, jambes surélevées, desserrer le col, laisser respirer. Glycémie, TA couché puis assis, FC, SpO2.",
    "Interroger : prodromes (sueurs, vision noire), circonstances (effort, debout prolongé), douleurs, palpitations, traumatisme à la chute.",
  ],
  "syncope.als": [...T.scope, ...T.ecg12, ...T.vvp, ...T.bolus],

  /* ═════════ Toxicologie ═════════ */
  "overdose.secu": [
    "## Marche à suivre",
    "Gants épais, ne rien ramasser à mains nues (seringues : pince et container). Sortir le patient de la zone dangereuse si possible.",
    ...T.o2,
  ],
  "overdose.opio": [...T.bavu, ...D.naloxoneIV, ...T.in, ...T.im, ...T.vvp, ...T.scope],
  "overdose.suivi": [
    "## Marche à suivre",
    "Surveillance toutes les 2 à 3 minutes de la respiration. Refus de transport : évaluer d'abord le discernement (fiche « Refus de soins »).",
    ...T.tracer,
  ],
  "overdose.stim": [
    "## Marche à suivre",
    "Environnement calme, peu de monde, voix posée. Surveillance de la température, de la FC, de la TA.",
    ...T.vvp,
    ...D.midazolam,
    ...T.im,
    ...T.in,
    "Patient contenu ou sédaté : surveillance continue de la respiration ; jamais sur le ventre.",
  ],
  "overdose.autre": [
    "## Marche à suivre",
    "Alcool : glycémie, rechercher un traumatisme crânien, position latérale de sécurité si somnolent.",
    ...D.calcium,
    ...D.bicarbonate,
    "DuoDote : une injection IM cuisse (auto-injecteur), répétée selon les signes ; équipe protégée avant tout.",
  ],
  "monoxyde.secu": [
    "## Marche à suivre",
    "Aérer, couper la source si possible sans y exposer l'équipe. Détecteur de CO si disponible.",
    "Sortir le patient à l'air frais, au repos strict (le moindre effort consomme de l'oxygène).",
  ],
  "monoxyde.o2": [...T.o2],
  "monoxyde.als": [...T.scope, ...T.bavu],

  /* ═════════ Environnement ═════════ */
  "hyperthermie.eval": [
    "## Marche à suivre",
    "Température tympanique ou rectale. Zone fraîche, vêtements extérieurs retirés, eau fraîche en brumisateur et ventilation, poches froides aux aisselles, cou, aine si T > 40 °C.",
    "Boisson fraîche par petites gorgées si le patient est parfaitement conscient ; glycémie si confusion.",
  ],
  "hyperthermie.als": [...T.vvp, ...T.bolus],
  "hypothermie.eval": [
    "## Marche à suivre",
    "Manipuler avec douceur (risque de trouble du rythme). Retirer les vêtements mouillés, couvrir, isoler du sol.",
    "Poches chaudes à l'aine, au cou et sur les côtés du thorax (pas directement sur la peau). Pouls vérifié pendant une minute.",
    "Boisson tiède sucrée seulement si le patient est conscient et frissonne.",
  ],
  "hypothermie.als": [...T.scope, ...T.ecg12, ...T.vvp],
  "morsure.eval": [
    "## Marche à suivre",
    "Calmer le patient, limiter les mouvements, immobiliser le membre à hauteur du cœur avec une attelle. Retirer bagues et montres avant le gonflement.",
    "Marquer au feutre le bord de la rougeur avec l'heure, pour suivre l'extension. Ne pas inciser, ne pas sucer, pas de garrot.",
  ],
  "morsure.als": [...T.vvp, ...D.ondansetron],
  "electrisation.secu": [
    "## Marche à suivre",
    "Couper la source (disjoncteur) ou attendre l'intervention du service compétent ; ne toucher le patient qu'une fois la zone sèche et le courant coupé.",
  ],
  "electrisation.eval": [
    "## Marche à suivre",
    "Rechercher les points d'entrée et de sortie du courant (mains, pieds), les brûlures profondes cachées, une chute associée (SMR si doute).",
    ...T.o2,
  ],
  "electrisation.als": [...T.scope, ...T.ecg12, ...T.vvp, ...D.ondansetron],

  /* ═════════ Obstétrique ═════════ */
  "accouchement.decision": [
    "## Marche à suivre",
    "Demander à la patiente : première grossesse ou non, terme, envie de pousser, perte des eaux. Inspecter le périnée (couronnement).",
    "Si un des trois signes est présent : accoucher sur place. Sinon transport en position latérale gauche vers la maternité.",
  ],
  "accouchement.accompagner": [
    "## Marche à suivre",
    "Préparer le kit : serviettes, clamps, bonnet, couverture. Gants, protection du visage. Mère semi-assise, jambes fléchies, intimité.",
    "Soutenir la tête avec la paume, sans tirer, sortie lente (conseiller à la mère de souffler entre les poussées). Vérifier le cordon au cou : le passer par-dessus la tête s'il est lâche.",
    "Épaules : sortie spontanée, la tête légèrement orientée vers le bas puis vers le haut. Soutenir le corps, noter l'heure.",
  ],
  "accouchement.nouveau-ne": [
    "## Marche à suivre",
    "Sécher énergiquement, stimuler le dos et la plante des pieds, retirer la serviette mouillée, bonnet, peau contre peau.",
    "Cordon : attendre environ 60 secondes, deux clamps à 10 cm et 15 cm de l'abdomen, couper entre les deux.",
    ...T.bavu,
    "BAVU nouveau-né : 40 insufflations par minute, très faible volume, air ambiant pendant 90 secondes. Massage si FC < 60 malgré 30 secondes de ventilation efficace : 3 compressions pour 1 insufflation.",
  ],
  "accouchement.delivrance": [
    "## Marche à suivre",
    "Ne jamais tirer sur le cordon. Attendre la sortie spontanée (jusqu'à 30 minutes), poser le placenta dans un sac pour l'hôpital.",
    "Masser l'utérus par-dessus le ventre pour qu'il se contracte.",
  ],
  "accouchement.complic": [
    "## Marche à suivre",
    "Cordon visible avant le bébé : mère à genoux, bassin surélevé, repousser doucement la présentation avec la main gantée. Siège ou épaules bloquées : ne pas tirer, départ immédiat.",
    ...T.prealerte,
  ],
  "accouchement.hpp": [
    "## Marche à suivre",
    "Masser le fond de l'utérus (au-dessus du nombril, main à plat) en rond ferme jusqu'à sensation de boule dure. Mettre le bébé au sein.",
    ...T.vvp,
    ...T.bolus,
    ...D.txa,
    ...T.perf,
    ...T.prealerte,
  ],

  /* ═════════ Pédiatrie ═════════ */
  "arret-pediatrique.evalped": [
    "## Marche à suivre",
    "Triangle d'évaluation depuis le seuil : apparence, respiration, couleur. Avant de toucher l'enfant.",
    "Utiliser la réglette pédiatrique pour le poids (jamais de calcul de tête) et pour les doses.",
    "Parler à hauteur de l'enfant, laisser le parent à proximité ; gestes lents, expliqués avec des mots simples.",
  ],
  "arret-pediatrique.rcpped": [
    "## Marche à suivre",
    "Ventiler d'abord : 5 insufflations initiales au BAVU de taille adaptée, tête en position neutre (nourrisson) ou légère extension (enfant).",
    "Compressions : nourrisson avec deux doigts ou deux pouces (encerclement), enfant avec une main. Profondeur du tiers du thorax, 100 à 120/min, 15:2 à deux sauveteurs.",
    ...T.dae,
    "Électrodes pédiatriques (ou position antéro-postérieure si taille insuffisante), 2 J/kg puis 4 J/kg.",
  ],
  "arret-pediatrique.drugsped": [
    "## Marche à suivre",
    "Dose prise sur la réglette ou le tableau, relue à voix haute par un second intervenant. Dilution en seringue de 1 mL ou 10 mL pour pouvoir mesurer des fractions de millilitre.",
    ...T.io,
    "Adrénaline pédiatrique : 0,01 mg/kg soit 0,1 mL/kg de la solution 0,1 mg/mL, mesurée dans une seringue de 1 mL, injectée en IV/IO directe puis flush NaCl 5 à 10 mL. Maximum 1 mg, toutes les 3 à 5 minutes.",
    "Amiodarone 5 mg/kg (300 mg maximum) en IV/IO directe après le 3e choc, flush identique. Dextrose 10 % 5 mL/kg en perfusion rapide si glycémie < 0,60 g/L.",
    ...T.pushIV,
    "Bolus de liquide : 20 mL/kg en seringue de 50 mL poussée sur robinet 3 voies, réévaluation après chaque bolus.",
  ],
};
