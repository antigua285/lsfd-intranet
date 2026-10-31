/**
 * Précisions d'exécution supplémentaires, ajoutées sous celles déjà présentes dans chaque étape.
 * Clé : « protocole.étape ». Ton institutionnel, sans texte RP prérédigé.
 */
export const EXTRA_DETAILS: Record<string, string[]> = {
  // Arrêt cardiaque
  "arret.choc1": ["Après le choc : reprise immédiate des compressions et chronomètre relancé pour 2 minutes.", "Le défibrillateur reste chargé uniquement le temps nécessaire : en l'absence de choc indiqué, le désarmer."],
  "arret.choc2": ["Dose annoncée à voix haute et confirmée par un second intervenant avant l'injection ; rinçage au NaCl, bras surélevé quelques secondes.", "Heure de la dose reportée sur la fiche : la suivante est due dans 3 à 5 minutes."],
  "arret.hht": ["Hypoxie : vérifier la liberté des voies aériennes et le soulèvement du thorax. Hypovolémie : rechercher une hémorragie externe.", "Pneumothorax : comparer l'auscultation des deux côtés pendant une pause d'analyse.", "Toxiques : demander à l'entourage les médicaments et produits consommés."],
  "arret.reeval": ["Le scribe annonce le temps écoulé à chaque cycle (« 2 minutes, analyse »).", "Le pouls carotidien n'est recherché que si le tracé est organisé, 10 secondes maximum.", "Chaque cycle est noté sur la fiche : rythme, chocs délivrés, médicaments avec leurs heures."],

  // Douleur thoracique
  "douleur-thoracique.aspirine": ["Interroger sur les antécédents de saignement digestif, d'ulcère et la prise d'anticoagulants avant de donner l'aspirine.", "Noter sur la fiche la prise ou l'absence de prise, avec l'heure."],
  "douleur-thoracique.douleur": ["Vérifier TA, fréquence respiratoire et conscience avant chaque dose.", "Une douleur persistante après la nitroglycérine est signalée à l'hôpital dans la pré-alerte."],
  "douleur-thoracique.autres": ["Pré-alerte par radio : âge, douleur, ECG (sus-décalage ou non), traitements donnés avec les heures.", "Patient au repos strict pendant le transport, assis ou demi-assis, sans aucun effort.", "ECG imprimé ou transmis, remis à l'équipe réceptrice."],

  // Rythmes
  "bradycardie.eval": ["Pouls compté sur 30 secondes puis doublé, comparé à la fréquence affichée par le scope.", "Patient allongé, jambes légèrement surélevées si la TA est basse et en l'absence de détresse respiratoire.", "Rechercher les causes : médicaments (bêtabloquants, inhibiteurs calciques), hypoxie, hypothermie, infarctus."],
  "bradycardie.als": ["Atropine en bolus rapide, dose annoncée à voix haute, rinçage au NaCl derrière.", "Stimulation : vérifier la capture, c'est-à-dire une onde électrique suivie d'un pouls palpable à chaque impulsion."],
  "tachycardie.eval": ["Fréquence du pouls palpé comparée à celle du scope.", "Rechercher les critères d'instabilité : douleur thoracique, dyspnée, confusion, TA < 90 mmHg.", "Noter l'heure de début des symptômes et les médicaments pris."],
  "tachycardie.suivi": ["Rythme, TA et conscience réévalués après chaque traitement et notés avec l'heure.", "ECG 12 dérivations conservé avant et après toute conversion, remis à l'hôpital."],

  // Respiratoire
  "detresse-respiratoire.als": ["SpO2 et capnographie surveillées en continu : c'est la tendance qui compte, pas une valeur isolée.", "Brassard et électrodes posés pendant que le patient reste assis."],
  "detresse-respiratoire.oap": ["Patient assis, jambes pendantes si possible. Expliquer la CPAP avant d'appliquer le masque.", "TA recontrôlée avant et après chaque dose de nitroglycérine."],
  "detresse-respiratoire.reeval": ["Fréquence respiratoire, SpO2 et capacité à parler notées à chaque réévaluation avec l'heure.", "Patient maintenu dans sa position, jamais allongé de force, jusqu'à l'hôpital.", "Pré-alerte : âge, cause suspectée, SpO2 sous oxygène, traitements donnés."],
  "anaphylaxie.cutane": ["Retirer le dard ou rincer la zone de contact (piqûre, aliment sur la peau).", "Noter l'heure d'exposition et d'apparition des symptômes ; surveiller la voix, les lèvres et la respiration."],
  "anaphylaxie.als": ["Voie veineuse posée du côté opposé à l'injection d'adrénaline.", "Nébuliseur raccordé à l'oxygène à haut débit, masque bien appliqué.", "Bolus de NaCl en poche pressurisée, TA réévaluée régulièrement."],
  "anaphylaxie.transport": ["Pré-alerte : exposition, symptômes, adrénaline donnée (heure et nombre de doses).", "Position de transport : assis en cas de dyspnée, allongé jambes surélevées si la TA est basse.", "Auto-injecteur utilisé remis à l'équipe réceptrice."],
  "obstruction.eval": ["Demander « Vous vous étouffez ? ». Un patient qui parle ou qui tousse efficacement est encouragé à tousser et surveillé, sans manœuvre.", "Observer la couleur, la position (mains à la gorge), le stridor."],
  "obstruction.heim": ["Après chaque série de 5 compressions, vérifier si le corps étranger est expulsé, puis répéter.", "En cas de perte de connaissance : accompagner le patient jusqu'au sol, appeler du renfort et passer à la RCP."],
  "obstruction.als": ["Laryngoscopie : aspiration prête et pince de Magill en main avant d'introduire la lame.", "Corps étranger retiré sous contrôle de la vue, jamais à l'aveugle.", "Épinéphrine nébulisée : masque appliqué sur le visage, débit d'oxygène élevé, stridor et SpO2 surveillés."],
  "inhalation.eval": ["Interroger sur l'environnement : espace clos, durée d'exposition, produits brûlés.", "Rechercher suie dans la bouche et le nez, voix rauque, toux noire.", "Oxygène haut débit dès que possible, même si la SpO2 est normale."],
  "inhalation.als": ["Matériel de voies aériennes avancées prêt avant la dégradation : un œdème peut progresser vite.", "Voie veineuse de gros calibre, perfusion en poche pressurisée."],

  // Trauma
  "hemorragie.x": ["Compression maintenue en continu : si le pansement est traversé, le recouvrir sans retirer le premier.", "Garrot : serrer jusqu'à disparition du saignement, verrouiller le dispositif, inscrire l'heure sur la sangle."],
  "hemorragie.d": ["Glycémie notée avec l'heure."],
  "hemorragie.e": ["Ambulance chauffée avant l'installation du patient.", "Limiter le temps de déshabillage : se découvrir seulement la zone examinée."],
  "hemorragie.antalgie": ["Vérifier TA et fréquence respiratoire avant chaque dose."],
  "hemorragie.reeval": ["Aucun pansement retiré : en cas de traversée, le recouvrir d'un second.", "Garrot contrôlé à vue : heure inscrite, absence de reprise du saignement, membre exposé.", "Constantes reprises toutes les 5 minutes et notées sur la fiche."],
  "thorax.volet": ["Observer le thorax de face puis de profil sur plusieurs cycles respiratoires : le segment mobile se creuse à l'inspiration.", "La douleur limite l'amplitude respiratoire : la réévaluer après chaque dose.", "Ventilation assistée au BAVU seulement en cas d'épuisement ou de désaturation."],
  "thorax.tamponnade": ["Rechercher les trois signes : veines du cou gonflées, bruits du cœur assourdis, TA basse.", "Remplissage prudent : bolus de 250 mL avec réévaluation du pouls radial entre chaque.", "Aucun retard au départ pour un geste supplémentaire."],
  "thorax.depart": ["Pré-alerte : mécanisme, lésions, constantes, gestes réalisés (pansement occlusif, décompression) avec les heures.", "Auscultation répétée en route : un côté qui redevient silencieux est signalé immédiatement."],
  "trauma-cranien.o2": ["Masque haute concentration, ballon réservoir gonflé, débit 15 L/min.", "EtCO2 surveillée en continu : cible 35 à 45 mmHg.", "Fréquence de ventilation comptée à voix haute pour éviter l'hyperventilation."],
  "trauma-cranien.ta": ["TA mesurée toutes les 5 minutes, valeur et heure notées.", "Tête relevée à 30° sans flexion du cou, rachis cervical maintenu en position neutre.", "Ondansétron préparé avant le départ pour prévenir les vomissements."],
  "trauma-cranien.depart": ["Pré-alerte : Glasgow initial et actuel, pupilles, TA, heure du traumatisme.", "Glasgow et pupilles répétés toutes les 5 minutes en route et notés avec l'heure."],
  "ecrasement.eval": ["Noter l'heure de la prise en charge et la durée estimée de l'écrasement.", "Rechercher les autres lésions et préciser le mécanisme et la localisation."],
  "ecrasement.als": ["Voie veineuse de gros calibre, bolus en poche pressurisée, réévaluation toutes les 2 à 3 minutes.", "Volumes perfusés notés avec l'heure."],
  "ecrasement.depart": ["Pré-alerte : mécanisme, durée d'écrasement, lésions, volumes perfusés.", "Garrots visibles, membre exposé et immobilisé pendant le transport."],
  "brulure.voies": ["Rechercher suie dans la bouche et le nez, voix rauque, toux, brûlures de la face et du cou.", "Aspiration et matériel de voies aériennes avancées prêts avant toute dégradation.", "Réévaluer la voix et la respiration à chaque contrôle."],
  "brulure.als": ["Voie veineuse posée en peau saine, à distance de la brûlure si possible.", "Volume de NaCl noté avec l'heure."],
  "brulure.depart": ["Pré-alerte : surface estimée, degré, atteinte du visage, signes d'inhalation, gestes réalisés.", "Patient couvert d'un drap sec propre, ambulance chauffée."],

  // Neurologie
  "avc.als": ["Voie veineuse posée au bras sain (opposé au déficit) si possible.", "Score LAMS noté : asymétrie faciale (0-1), chute du bras (0-2), force de la main (0-2).", "Alerte AVC par radio : heure du dernier moment vu normal, LAMS, glycémie."],
  "convulsions.apres": ["Patient placé sur le côté, tête légèrement en arrière pour dégager la bouche. Aspirer les sécrétions sans introduire d'objet dans la bouche.", "Réévaluer la conscience toutes les 5 minutes : un retour progressif est attendu.", "Rechercher morsure de langue, blessure, incontinence."],
  "convulsions.eclampsie": ["Patiente inclinée sur le côté gauche, TA mesurée.", "Contact OLMC dès l'identification, avant l'arrivée à la maternité.", "Transport sans attendre."],
  "hypoglycemie.iv": ["Dextrose 10 % injecté lentement, veine contrôlée avant injection pour éviter l'infiltration.", "Glucagon IM dans le muscle de la cuisse ou de l'épaule.", "Un patient qui convulse ou qui n'avale pas ne reçoit rien par la bouche."],
  "hypoglycemie.suivi": ["Glycémie recontrôlée à 10 minutes et notée avec l'heure.", "Un patient sous antidiabétiques oraux est transporté : risque de rechute."],
  "syncope.als": ["Brassard et électrodes posés avant de relever le patient.", "TA prise allongé puis, si le patient est stable, en position assise."],

  // Toxicologie
  "overdose.suivi": ["Constantes, SpO2 et capnographie notées à chaque réévaluation.", "Heure et dose de chaque naloxone reportées sur la fiche."],
  "overdose.stim": ["Environnement calme : lumière et bruit réduits, une seule personne parle au patient.", "Température contrôlée régulièrement ; refroidissement progressif (vêtements retirés, ventilation).", "Aucun transport sur le ventre."],
  "overdose.autre": ["Récupérer boîtes, flacons et notices pour l'hôpital.", "Noter : quoi, combien, quand, par quelle voie.", "Contact OLMC pour tout antidote."],
  "monoxyde.secu": ["Pièce aérée avant d'entrer, détecteur de CO porté sur soi si disponible.", "Ne pas rester dans la zone : extraire le patient d'abord, s'occuper de lui à l'air libre.", "Couper la source seulement si cela ne comporte aucun risque."],
  "monoxyde.o2": ["Masque haute concentration, ballon réservoir gonflé, débit 15 L/min dès l'extraction.", "SpCO lu avec le capteur au doigt : un taux élevé confirme l'intoxication malgré une SpO2 normale."],
  "monoxyde.als": ["Monitorage continu, ECG 12 dérivations.", "Patient laissé sous oxygène jusqu'à l'arrivée à l'hôpital."],

  // Environnement
  "hyperthermie.als": ["Voie veineuse posée, bolus en poche pressurisée, TA réévaluée.", "Refroidissement progressif (éventail, linges humides), jamais de glace directe, sans retarder le départ."],
  "hypothermie.als": ["Brassard et électrodes posés sans mouvement brusque : une manipulation brutale peut provoquer une arythmie.", "Température mesurée régulièrement et notée.", "Couverture chauffante maintenue pendant tout le transport."],
  "morsure.eval": ["Marquer au feutre le bord du gonflement avec l'heure pour suivre sa progression.", "Retirer bagues et bracelets du membre atteint avant l'apparition de l'œdème.", "Ni incision, ni aspiration, ni garrot."],
  "morsure.als": ["Voie veineuse posée au membre non atteint.", "Signes d'allergie : basculer sur le protocole « Anaphylaxie »."],
  "electrisation.eval": ["Rechercher un point d'entrée et un point de sortie : mains, pieds.", "Rechercher les lésions secondaires : chute, projection.", "Rythme cardiaque contrôlé même en l'absence de symptômes."],
  "electrisation.als": ["Monitorage continu pendant tout le transport.", "Voie veineuse posée à distance des brûlures."],

  // Obstétrique
  "accouchement.delivrance": ["Placenta récupéré dans un sac propre et remis à l'hôpital.", "Surveiller le saignement et le tonus de l'utérus.", "Heure de la délivrance notée."],
  "accouchement.complic": ["Heure d'apparition de la complication notée.", "Mère maintenue en position latérale gauche pendant le transport.", "Pré-alerte maternité : complication, heure de naissance, état du nouveau-né."],

  // Pédiatrie
  "arret-pediatrique.rcpped": ["Nourrisson : compressions avec deux doigts, ou deux pouces encerclant le thorax à deux secouristes. Enfant : talon d'une main.", "Compter à voix haute le rythme et les cycles ; relève des masseurs toutes les 2 minutes."],

  // Manœuvres
  "smr.indic": ["Rechercher douleur ou sensibilité à la palpation du rachis, déficit neurologique, mécanisme violent, altération de conscience.", "Évaluer chaque traumatisé, y compris celui qui marche."],
  "smr.neuro": ["Demander au patient de bouger les doigts et les orteils, de serrer les mains, de pousser et tirer avec les pieds : comparer les deux côtés.", "Résultats notés avec l'heure avant et après toute mobilisation."],
  "casque.prep": ["Annoncer les rôles avant de commencer : un intervenant tient la tête, l'autre retire.", "Si le patient est conscient, lui demander de ne pas aider."],

  // Procédures
  "mort.suite": ["Heure de la détermination notée sur la fiche et communiquée à la régulation.", "Zone sécurisée en attendant les coroners : personne ne touche le corps.", "Dispositifs médicaux laissés en place."],
  "refus.capacite": ["Évaluer l'orientation (nom, lieu, date), la compréhension des risques et la capacité à les reformuler.", "Glycémie et constantes avant toute décision : un trouble métabolique altère le discernement."],
  "refus.fiche": ["Remplir la fiche devant le patient et la lui faire relire avant signature.", "Remettre un exemplaire au patient."],
  "transport-precoce.criteres": ["Les critères sont réévalués à chaque prise de constantes.", "Toute dégradation neurologique est comparée à l'évaluation initiale notée."],
  "transport-precoce.trajet": ["Point de rendez-vous annoncé à la régulation avec l'unité ALS.", "Soins ALS poursuivis dès la jonction, sans retarder le départ."],
  "contention.principes": ["Désescalade : ton calme, une seule voix, distance de sécurité, chaque geste expliqué.", "Chercher une cause médicale (glycémie, hypoxie, traumatisme crânien, substances) avant toute contention."],
  "contention.dispositifs": ["Contrôler l'absence de serrage : deux doigts passent sous la contention.", "Pouls, couleur et sensibilité des extrémités contrôlés régulièrement."],
  "contention.interdits": ["Patient maintenu sur le dos ou sur le côté, jamais sur le ventre.", "Surveillance continue de la respiration et de la SpO2, capnographie en cas de sédation."],
  "detention.eval": ["Évaluation complète même si le patient est menotté, en présence de l'agent.", "Noter les signes négatifs pertinents (pas de douleur thoracique, pas de dyspnée…)."],
  "detention.transport": ["Moyen d'ouverture des menottes à portée de l'agent.", "Contrôle des extrémités (pouls, couleur, chaleur, sensibilité) noté."],
  "scene-crime.autorite": ["Ne toucher à rien sauf pour les soins ; noter ce qui a été déplacé.", "Préserver les preuves : vêtements découpés en évitant les trous, remis aux forces de l'ordre.", "Appui des forces de l'ordre demandé par radio avant d'entrer si la sécurité n'est pas assurée."],
};
