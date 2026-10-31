/**
 * Gestes techniques réutilisables : préparation, exécution, adaptation.
 * Les chaînes commençant par « ## » sont rendues comme intertitres dans la fiche.
 * Ton institutionnel, aucun texte RP prérédigé.
 */

export const T = {
  /* ───────────── Sécurité d'administration ───────────── */
  verif: [
    "## Avant toute administration",
    "Six vérifications : bon patient (identité, poids estimé), bon médicament (lu sur l'ampoule, pas sur l'emballage), bonne dose (prise dans la fiche, jamais de tête), bonne voie, bon moment (délai depuis la dose précédente), bonne traçabilité.",
    "Allergies demandées avant le premier médicament. Allergie connue : on ne donne pas, on le note et on le transmet.",
    "Boucle fermée : le prescripteur annonce « Adrénaline 1 mg IV ? », l'exécutant répète « Adrénaline 1 mg IV, confirmé », puis annonce « Administré à 14 h 32 ». Un médicament non tracé n'existe pas pour l'hôpital.",
    "Contrôler la date de péremption et l'aspect du produit (limpide, sans particule) ; jeter l'aiguille dans le container OPTC immédiatement après usage.",
  ],

  /* ───────────── Voies d'abord ───────────── */
  vvp: [
    "## Pose d'une voie veineuse périphérique",
    "Matériel prêt sur un plateau avant de piquer : gants, garrot, désinfectant, compresses, cathéter du bon calibre, seringue de rinçage NaCl 10 mL, tubulure purgée, pansement transparent, étiquette, container OPTC.",
    "Calibre : 18G vert en standard adulte (arrêt, douleur thoracique), 16G gris ou 14G orange en choc ou hémorragie, 20G rose pour un patient stable, 22G bleu pour une veine fragile, une personne âgée ou un enfant.",
    "Purger la tubulure : suspendre la poche, ouvrir la molette, laisser couler jusqu'au bout de la ligne, aucune bulle ; refermer.",
    "Choisir le bras : pli du coude, avant-bras ou dos de la main. Éviter un bras blessé, brûlé ou du côté d'une fistule de dialyse. Dans un trauma, le bras opposé à la blessure principale.",
    "Garrot veineux 10 cm au-dessus du site, serré assez pour gonfler la veine sans couper le pouls radial. Palper en partant de la main et en remontant : une bonne veine est souple, rebondie, sans pulsation.",
    "Désinfecter en spirale du centre vers l'extérieur, annoncer « désinfection », laisser sécher 30 secondes (le produit n'agit pas humide).",
    "Peau tendue avec la main libre, biseau vers le haut, angle de 15 à 30°. Au reflux de sang dans la chambre du cathéter, baisser l'angle, avancer encore de 2 mm, puis pousser le cathéter seul en maintenant l'aiguille immobile.",
    "Retirer le garrot, comprimer la veine en amont de la pointe du cathéter, retirer l'aiguille et la jeter dans l'OPTC. Brancher la seringue de rinçage et injecter 10 mL de NaCl : pas de gonflement, pas de douleur, pas de résistance = voie fiable.",
    "Brancher la tubulure, fixer au pansement transparent, boucler la tubulure pour éviter une traction, étiqueter (heure, calibre, site) et tracer sur la fiche.",
    "Adaptation : patient agité ou ambulance en mouvement, demander à un équipier de tenir le bras ; veines invisibles, bras en déclivité et main chaude quelques instants ; deux tentatives ou 90 secondes sans succès chez un patient critique : passer en intra-osseuse sans insister.",
    "Complications : hématome (retirer, comprimer, repiquer ailleurs), gonflement ou douleur à l'injection = extravasation (arrêter, retirer, nouvelle voie), garrot oublié (bras gonflé).",
  ],
  io: [
    "## Voie intra-osseuse (IO)",
    "Indication : patient critique (arrêt, choc, brûlure grave, écrasement) et voie veineuse impossible après deux essais ou 90 secondes. Chaque minute sans médicament compte.",
    "Site prioritaire : tibia proximal, face interne plate, deux doigts (environ 2 cm) sous la tubérosité tibiale. Second choix : humérus proximal, tubercule majeur, bras collé au corps et main posée sur le ventre.",
    "Contre-indications : os fracturé ou déjà piqué, brûlure ou infection au site, prothèse, repères introuvables : changer de site.",
    "Matériel : perceuse EZ-IO, aiguille de 15, 25 ou 45 mm selon la corpulence, seringue de NaCl 10 mL, tubulure IO purgée, pansement de fixation, lidocaïne 2 % pour le patient conscient.",
    "Désinfecter et laisser sécher. Poser l'aiguille à 90° sur la peau, pousser jusqu'au contact osseux : un repère noir de 5 mm doit rester visible.",
    "Percer sans forcer jusqu'à la perte de résistance (sensation de vide), relâcher la gâchette, retirer le mandrin et le jeter dans l'OPTC.",
    "Patient conscient : l'IO est très douloureuse. Injecter lentement 40 mg de lidocaïne 2 %, attendre 60 secondes avant le rinçage.",
    "Rincer avec 10 mL de NaCl en poussant franchement : l'IO est bonne si le liquide passe facilement et sans gonflement autour du site. Fixer, brancher la tubulure, tracer le site et l'heure.",
    "Perfusion rapide : mettre la poche sous pression (sans pression, le débit IO est faible). Surveiller le site : gonflement = extravasation, retirer.",
  ],

  /* ───────────── Techniques d'administration IV ───────────── */
  pushIV: [
    "## Technique : IV directe (« push »)",
    "Seringue du médicament montée sur le robinet 3 voies ou le site d'injection de la tubulure ; fermer la tubulure en amont (clamper) pour que le produit parte vers le patient et non vers la poche.",
    "Pousser à vitesse normale (environ 10 à 30 secondes selon le volume), sans à-coup, puis rincer aussitôt avec 10 mL de NaCl (20 mL en arrêt cardiaque) pour amener le produit dans la circulation.",
    "Rouvrir la tubulure, vérifier que la perfusion coule librement, tracer médicament, dose, voie, heure.",
  ],
  slowIV: [
    "## Technique : IV lente (« slow push »)",
    "Même montage que l'IV directe, mais le produit est poussé par petites fractions sur la durée de la fiche (1 minute ou plus), en regardant le patient et non la seringue.",
    "Repère pratique : 1 mL toutes les 10 à 15 secondes pour un volume de 1 à 2 mL ; fractionner et faire une pause à chaque fraction si le volume est plus grand.",
    "Interrompre l'injection si la respiration ralentit, si la TA chute, ou si le patient se plaint de douleur au point de ponction ; reprendre plus lentement après réévaluation.",
    "Rincer au NaCl 10 mL à la fin.",
  ],
  rapidIV: [
    "## Technique : IV rapide (« rapid push »)",
    "Voie au pli du coude impérativement (la veine proche du cœur évite la dilution), robinet 3 voies monté sur le cathéter.",
    "Brancher ensemble la seringue du médicament et une seringue de 20 mL de NaCl sur le robinet. Bras du patient surélevé, enregistrement continu du tracé en cours.",
    "Pousser le médicament en 1 à 2 secondes, puis le NaCl immédiatement derrière, sans pause : le médicament est détruit en quelques secondes dans le sang.",
    "Prévenir le patient conscient : oppression thoracique, bouffée de chaleur, quelques secondes désagréables, sans danger.",
  ],
  bolus: [
    "## Technique : bolus de liquide",
    "Un push est un médicament poussé à la seringue ; un bolus est un volume de liquide. On annonce « bolus de 250 mL de NaCl », pas « push de NaCl ».",
    "Poche de NaCl 0,9 % sur la voie de gros calibre, purgée, brassard de pression gonflé à 300 mmHg si la perfusion doit être rapide (IO : pression obligatoire).",
    "Ouvrir la molette en grand (débit libre) jusqu'au volume annoncé ; chronométrer, le bolus de 250 mL passe en quelques minutes.",
    "Après chaque bolus : pouls radial (présent, plus ample), conscience, TA, respiration et auscultation des bases à la recherche de crépitants. Un seul critère de réévaluation ne suffit pas.",
    "Arrêter au premier signe d'œdème pulmonaire (dyspnée nouvelle, crépitants, SpO2 qui baisse) ou dès que la cible tensionnelle du protocole est atteinte.",
  ],
  perf: [
    "## Technique : perfusion sur une durée imposée (exemple : TXA)",
    "Dilution : ajouter le produit dans la poche de 50 à 100 mL de NaCl, retourner la poche deux fois, étiqueter (produit, dose, heure) avant de la suspendre.",
    "Brancher sur une tubulure dédiée ou en Y avec clamp en amont de la poche de remplissage pour ne pas diluer ni interrompre l'autre perfusion.",
    "Débit réglé pour vider la poche en 10 minutes (environ 10 mL par minute pour 100 mL) : ouvrir la molette, contrôler à la montre à 5 minutes que la moitié est passée, ajuster.",
    "Jamais en bolus rapide. Surveiller TA, douleur au point de ponction, et noter l'heure de début et de fin.",
  ],
  titration: [
    "## Technique : titration",
    "Petites doses répétées jusqu'à l'effet recherché : dose, attente du délai d'action, réévaluation, nouvelle dose seulement si l'effet est insuffisant et si le plafond n'est pas atteint.",
    "À chaque dose : fréquence respiratoire, SpO2, TA, conscience, intensité de la douleur (échelle 0 à 10) notées avec l'heure.",
    "Antidote ou BAVU prêt avant la première dose.",
  ],
  pushDose: [
    "## Technique : adrénaline push-dose (0,01 mg/mL)",
    "Préparation : prélever 1 mL d'adrénaline 0,1 mg/mL dans une seringue de 10 mL, compléter à 10 mL avec 9 mL de NaCl, mélanger par retournement, étiqueter « adrénaline 0,01 mg/mL ».",
    "Donner 1 mL en IV directe toutes les 1 à 5 minutes, cible TA systolique > 90 mmHg. Ne jamais confondre avec l'adrénaline pure 0,1 mg/mL ni 1 mg/mL.",
    "Surveillance continue au scope : tachycardie et arythmie sont des signes de surdosage, stopper les doses.",
  ],

  /* ───────────── Autres voies ───────────── */
  im: [
    "## Technique : injection intramusculaire (IM)",
    "Site : face externe de la cuisse (vaste externe, tiers moyen, 5 mL maximum) ou deltoïde (2 mL maximum). L'injection peut traverser un vêtement fin en urgence vitale.",
    "Désinfecter, laisser sécher, tendre la peau avec la main non dominante.",
    "Piquer d'un geste rapide à 90°, en laissant environ 1 cm d'aiguille hors de la peau. Aspirer : reflux de sang = retirer et recommencer ailleurs.",
    "Injecter lentement, environ 1 mL par 10 secondes. Attendre 10 secondes avant de retirer l'aiguille, jeter dans l'OPTC, tracer l'heure et le site.",
  ],
  in: [
    "## Technique : voie intranasale (IN)",
    "Atomiseur monté sur une seringue ; volume maximum de 1 mL par narine. Dose supérieure à 1 mL : la répartir entre les deux narines.",
    "Dégager le nez (moucher ou aspirer s'il y a du sang ou des sécrétions). Tête légèrement en arrière si le patient est conscient, ou en position neutre s'il est allongé.",
    "Introduire l'embout dans la narine, orienté vers l'arrière et le côté (vers l'oreille), et pousser d'un geste franc pour obtenir un brouillard.",
    "Délai d'action de 3 à 5 minutes : ne pas répéter trop tôt, réévaluer à 5 minutes.",
  ],
  sl: [
    "## Technique : voie sublinguale (SL)",
    "Patient assis, bouche humide. Mesurer la TA avant chaque dose.",
    "Pulvériser ou déposer sous la langue, bouche fermée ensuite ; ne pas avaler ni parler pendant la minute qui suit. Délai d'action de 1 à 3 minutes.",
    "Prévenir d'un possible mal de tête ou vertige ; patient assis ou allongé pour limiter le risque de malaise.",
  ],
  po: [
    "## Technique : voie orale (PO)",
    "Uniquement chez un patient conscient, qui avale, sans nausée importante. Pas de voie orale chez un patient somnolent ou convulsant.",
    "Position assise ; donner une gorgée d'eau si nécessaire. Délai d'action de 15 à 30 minutes : ne pas répéter trop vite.",
    "Noter l'heure exacte de la prise.",
  ],
  neb: [
    "## Technique : nébulisation",
    "Monter le nébuliseur : chambre, médicament versé (volume complété au NaCl si la notice le demande), embout buccal ou masque, tubulure sur l'oxygène.",
    "Débit d'oxygène de 6 à 8 L/min jusqu'à apparition d'un brouillard régulier. Patient assis, qui respire calmement, lèvres serrées autour de l'embout.",
    "Durée de 5 à 10 minutes jusqu'à la fin de la chambre. Surveiller fréquence cardiaque (tachycardie, tremblements) et SpO2.",
    "Réévaluer après chaque passage : fréquence respiratoire, capacité à parler, sifflements.",
  ],
  o2: [
    "## Oxygénothérapie : choix du dispositif",
    "Hypoxie légère : lunettes nasales 2 à 6 L/min. Hypoxie modérée : masque simple 8 à 10 L/min. Choc, trauma crânien, CO, pneumothorax ou hypoxie non corrigée : masque haute concentration ou BAVU à 15 L/min. Cible 94 à 98 % (88 à 92 % chez l'insuffisant respiratoire chronique connu, avec lunettes à 1 à 4 L/min).",
    "Masque haute concentration : gonfler le ballon réservoir avant de l'appliquer, vérifier l'étanchéité, régler le débit à 15 L/min.",
    "SpO2 normale (≥ 94 %) : pas d'oxygène, même en cas de douleur. Réévaluer la SpO2 à chaque contrôle.",
  ],
  bavu: [
    "## Ventilation au BAVU",
    "Choisir la taille (adulte, enfant, nourrisson), assembler ballon, réservoir et masque, relier à l'oxygène à 15 L/min.",
    "Ouvrir les voies aériennes (bascule de tête et élévation du menton, subluxation en cas de suspicion de lésion du rachis), canule de Guedel si le patient est inconscient sans réflexe nauséeux.",
    "Technique à deux secouristes de préférence : l'un tient le masque des deux mains (C et E), l'autre presse le ballon à deux mains.",
    "Adulte : 1 insufflation toutes les 6 secondes (10 par minute), juste assez pour voir le thorax se soulever. Compter à voix haute pour ne pas hyperventiler. Si le thorax ne se soulève pas : position de la tête, étanchéité, obstruction, aspiration.",
  ],
  igel: [
    "## Dispositif supraglottique (i-gel)",
    "Taille selon le poids : 3 (30 à 60 kg), 4 (50 à 90 kg), 5 (> 90 kg) chez l'adulte ; 2 et 2,5 chez l'enfant.",
    "Lubrifier la face arrière, tête en légère extension (sauf suspicion de lésion du rachis), glisser le dispositif le long du palais jusqu'à une résistance nette. Pause de compression la plus courte possible.",
    "Raccorder BAVU et capteur d'EtCO2, ventiler, confirmer : courbe de capnographie présente et stable, murmure aux deux bases, soulèvement symétrique du thorax. Fixer.",
    "Re-vérifier après chaque déplacement (brancard, ambulance, hôpital).",
  ],
  aspiration: [
    "## Aspiration",
    "Aspirateur testé avant le geste, sonde rigide de gros calibre pour la bouche. Pré-oxygéner, aspirer 10 secondes maximum par passage, en retirant la sonde.",
    "Patient bien oxygéné entre deux passages ; ne jamais aspirer en enfonçant la sonde au-delà de ce qui est visible.",
  ],

  /* ───────────── Monitorage et électricité ───────────── */
  scope: [
    "## Mise en place du moniteur (LIFEPAK 15)",
    "Torse dénudé et sec, rasage rapide des zones poilues si nécessaire ; peau essuyée pour une bonne adhérence des électrodes.",
    "3 ou 4 dérivations de monitorage aux racines des membres ; vérifier la qualité du tracé (pas de bruit, QRS bien visible) et régler le gain.",
    "Brassard à tension automatique sur le bras opposé à la voie veineuse, capteur de SpO2 au doigt (ongle sans vernis, main chaude), capnographie en ligne ou sur le BAVU si disponible.",
    "Régler les alarmes ; ne jamais déplacer le patient sans s'assurer que les câbles suivent.",
  ],
  ecg12: [
    "## ECG 12 dérivations",
    "Patient allongé ou demi-assis, détendu, ne parle pas ni ne bouge pendant l'enregistrement. Peau sèche, rasée si besoin.",
    "Dérivations précordiales : V1 4e espace intercostal à droite du sternum, V2 à gauche du sternum, V4 5e espace sur la ligne médio-claviculaire, V3 entre V2 et V4, V5 à l'aplomb du pli axillaire antérieur au niveau de V4, V6 sur la ligne médio-axillaire au même niveau. Chez la femme, électrodes sous le sein et non dessus.",
    "Dérivations des membres posées sur le haut des bras et des cuisses (ou sur le tronc, pas sur les moignons).",
    "Vérifier un tracé exploitable (pas de tremblement, ligne de base stable), imprimer ou transmettre, noter l'heure sur le tracé.",
    "Sus-décalage du segment ST ≥ 1 mm dans deux dérivations voisines : alerte « infarctus » vers le centre cardiologique.",
  ],
  dae: [
    "## Défibrillation avec DAE",
    "Torse nu et sec (essuyer la sueur, l'eau), rasage rapide si nécessaire, retrait de tout patch médicamenteux sur le site des électrodes.",
    "Électrodes : une sous la clavicule droite, l'autre sous l'aisselle gauche, bien à plat. Suivre les consignes vocales.",
    "Personne ne touche le patient pendant l'analyse. Oxygène écarté du torse. Patient sec, pas de flaque d'eau ni de métal conducteur à contact.",
    "À « choc conseillé » : annoncer « Tout le monde s'écarte », regarder autour (pieds, mains, brancard), appuyer, puis reprendre les compressions immédiatement. Pause de moins de 10 secondes.",
  ],
  defib: [
    "## Défibrillation manuelle (ALS)",
    "Électrodes en position antéro-latérale, ou antéro-postérieure si le thorax est difficile ; changer de position à partir du 3e choc.",
    "Charger le défibrillateur pendant que les compressions continuent (« je charge à 200 joules ») pour limiter la pause.",
    "À la fin de la charge : « Tout le monde s'écarte » ; vérifier visuellement que personne n'est en contact avec le patient ni le brancard, que l'oxygène est écarté. Interrompre le massage uniquement à cet instant.",
    "Délivrer le choc en gardant les deux boutons enfoncés jusqu'à la décharge, puis annoncer « choc délivré » et reprendre les compressions immédiatement sans contrôler le pouls.",
    "Énergie croissante : 200 J, puis 300 J, puis 360 J. Pause de compressions la plus courte possible (moins de 5 secondes).",
  ],
  rcp: [
    "## Réanimation cardio-pulmonaire de qualité",
    "Patient sur un plan dur, thorax dénudé. Talon de la main au centre du thorax, bras tendus, épaules à l'aplomb des mains, verrouillage des coudes.",
    "Fréquence de 100 à 120 par minute, enfoncement de 5 à 6 cm, relâchement complet entre chaque compression. Ne pas appuyer sur le thorax pendant le relâchement.",
    "Rapport 30 compressions pour 2 insufflations ; une fois le dispositif aérien posé, compressions continues et 1 insufflation toutes les 6 secondes.",
    "Relayer le masseur toutes les 2 minutes (au moment de l'analyse), pause maximale de 10 secondes. Annonce à voix haute du décompte et du temps écoulé par le chef d'équipe.",
    "EtCO2 supérieure à 10 mmHg : massage efficace ; inférieure : changer de masseur ou revoir la technique.",
  ],
  cpap: [
    "## Pression positive continue (CPAP)",
    "Expliquer le principe (la pression ouvre les petites bronches et chasse l'eau du poumon) et rassurer : le masque peut surprendre.",
    "Choisir la taille du masque, le tenir à la main sur le visage avant de fixer les sangles, patient assis.",
    "Débuter à 5 cmH2O avec FiO2 élevée, augmenter progressivement jusqu'à 10 cmH2O selon la tolérance ; surveiller SpO2, fréquence respiratoire et travail respiratoire.",
    "Contre-indications : conscience altérée, vomissements, pneumothorax suspecté, hypotension. Retirer le masque en cas de vomissements.",
    "Réévaluer toutes les 5 minutes ; l'albutérol peut être nébulisé dans le circuit.",
  ],
  cardioversion: [
    "## Cardioversion synchronisée",
    "Patient conscient : sédation avant le choc (midazolam 5 mg IV/IO), BAVU et aspiration prêts, voie veineuse fiable, électrodes posées, oxygène.",
    "Activer le mode SYNC et vérifier que les marqueurs s'affichent bien sur chaque QRS ; régler l'énergie à 100 J.",
    "Annoncer « Tout le monde s'écarte », vérifier visuellement l'absence de contact, maintenir le bouton de décharge enfoncé jusqu'au choc (léger décalage normal, le choc part sur le prochain QRS).",
    "Contrôler immédiatement le rythme et le pouls. Si la tachycardie persiste : réactiver le mode SYNC (il se désactive après chaque choc), passer à 200, 300 puis 360 J.",
    "Si le patient devient sans pouls, passer en défibrillation non synchronisée et appliquer le protocole d'arrêt cardiaque.",
  ],
  pacing: [
    "## Stimulation électrique externe",
    "Électrodes en position antéro-postérieure : une sur la poitrine gauche, une dans le dos. Mode « demande », fréquence de 70 à 80 par minute.",
    "Courant augmenté progressivement à partir de 30 mA jusqu'à la capture, c'est-à-dire un QRS large derrière chaque impulsion et un pouls palpable synchrone (carotide ou fémoral : les contractions musculaires peuvent tromper au niveau du thorax).",
    "Régler ensuite le courant à environ 10 mA au-dessus du seuil de capture.",
    "Procédure douloureuse : analgésie et sédation (fentanyl, midazolam) chez le patient conscient, après avoir recherché une TA suffisante.",
    "Contrôle de la capture à chaque changement de position du patient.",
  ],

  /* ───────────── Trauma ───────────── */
  garrot: [
    "## Pose d'un garrot",
    "Indication : compression directe insuffisante, amputation, objet planté, saignement abondant d'un membre.",
    "Placer le garrot 5 à 7 cm au-dessus de la plaie, jamais sur une articulation, sur la peau ou un vêtement lisse sans poche ni objet.",
    "Serrer la sangle puis le tourniquet (tige) jusqu'à l'arrêt complet du saignement et la disparition du pouls en aval ; verrouiller la tige.",
    "Saignement persistant : deuxième garrot juste au-dessus du premier.",
    "Noter l'heure de pose sur le garrot et sur la fiche. Le membre reste exposé. Ne jamais desserrer sans l'accord d'un médecin.",
  ],
  packing: [
    "## Méchage d'une plaie hémorragique (jonction, cou)",
    "Gaze hémostatique tassée dans la plaie, en poussant avec les doigts jusqu'au fond, en suivant le trajet, par plis successifs.",
    "Compression directe continue de 3 minutes sans relâcher ni vérifier, avec le poids du corps si besoin.",
    "Pansement compressif par-dessus, serré, qui maintient la pression sans retirer la gaze.",
  ],
  occlusif: [
    "## Pansement occlusif à valve",
    "Essuyer la plaie (sang, sueur) pour que le pansement adhère. Appliquer à l'expiration, sur la plaie, centre du dispositif sur l'orifice, valve vers le bas.",
    "À défaut de dispositif à valve : pansement fixé sur trois côtés seulement, le quatrième laissant l'air s'échapper.",
    "Rechercher une plaie de sortie dans le dos et la couvrir aussi. Surveiller l'apparition d'un pneumothorax sous tension : si la détresse s'aggrave, soulever un coin du pansement pour laisser sortir l'air.",
  ],
  decompression: [
    "## Décompression à l'aiguille",
    "Indications : thorax traumatique avec détresse qui s'aggrave, murmure absent d'un côté, TA qui chute, veines du cou gonflées, SpO2 < 90 % malgré l'oxygène ; arrêt traumatique en AESP.",
    "Matériel : cathéter 14G de 8 cm, désinfectant, compresses, pansement.",
    "Site : 2e espace intercostal sur la ligne médio-claviculaire (juste au-dessus de la 3e côte), ou 4e–5e espace sur le côté, juste en avant de la ligne axillaire antérieure.",
    "Désinfecter, piquer perpendiculairement à la paroi, au bord supérieur de la côte inférieure (pour éviter le paquet vasculo-nerveux), jusqu'à la sortie d'air sifflante.",
    "Avancer le cathéter jusqu'à la garde, retirer le mandrin, fixer ; réévaluer la respiration. Le cathéter peut se boucher : réévaluer et répéter si besoin.",
  ],
  smr: [
    "## Immobilisation du rachis (SMR)",
    "Un intervenant derrière la tête : paumes sur les côtés du crâne, maintien de la tête en position neutre et alignée avec le tronc. Cet intervenant ne lâche plus avant l'installation complète.",
    "Collier cervical à la bonne taille ; il ne constitue pas une SMR à lui seul. Rouler le patient en bloc à plusieurs, sur annonce d'un chef.",
    "Plan dur ou matelas à dépression, sangles torse, bassin, jambes ; tête maintenue par cales latérales.",
    "Examen neurologique avant et après mobilisation : sensibilité et motricité des quatre membres.",
  ],
  pose: [
    "## Position du patient",
    "Position de confort pour le patient conscient. Allongé et jambes surélevées en cas de malaise ou d'hypotension (sans détresse respiratoire). Latérale de sécurité s'il est inconscient et respire. Demi-assis ou assis en cas de dyspnée.",
  ],

  /* ───────────── Transmission ───────────── */
  mist: [
    "## Transmission MIST (radio ou à l'arrivée)",
    "M — Mécanisme : circonstances, heure. I — Lésions (Injuries) : localisation, gravité. S — Signes vitaux : FC, TA, FR, SpO2, Glasgow, tendance. T — Traitements : gestes, médicaments avec doses et heures.",
    "Format radio : indicatif, âge et sexe, motif, état, heure d'arrivée estimée, demande éventuelle de renfort ou d'équipe spécialisée.",
  ],
  prealerte: [
    "## Pré-alerte de l'hôpital",
    "Appel radio avant l'arrivée : âge, sexe, motif, état (stable ou instable), traitements donnés, besoins (salle de déchoquage, cardiologie, maternité), heure d'arrivée estimée.",
    "Répéter l'essentiel à l'arrivée en face à face, remettre les documents (ECG, fiche).",
  ],
  tracer: [
    "## Traçabilité",
    "Inscrire sur la fiche : médicament, dose, voie, heure, effet observé ; geste, heure, tentative. La fiche suit le patient jusqu'au service d'accueil.",
  ],
};

