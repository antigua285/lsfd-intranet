import { stage, type Answers, type Protocol, type Step } from "../medic-types";

function accSteps(a: Answers): Step[] {
  const s: Step[] = [
    {
      id: "decision", title: "Accouchement imminent ou transport ?",
      lines: [
        "Évaluation ABCD, signes vitaux de la mère. Oxygène si nécessaire.",
        "Rechercher les trois signes d'accouchement imminent : envie de pousser, contractions à moins de 2 minutes d'intervalle, tête visible à la vulve (couronnement).",
        "Un seul de ces signes : on accouche sur place. Sinon, transport en position latérale gauche vers la maternité.",
        "Demander une assistance ALS si l'accouchement est imminent.",
      ],
      detail: ["Demander à la mère si elle sent la tête descendre ou une envie de pousser irrépressible : c'est un signe fiable."],
    },
    {
      id: "accompagner", title: "Accompagner l'accouchement",
      lines: [
        "Intimité (témoins écartés), pièce ou ambulance chauffée, mère en position demi-assise. Préparer le kit et au moins 3 serviettes.",
        "Soutenir la tête sans jamais la tirer, la laisser sortir doucement.",
        "Vérifier le cordon autour du cou : s'il est lâche, le passer par-dessus la tête.",
        "Laisser les épaules sortir d'elles-mêmes, soutenir le corps. Ne jamais tirer sur l'enfant ni sur le cordon.",
        "Noter l'heure de naissance.",
      ],
      detail: ["Une main soutient la tête, l'autre guide ; le bébé est reçu dans une serviette sèche."],
    },
    {
      id: "nouveau-ne", title: "Prise en charge du nouveau-né",
      lines: [
        "Sécher et stimuler immédiatement avec une serviette, retirer la serviette mouillée.",
        "Peau contre peau sur la mère, couvrir la tête (bonnet), couverture par-dessus.",
        "Cordon : attendre environ 60 secondes si le bébé va bien, poser deux clamps, couper entre les deux.",
        "Ne respire pas, respire mal ou FC < 100/min : ventilation au BAVU, 40 insufflations par minute, à l'air ambiant pendant 90 secondes, puis oxygène 15 L/min si pas d'amélioration.",
        "FC < 60/min malgré 30 secondes de ventilation efficace : massage cardiaque, 3 compressions pour 1 insufflation.",
        "ALS: FC toujours < 60/min : adrénaline 0,01 mg/kg IV/IO (contact OLMC).",
      ],
      doses: ["Apgar à 1 et 5 min : couleur, FC, réactivité, tonus, respiration (0 à 2 chacun). 7–10 normal, 4–6 stimulation et ventilation, 0–3 réanimation"],
      detail: ["Séchage énergique du dos et des pieds : c'est la stimulation de première intention."],
    },
    {
      id: "delivrance", title: "Délivrance",
      lines: ["Le placenta sort en général dans les 30 minutes : ne jamais tirer sur le cordon.", "Le garder dans un sac pour l'hôpital."],
    },
  ];
  if (a.complication === "hemorragie") {
    s.push({
      id: "hpp", title: "Hémorragie après l'accouchement",
      lines: [
        "Saignement de plus de 500 mL, utérus mou, mère pâle, FC rapide, malaise, sensation de froid.",
        "Massage de l'utérus : main à plat au-dessus du nombril, massage circulaire ferme jusqu'à ce que l'utérus durcisse.",
        "Mise au sein du bébé (aide l'utérus à se contracter). Oxygène.",
        "ALS: Deux voies veineuses, NaCl 1 L en cas de signes de choc, à répéter une fois si le saignement persiste.",
        "ALS: TXA 1 g IV en 10 minutes si la naissance date de moins de 3 heures.",
        "Transport urgent, alerte de la maternité.",
      ],
      doses: ["ALS: NaCl 0,9 % 1 L IV", "ALS: TXA 1 g dans 50–100 mL NaCl en 10 min (< 3 h)"],
      detail: ["Le massage utérin se poursuit pendant tout le transport tant que l'utérus reste mou."],
      tag: "Transport urgent",
    });
  }
  s.push({ id: "complic", title: "Complications", lines: ["Cordon qui sort avant le bébé, siège, épaules bloquées, saignement avant l'accouchement, convulsions (éclampsie) : contact OLMC et transport immédiat vers la maternité."] });
  return s;
}
export const accouchement: Protocol = {
  key: "accouchement", title: "Accouchement", desc: "Accouchement, nouveau-né, hémorragie du post-partum", category: "Obstétrique",
  questions: [
    { id: "complication", label: "Situation", options: [{ id: "normal", label: "Accouchement en cours ou imminent" }, { id: "hemorragie", label: "Saignement après l'accouchement" }] },
  ],
  build: accSteps,
  stages: [
    stage("Travail (mère)", [88, 105], [18, 24], [112, 135], [96, 99], [0.8, 1.2], [36.5, 37.3], "2 s", 15, "Égales, réactives", "Rouge, sueurs", "Radial présent, rapide", "Rapide, par poussées"),
    stage("Post-partum, saignement", [105, 122], [20, 26], [92, 110], [94, 97], [0.8, 1.2], [36.0, 36.8], "3 s", 14, "Égales, réactives", "Pâle, froide", "Radial rapide", "Rapide"),
    stage("Choc hémorragique", [126, 148], [26, 34], [66, 86], [88, 93], [0.8, 1.2], [35.4, 36.2], "> 4 s", 12, "Égales, lentes", "Très pâle, froide, marbrée", "Radial filant", "Haletante"),
  ],
  startStage: (a) => (a.complication === "hemorragie" ? 1 : 0),
  better: -1, betterLabel: "Amélioration", worseLabel: "Aggravation",
  arrestAt: { stage: 2, trauma: false },
};
