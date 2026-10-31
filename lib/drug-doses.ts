/**
 * LSC EMS Drug Doses : doses adulte (livre 3, tableaux 3.7-A et 3.7-B) et pédiatriques au poids
 * (livre 3, tableaux 11.2-A et 11.5-A). Les concentrations affichées sont des concentrations standard :
 * toujours vérifier celle de l'ampoule avant de prélever.
 */
import { BANDS } from "./medic-protocols/pediatrie";

/* ───────────── Format ───────────── */
export const fr = (n: number, d = 2) => {
  const s = n.toFixed(d);
  return (s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s).replace(".", ",");
};
const mgText = (mg: number, ug = false) => (ug ? `${fr(mg * 1000, 1)} µg` : `${fr(mg, mg >= 10 ? 1 : mg >= 1 ? 2 : 3)} mg`);
const concText = (c: number) => (c < 0.1 ? `${fr(c * 1000, 0)} µg/mL` : `${fr(c, 3)} mg/mL`);
const mlText = (ml: number) => `${fr(ml, ml < 1 ? 2 : ml < 10 ? 1 : 0)} mL`;

/* ───────────── Adulte ───────────── */
export type AdultDose = { label: string; route: string; mg?: number; conc?: number; text?: string };
export type AdultDrug = { key: string; name: string; indication: string; ci: string; doses: AdultDose[]; repeat?: string };