export type Technique = keyof typeof T;

/* ───────────── Fiches médicaments ───────────── */
export const D = {
  adrArret: [
    "## Adrénaline 0,1 mg/mL (arrêt cardiaque)",
    "Seringue préremplie de 10 mL = 1 mg. Annoncer « adrénaline 1 mg IV » et recevoir la confirmation avant d'injecter.",
    "IV/IO directe (push) sur une voie fiable, bras surélevé, puis flush NaCl 20 mL. Notée avec l'heure : prochaine dose dans 3 à 5 minutes, 3 mg au maximum.",
    "Réservée au patient sans pouls : l'adrénaline à cette concentration chez un patient qui a un pouls peut provoquer une arythmie mortelle.",
  ],
  adrIM: [
    "## Adrénaline 1 mg/mL (anaphylaxie, asthme grave)",
    "Dose adulte de 0,5 mg (0,5 mL) à prélever avec une seringue de 1 mL graduée et une aiguille IM ; contrôler la concentration inscrite sur l'ampoule (1 mg/mL) : ne jamais la confondre avec 0,1 mg/mL.",
    "Voie IM, face antéro-externe de la cuisse, possible à travers le vêtement fin : piqûre à 90°, injection lente d'environ 10 secondes, aiguille retirée après 10 secondes, massage doux du site.",
    "Auto-injecteur (BLS) : retirer le capuchon de sécurité, extrémité sur la cuisse à 90°, enfoncer et maintenir environ 3 secondes, masser 10 secondes.",
    "Répétition possible toutes les 10 minutes, 3 doses, avec contact OLMC. Effets attendus : tremblements, palpitations, pâleur : normaux.",
  ],
  amio: [
    "## Amiodarone",
    "300 mg IV/IO puis 150 mg (450 mg au maximum), réservée à la FV/TV sans pouls réfractaire, après le 3e choc.",
    "Préparer selon le conditionnement disponible (dilution si flacon à diluer) ; injection directe pendant la reprise des compressions, flush NaCl 20 mL.",
  ],
  atropine: [
    "## Atropine",
    "1 mg IV/IO directe, toutes les 3 à 5 minutes, 3 mg au maximum ; flush NaCl 10 mL. Ne jamais donner de dose inférieure à 0,5 mg (bradycardie paradoxale).",
    "Peu efficace dans les blocs de haut degré : ne pas attendre pour préparer la stimulation.",
    "Réévaluer à 3 minutes : fréquence, TA, conscience.",
  ],
  naloxoneIV: [
    "## Naloxone (titration)",
    "Ampoule de 0,4 mg/mL. IV/IO : 0,4 mg poussé en 10 à 15 secondes, flush 10 mL. Réévaluation toutes les 2 à 3 minutes, 8 mg au maximum.",
    "IN ou IM : 2 mg (1 mg par narine à l'atomiseur, ou cuisse en IM). Effet à 3 à 5 minutes.",
    "Objectif : une respiration correcte (> 10/min), pas un réveil complet. Une dose trop forte entraîne un réveil brutal et agressif, un sevrage, des vomissements : se préparer à contenir et à protéger.",
    "BAVU en main avant la première dose ; la naloxone peut cesser d'agir avant l'opioïde, surveiller en continu et transporter.",
  ],
  midazolam: [
    "## Midazolam",
    "Convulsions : 10 mg IM/IN (2 mL à 5 mg/mL, 1 mL par narine) ou 5 mg IV/IO (1 mL) ; répéter une fois après 2 minutes ; 10 mg au maximum avant contact OLMC. Sédation : 5 mg.",
    "IV : injection lente sur environ 1 minute, en regardant le thorax ; IM : cuisse ; IN : atomiseur.",
    "BAVU et aspiration prêts avant l'injection : risque d'apnée. Monitorage continu SpO2, EtCO2.",
  ],
  fentanyl: [
    "## Fentanyl",
    "50 µg toutes les 5 minutes, 150 µg au maximum (250 µg sur ordre OLMC). IV/IO/IM lente sur 1 à 2 minutes, ou IN à l'atomiseur (volume ≤ 1 mL par narine).",
    "Évaluer la douleur (0 à 10) avant et 5 minutes après chaque dose. Seuil d'indication : douleur ≥ 7 (≥ 4 pour le kétorolac).",
    "Naloxone prête. Surveillance de la fréquence respiratoire, de la SpO2 et de la TA après chaque dose.",
  ],
  morphine: [
    "## Morphine",
    "4 mg IV/IO/IM toutes les 5 minutes, 12 mg au maximum (20 mg sur ordre OLMC). IV : lente sur 2 à 3 minutes.",
    "Contre-indiquée si hypotension. Naloxone prête, surveillance respiratoire.",
  ],
  dextrose: [
    "## Dextrose 10 %",
    "125 mL IV/IO, à répéter une fois : prélever dans la poche de 250 mL (la moitié) et la passer en quelques minutes, sur une voie de bon débit.",
    "Vérifier le reflux sanguin et rincer au NaCl avant : le dextrose est irritant en cas d'extravasation.",
    "Glycémie recontrôlée 5 à 10 minutes après la fin de la perfusion. Objectif : conscience qui revient et glycémie > 0,60 g/L.",
  ],
  glucagon: [
    "## Glucagon 1 mg IM",
    "Reconstituer la poudre avec le solvant fourni, agiter doucement jusqu'à dissolution complète, injecter en IM dans la cuisse.",
    "Délai d'action de 10 à 15 minutes ; nausées fréquentes : patient en position latérale. Donner ensuite du sucre par la bouche dès qu'il avale.",
  ],
  albuterol: [
    "## Albutérol (salbutamol)",
    "5 mg en nébulisation, à répéter 2 fois. Tremblements et tachycardie attendus. Patient assis, oxygène 6 à 8 L/min, durée 5 à 10 minutes par passage.",
  ],
  nitro: [
    "## Nitroglycérine 0,4 mg SL",
    "TA mesurée avant chaque dose. Toutes les 5 minutes, 3 doses au maximum. Pas de dose si TAS < 100 mmHg, prise d'un médicament pour troubles de l'érection dans les 48 heures, ou infarctus du ventricule droit suspecté.",
    "Spray sous la langue, bouche fermée ensuite, patient assis ou allongé. Voie veineuse posée avant si possible en prévision d'une chute de tension.",
  ],
  aspirine: [
    "## Aspirine 325 mg",
    "4 comprimés de 81 mg à croquer (pas à avaler entiers), avec une gorgée d'eau. Demander allergie, ulcère, saignement digestif, anticoagulant avant.",
  ],
  ondansetron: [
    "## Ondansétron 4 mg",
    "ODT (à fondre sous la langue), IM, ou IV lente sur environ 30 secondes ; répéter une fois après 15 minutes. Bien toléré ; prévenir le patient d'un effet de somnolence ou de maux de tête.",
  ],
  diphen: [
    "## Diphenhydramine 50 mg",
    "IV lente sur environ 2 minutes ou IM profonde. Somnolence attendue. Ne traite pas l'anaphylaxie : toujours l'adrénaline d'abord si signes respiratoires ou de choc.",
  ],
  txa: [
    "## Acide tranexamique (TXA)",
    "1 g dans 50 à 100 mL de NaCl en 10 minutes, IV/IO, à débuter dans les 3 heures suivant la blessure. Contre-indiqué dans le traumatisme crânien isolé.",
    "Jamais en bolus rapide : risque d'hypotension. Chronométrer.",
  ],
  adenosine: [
    "## Adénosine",
    "6 mg IV rapide (puis 12 mg si persistance) avec flush NaCl 20 mL. Contre-indiquée en cas de WPW, cœur greffé, carbamazépine, bloc de 2e ou 3e degré.",
    "Un arrêt sinusal transitoire de quelques secondes est attendu : prévenir le patient, tracé en cours d'enregistrement.",
  ],
  calcium: [
    "## Chlorure de calcium 1 g (10 mL)",
    "IV/IO lente sur 2 à 5 minutes, voie de gros calibre ou IO (brûle les veines). Ne jamais mélanger avec le bicarbonate : rincer la ligne au NaCl entre les deux.",
  ],
  bicarbonate: [
    "## Bicarbonate de sodium 50 mEq (50 mL)",
    "IV/IO directe lente. Rincer la ligne après le calcium.",
  ],
  epiNeb: [
    "## Adrénaline nébulisée (stridor)",
    "5 mg (5 mL à 1 mg/mL) dans le nébuliseur, oxygène 6 à 8 L/min, patient assis ; à répéter une fois après 10 minutes. Préparer la gestion des voies aériennes.",
  ],
};
