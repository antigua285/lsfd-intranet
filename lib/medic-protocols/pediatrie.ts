import { stage, type Answers, type Protocol, type Step } from "../medic-types";

/** Réglette pédiatrique : couleur, âge, poids retenu (milieu de la tranche), constantes. */
export const BANDS = [
  { id: "gris", label: "Gris · 3-5 kg · < 3 mois", kg: 4, fc: [100, 180], fr: [30, 60], tas: 60 },
  { id: "rose", label: "Rose · 6-7 kg · 3-6 mois", kg: 6.5, fc: [100, 160], fr: [25, 40], tas: 70 },
  { id: "rouge", label: "Rouge · 8-9 kg · 7-10 mois", kg: 8.5, fc: [100, 160], fr: [20, 40], tas: 70 },
  { id: "violet", label: "Violet · 10-11 kg · 11-18 mois", kg: 10.5, fc: [90, 140], fr: [24, 40], tas: 70 },
  { id: "jaune", label: "Jaune · 12-14 kg · 19-35 mois", kg: 13, fc: [90, 140], fr: [20, 30], tas: 70 },
  { id: "blanc", label: "Blanc · 15-18 kg · 3-4 ans", kg: 16.5, fc: [80, 130], fr: [20, 30], tas: 75 },
  { id: "bleu", label: "Bleu · 19-22 kg · 5-6 ans", kg: 20.5, fc: [70, 120], fr: [15, 30], tas: 80 },
  { id: "orange", label: "Orange · 24-28 kg · 7-9 ans", kg: 26, fc: [70, 110], fr: [15, 30], tas: 80 },
  { id: "vert", label: "Vert · 30-36 kg · 10-12 ans", kg: 33, fc: [60, 100], fr: [15, 20], tas: 90 },
] as const;

const band = (a: Answers) => BANDS.find((b) => b.id === a.poids) ?? BANDS[0];
const fmt = (n: number, d = 1) => n.toFixed(d).replace(".", ",");
const mg = (kg: number, perKg: number, max: number) => Math.min(max, kg * perKg);

function arretPedSteps(a: Answers): Step[] {
  const b = band(a);
  const kg = b.kg;
  const adr = mg(kg, 0.01, 1);
  const amio = mg(kg, 5, 300);
  const dex = Math.min(250, kg * 5);
  const nacl = Math.min(1000, kg * 20);
  return [
    {
      id: "evalped", title: "Triangle d'évaluation pédiatrique",
      lines: [
        "En 30 secondes, depuis la porte, avant de toucher l'enfant : apparence (tonus, regard, pleurs), respiration (bruits, tirage, battement des ailes du nez), couleur de peau (pâleur, marbrures, cyanose).",
        "Un enfant qui devient calme et somnolent pendant une détresse ne se rassure pas : il s'épuise.",
        "Garder les parents près de l'enfant si possible, leur expliquer simplement ce qu'on fait.",
        `Poids retenu : environ ${fmt(kg)} kg (${b.label}). Utiliser la réglette pédiatrique : jamais de calcul de tête.`,
      ],
      detail: ["Parent calme, enfant calme : ne jamais séparer brutalement un enfant de son parent."],
    },
    {
      id: "rcpped", title: "Réanimation pédiatrique",
      lines: [
        "Les arrêts de l'enfant sont surtout d'origine respiratoire : oxygéner et ventiler est la priorité. 5 insufflations initiales si l'enfant ne respire pas.",
        "Massage à 100–120 par minute, profondeur du tiers du thorax (environ 4 cm chez le nourrisson, 5 cm chez l'enfant).",
        "15 compressions pour 2 insufflations à deux secouristes (30/2 seul).",
        "Défibrillation (DAE avec électrodes pédiatriques si disponibles) : 2 J/kg, puis 4 J/kg aux chocs suivants.",
      ],
      doses: [`Choc ${fmt(kg * 2, 0)} J, puis ${fmt(kg * 4, 0)} J aux suivants (2 puis 4 J/kg)`],
      detail: ["Masque et BAVU de la taille de l'enfant, thorax qui se soulève à chaque insufflation."],
    },
    {
      id: "drugsped", title: "Médicaments",
      lines: [
        "ALS: Accès IV/IO.",
        `ALS: Adrénaline 0,01 mg/kg (0,1 mg/mL, soit 0,1 mL/kg) IV/IO : ${fmt(adr, 3)} mg (${fmt(adr * 10, 2)} mL), maximum 1 mg, toutes les 3 à 5 minutes. En rythme chocable, après le 2e choc.`,
        `ALS: FV/TV persistante : amiodarone 5 mg/kg : ${fmt(amio, 0)} mg (maximum 300 mg).`,
        `ALS: Glycémie ; dextrose 10 % 5 mL/kg si < 0,60 g/L : ${fmt(dex, 0)} mL.`,
        `ALS: Remplissage : NaCl 0,9 % 20 mL/kg : ${fmt(nacl, 0)} mL (maximum 1 L).`,
        "ALS: i-gel de taille adaptée au poids.",
      ],
      doses: [`ALS: Adrénaline ${fmt(adr, 3)} mg IV/IO`, `ALS: Amiodarone ${fmt(amio, 0)} mg IV/IO`, `ALS: Dextrose 10 % ${fmt(dex, 0)} mL`, `ALS: NaCl 0,9 % ${fmt(nacl, 0)} mL`],
      detail: ["Chaque dose pédiatrique est vérifiée à voix haute avant l'injection : une dose adulte ne se donne jamais à un enfant."],
    },
  ];
}
function norm(a: Answers) { const b = band(a); return b; }
export const arretPediatrique: Protocol = {
  key: "arret-pediatrique", title: "Réanimation pédiatrique", desc: "Arrêt de l'enfant, doses au poids (réglette)", category: "Pédiatrie",
  questions: [{ id: "poids", label: "Réglette pédiatrique (couleur / poids / âge)", options: BANDS.map((b) => ({ id: b.id, label: b.label })) }],
  build: arretPedSteps,
  stages: (a) => {
    const b = norm(a);
    return [
      stage("Arrêt, massage en cours", [0, 0], [0, 0], [0, 0], [0, 0], [0.6, 1.2], [35.8, 36.8], "Non mesurable", 3, "Dilatées, aréactives", "Pâle à cyanosée", "Pouls fémoral ou brachial absent", "Apnée", [12, 24]),
      stage("Retour à la circulation", [b.fc[0] + 10, b.fc[1] - 10], [10, 16], [b.tas, b.tas + 20], [90, 95], [0.8, 1.4], [35.8, 36.6], "3 s", 6, "Moyennes, lentes", "Pâle, moite", "Pouls présent, faible", "Ventilé au BAVU", [35, 45]),
    ];
  },
  startStage: () => 0,
  better: 1, betterLabel: "Retour à la circulation", worseLabel: "Re-arrêt",
};