export const ADULT_DRUGS: AdultDrug[] = [
  { key: "txa", name: "Acide tranexamique (TXA)", indication: "Hémorragie traumatique ou du post-partum < 3 h", ci: "Jamais en bolus rapide ; contre-indiqué dans le traumatisme crânien isolé.", doses: [{ label: "1 g dans 50 à 100 mL de NaCl en 10 min", route: "IV / IO", mg: 1000, conc: 100 }] },
  { key: "adenosine", name: "Adénosine", indication: "Tachycardie supraventriculaire régulière", ci: "WPW, cœur greffé, carbamazépine, bloc de 2e ou 3e degré.", doses: [{ label: "6 mg rapide + flush NaCl 20 mL", route: "IV rapide (pli du coude)", mg: 6, conc: 3 }, { label: "puis 12 mg rapide + flush, répéter 1 fois", route: "IV rapide", mg: 12, conc: 3 }] },
  { key: "adr1", name: "Adrénaline 1 mg/mL", indication: "Anaphylaxie, asthme grave, œdème des voies aériennes", ci: "Jamais en IV à cette concentration.", doses: [{ label: "0,5 mg", route: "IM cuisse (face externe)", mg: 0.5, conc: 1 }], repeat: "Toutes les 10 min, 3 doses, contact OLMC." },
  { key: "adr01", name: "Adrénaline 0,1 mg/mL", indication: "Arrêt cardiaque", ci: "Réservée au patient sans pouls.", doses: [{ label: "1 mg", route: "IV / IO", mg: 1, conc: 0.1 }], repeat: "Toutes les 3 à 5 min, 3 mg maximum." },
  { key: "adrpush", name: "Adrénaline push-dose 0,01 mg/mL", indication: "Choc non traumatique, après reprise", ci: "Préparer : 1 mL d'adrénaline 0,1 mg/mL + 9 mL de NaCl.", doses: [{ label: "1 mL (10 µg)", route: "IV / IO", text: "1 mL" }], repeat: "Toutes les 1 à 5 min, cible TA > 90 mmHg." },
  { key: "albuterol", name: "Albutérol", indication: "Bronchospasme (asthme), hyperkaliémie", ci: "Tremblements, tachycardie.", doses: [{ label: "5 mg, répéter 2 fois", route: "Nébulisation", text: "5 mg" }] },
  { key: "amio", name: "Amiodarone", indication: "FV / TV sans pouls réfractaire", ci: "Après le 3e choc.", doses: [{ label: "300 mg", route: "IV / IO", mg: 300, conc: 50 }, { label: "puis 150 mg (450 mg max)", route: "IV / IO", mg: 150, conc: 50 }] },
  { key: "aspirine", name: "Aspirine 81 mg", indication: "Douleur thoracique cardiaque", ci: "Allergie, saignement digestif actif.", doses: [{ label: "325 mg (4 comprimés)", route: "PO, à croquer", text: "4 cp" }] },
  { key: "atropine", name: "Atropine", indication: "Bradycardie symptomatique", ci: "Peu efficace dans les blocs de haut degré. Jamais de dose < 0,5 mg.", doses: [{ label: "1 mg", route: "IV / IO", mg: 1, conc: 0.1 }], repeat: "Toutes les 3 à 5 min, 3 mg maximum." },
  { key: "bicar", name: "Bicarbonate de sodium", indication: "Hyperkaliémie, tricycliques (QRS larges)", ci: "Rincer la ligne après le calcium.", doses: [{ label: "50 mEq (50 mL)", route: "IV / IO", text: "50 mL" }] },
  { key: "calcium", name: "Chlorure de calcium", indication: "Hyperkaliémie, surdosage inhibiteur calcique / bêtabloquant", ci: "Brûle les veines : grosse veine ou IO, injection lente.", doses: [{ label: "1 g (10 mL) lent", route: "IV / IO", text: "10 mL" }] },
  { key: "dextrose", name: "Dextrose 10 %", indication: "Hypoglycémie", ci: "Recontrôler la glycémie.", doses: [{ label: "125 mL, répéter 1 fois", route: "IV / IO", text: "125 mL" }] },
  { key: "diphen", name: "Diphenhydramine", indication: "Urticaire, démangeaisons", ci: "Ne traite pas l'anaphylaxie ; somnolence.", doses: [{ label: "50 mg", route: "IV lent / IM", mg: 50, conc: 50 }] },
  { key: "fentanyl", name: "Fentanyl", indication: "Douleur ≥ 7, analgésie (IO, stimulation)", ci: "Dépression respiratoire ; naloxone prête.", doses: [{ label: "50 µg", route: "IV / IO / IM / IN", mg: 0.05, conc: 0.05 }], repeat: "Toutes les 5 min, 150 µg max (250 µg sur ordre OLMC)." },
  { key: "glucose", name: "Gel de glucose", indication: "Hypoglycémie, patient qui avale", ci: "Patient conscient uniquement.", doses: [{ label: "15 g", route: "PO", text: "15 g" }] },
  { key: "glucagon", name: "Glucagon", indication: "Hypoglycémie sans voie veineuse", ci: "Nausées fréquentes.", doses: [{ label: "1 mg", route: "IM", mg: 1, conc: 1 }] },
  { key: "ketorolac", name: "Kétorolac", indication: "Douleur ≥ 4", ci: "Trauma crânien ou multiple, saignement, > 65 ans, grossesse.", doses: [{ label: "15 mg lent", route: "IV", mg: 15, conc: 30 }, { label: "ou 30 mg", route: "IM", mg: 30, conc: 30 }] },
  { key: "lido", name: "Lidocaïne 2 %", indication: "Douleur à la perfusion IO", ci: "Patient conscient seulement.", doses: [{ label: "40 mg lent, laisser agir 60 s", route: "IO", mg: 40, conc: 20 }] },
  { key: "midazolam", name: "Midazolam", indication: "Convulsions, agitation, sédation (stimulation, cardioversion)", ci: "Apnée : BAVU prêt avant l'injection.", doses: [{ label: "Convulsions : 10 mg", route: "IM / IN", mg: 10, conc: 5 }, { label: "Convulsions : 5 mg", route: "IV / IO", mg: 5, conc: 5 }, { label: "Sédation : 5 mg", route: "IV / IM / IN", mg: 5, conc: 5 }], repeat: "10 mg maximum avant contact OLMC." },
  { key: "morphine", name: "Morphine", indication: "Douleur ≥ 7", ci: "Hypotension.", doses: [{ label: "4 mg", route: "IV / IO / IM", mg: 4, conc: 10 }], repeat: "Toutes les 5 min, 12 mg max (20 mg sur ordre OLMC)." },
  { key: "naloxone", name: "Naloxone", indication: "Overdose d'opioïdes avec respiration insuffisante", ci: "Réveil brutal et agressif si dose trop forte : petites doses.", doses: [{ label: "0,4 mg, toutes les 2-3 min", route: "IV / IO", mg: 0.4, conc: 0.4 }, { label: "ou 2 mg", route: "IN (1 mg par narine) / IM", mg: 2, conc: 1 }], repeat: "8 mg maximum." },
  { key: "nacl", name: "NaCl 0,9 %", indication: "Remplissage, vecteur", ci: "Arrêter si œdème pulmonaire.", doses: [{ label: "250 mL à 1 L selon protocole", route: "IV / IO", text: "250 mL – 1 L" }] },
  { key: "nitro", name: "Nitroglycérine", indication: "Douleur thoracique, œdème pulmonaire", ci: "TA < 100, troubles de l'érection < 48 h, ventricule droit.", doses: [{ label: "0,4 mg", route: "SL", text: "1 dose" }], repeat: "Toutes les 5 min, 3 doses." },
  { key: "olanzapine", name: "Olanzapine", indication: "Agitation, patient coopérant", ci: "Somnolence.", doses: [{ label: "10 mg, une fois", route: "ODT", text: "10 mg" }] },
  { key: "ondansetron", name: "Ondansétron", indication: "Nausées, vomissements", ci: "Bien toléré.", doses: [{ label: "4 mg", route: "ODT / IV / IM", mg: 4, conc: 2 }], repeat: "Répéter 1 fois après 15 min." },
  { key: "o2", name: "Oxygène", indication: "Hypoxie (SpO2 < 94 %), arrêt, choc, trauma crânien", ci: "Cible 88-92 % chez l'insuffisant respiratoire chronique.", doses: [{ label: "2 à 15 L/min selon SpO2", route: "Inhalé", text: "2–15 L/min" }] },
  { key: "duodote", name: "DuoDote (atropine + pralidoxime)", indication: "Organophosphorés, neurotoxiques", ci: "Protection de l'équipe d'abord.", doses: [{ label: "1 auto-injecteur, répéter selon les signes", route: "IM cuisse", text: "1 auto-inj." }] },
];

export const SITUATIONS: { situation: string; drug: string; dose: string }[] = [
  { situation: "Anaphylaxie", drug: "Adrénaline 1 mg/mL", dose: "0,5 mg IM cuisse" },
  { situation: "Arrêt cardiaque (FV ou asystolie)", drug: "Adrénaline 0,1 mg/mL", dose: "1 mg IV/IO" },
  { situation: "FV réfractaire (après 3 chocs)", drug: "Amiodarone", dose: "300 mg IV/IO" },
  { situation: "Douleur thoracique cardiaque", drug: "Aspirine / nitroglycérine", dose: "325 mg PO / 0,4 mg SL" },
  { situation: "Bradycardie mal tolérée", drug: "Atropine", dose: "1 mg IV/IO" },
  { situation: "TSV stable", drug: "Adénosine", dose: "6 mg puis 12 mg IV rapide" },
  { situation: "Hypoglycémie, patient qui avale", drug: "Gel de glucose", dose: "15 g PO" },
  { situation: "Hypoglycémie, patient qui n'avale pas", drug: "Dextrose 10 % / glucagon", dose: "125 mL IV / 1 mg IM" },
  { situation: "Crise convulsive > 5 min", drug: "Midazolam", dose: "10 mg IM/IN ou 5 mg IV" },
  { situation: "Crise d'asthme", drug: "Albutérol", dose: "5 mg nébulisé" },
  { situation: "Overdose d'opioïdes", drug: "Naloxone", dose: "0,4 mg IV répété ou 2 mg IN" },
  { situation: "Agitation dangereuse", drug: "Midazolam", dose: "5 mg IM/IN" },
  { situation: "Douleur sévère", drug: "Fentanyl / morphine", dose: "50 µg / 4 mg" },
  { situation: "Hémorragie traumatique ou post-partum", drug: "TXA", dose: "1 g IV en 10 min" },
];

export function adultDoseVolume(d: AdultDose): string | null {
  if (d.mg !== undefined && d.conc) return `${mlText(d.mg / d.conc)} à ${concText(d.conc)}`;
  if (d.text) return d.text;
  return null;
}

/* ───────────── Enfant : zones de couleur (réglette) ───────────── */
export type Zone = { id: string; name: string; hex: string; text: string; kgRange: string; age: string; kg: number; fc: string; fr: string; tas: string; adult?: boolean };
const RANGES: Record<string, { kg: string; age: string; fc: string; fr: string; tas: string }> = {
  gris: { kg: "3-5 kg", age: "< 3 mois", fc: "100-180", fr: "30-60", tas: "> 60" },
  rose: { kg: "6-7 kg", age: "3-6 mois", fc: "100-160", fr: "25-40", tas: "> 70" },
  rouge: { kg: "8-9 kg", age: "7-10 mois", fc: "100-160", fr: "20-40", tas: "> 70" },
  violet: { kg: "10-11 kg", age: "11-18 mois", fc: "90-140", fr: "24-40", tas: "> 70" },
  jaune: { kg: "12-14 kg", age: "19-35 mois", fc: "90-140", fr: "20-30", tas: "> 70" },
  blanc: { kg: "15-18 kg", age: "3-4 ans", fc: "80-130", fr: "20-30", tas: "> 75" },
  bleu: { kg: "19-22 kg", age: "5-6 ans", fc: "70-120", fr: "15-30", tas: "> 80" },
  orange: { kg: "24-28 kg", age: "7-9 ans", fc: "70-110", fr: "15-30", tas: "> 80" },
  vert: { kg: "30-36 kg", age: "10-12 ans", fc: "60-100", fr: "15-20", tas: "> 90" },
};
const COLORS: Record<string, [string, string, string]> = {
  gris: ["Gris", "#9ca3af", "#111"], rose: ["Rose", "#f9a8d4", "#111"], rouge: ["Rouge", "#ef4444", "#fff"], violet: ["Violet", "#a855f7", "#fff"],
  jaune: ["Jaune", "#facc15", "#111"], blanc: ["Blanc", "#ffffff", "#111"], bleu: ["Bleu", "#3b82f6", "#fff"], orange: ["Orange", "#fb923c", "#111"], vert: ["Vert", "#22c55e", "#111"],
};
export const ZONES: Zone[] = [
  ...BANDS.map((b) => ({ id: b.id, name: COLORS[b.id][0], hex: COLORS[b.id][1], text: COLORS[b.id][2], kgRange: RANGES[b.id].kg, age: RANGES[b.id].age, kg: b.kg, fc: RANGES[b.id].fc, fr: RANGES[b.id].fr, tas: RANGES[b.id].tas })),
  { id: "noir", name: "Noir", hex: "#111827", text: "#fff", kgRange: "> 36 kg", age: "≥ 13 ans", kg: 40, fc: "60-100", fr: "12-20", tas: "> 90", adult: true },
];

export type PedRow = { name: string; dose: string; volume?: string; route: string; note?: string };

/** Doses pédiatriques au poids (tableau 11.5-A). `kg` : poids retenu pour la zone ou poids connu. */
export function pedRows(kg: number): PedRow[] {
  const cap = (v: number, m: number) => Math.min(v, m);
  const mgRow = (name: string, mg: number, maxMg: number, conc: number | null, route: string, note?: string, ug = false): PedRow => {
    const v = cap(mg, maxMg);
    return { name, dose: mgText(v, ug), volume: conc ? `${mlText(v / conc)} à ${concText(conc)}` : undefined, route, note: note ?? (mg > maxMg ? "dose maximale atteinte" : undefined) };
  };
  const mlRow = (name: string, ml: number, maxMl: number, route: string): PedRow => ({ name, dose: mlText(cap(ml, maxMl)), route, note: ml > maxMl ? "dose maximale atteinte" : undefined });
  return [
    mgRow("Adrénaline 0,1 mg/mL (arrêt)", kg * 0.01, 1, 0.1, "IV / IO", "0,01 mg/kg, soit 0,1 mL/kg"),
    mgRow("Adrénaline 1 mg/mL (anaphylaxie)", kg * 0.01, 0.5, 1, "IM cuisse"),
    mgRow("Amiodarone", kg * 5, 300, 50, "IV / IO"),
    { name: "Adénosine", dose: `${mgText(cap(kg * 0.1, 12))} puis ${mgText(cap(kg * 0.2, 12))}`, volume: `${mlText(cap(kg * 0.1, 12) / 3)} puis ${mlText(cap(kg * 0.2, 12) / 3)} à 3 mg/mL`, route: "IV rapide + flush", note: "0,1 puis 0,2 mg/kg, 12 mg maximum" },
    mgRow("Atropine", kg * 0.02, 0.5, 0.1, "IV / IO"),
    mlRow("Dextrose 10 %", kg * 5, 250, "IV / IO"),
    { name: "Glucagon", dose: kg < 20 ? "0,5 mg" : "1 mg", volume: kg < 20 ? "0,5 mL à 1 mg/mL" : "1 mL à 1 mg/mL", route: "IM", note: "0,5 mg si < 20 kg, 1 mg si ≥ 20 kg" },
    mgRow("Midazolam IM / IN", kg * 0.2, 10, 5, "IM / IN", "0,2 mg/kg"),
    mgRow("Midazolam IV", kg * 0.1, 5, 5, "IV", "0,1 mg/kg"),
    mgRow("Naloxone", kg * 0.1, 2, 1, "IN / IM / IV"),
    mgRow("Fentanyl IV / IM", kg * 0.001, 0.05, 0.05, "IV / IM", "1 µg/kg", true),
    mgRow("Fentanyl IN", kg * 0.0015, 0.05, 0.05, "IN", "1,5 µg/kg", true),
    mgRow("Morphine", kg * 0.1, 4, 1, "IV / IM", "0,1 mg/kg, à diluer à 1 mg/mL"),
    mgRow("Ondansétron", kg * 0.15, 4, 2, "IV / IM / ODT"),
    mgRow("Diphenhydramine", kg * 1, 50, 50, "IV / IM"),
    { name: "Albutérol", dose: kg < 10 ? "2,5 mg" : "5 mg", route: "Nébulisation", note: "2,5 mg si < 1 an (selon l'âge réel), 5 mg au-delà" },
    mlRow("NaCl 0,9 % (remplissage)", kg * 20, 1000, "IV / IO"),
    { name: "Défibrillation", dose: `${fr(kg * 2, 0)} J puis ${fr(kg * 4, 0)} J`, route: "—", note: "2 J/kg puis 4 J/kg, dose adulte au maximum" },
  ];
}

/** Taille d'i-gel (livre 3, tableau 5.4-A) : seulement à partir de 10 kg. */
export function igelSize(kg: number): string {
  if (kg < 10) return "voir réglette";
  if (kg < 25) return "2";
  if (kg < 35) return "2,5";
  if (kg < 60) return "3";
  return "4";
}
