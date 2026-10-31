/**
 * RAPID LS County Medic : registre des protocoles et utilitaires (100 % client, sans base de données).
 * Sources : « Protocoles et Procédures Paramédic » (livre 3), « Treatment Protocols » (livre 2) et « General Patient Care » (livre 1)
 * de la Los Santos EMS Agency, recoupés avec les protocoles du LA County EMS.
 */
import { anaphylaxie } from "./medic-protocols/anaphylaxie";
import { arret } from "./medic-protocols/arret";
import { detresseRespiratoire } from "./medic-protocols/detresse-respiratoire";
import { douleurThoracique } from "./medic-protocols/douleur-thoracique";
import { hemorragie } from "./medic-protocols/hemorragie";
import { accouchement } from "./medic-protocols/obstetrique";
import { avc, convulsions, hypoglycemie, syncope } from "./medic-protocols/neuro";
import { brulure, ecrasement, thorax, traumaCranien } from "./medic-protocols/trauma";
import { bavu, casque, glycemie, smr, tensionPalpatoire } from "./medic-protocols/manoeuvres";
import { bradycardie, tachycardie } from "./medic-protocols/rythme";
import { electrisation, hyperthermie, hypothermie, morsure } from "./medic-protocols/environnement";
import { inhalation, obstruction } from "./medic-protocols/voies-aeriennes";
import { contention, detention, epcr, mort, refus, sceneCrime, transportPrecoce } from "./medic-protocols/procedures";
import { arretPediatrique } from "./medic-protocols/pediatrie";
import { monoxyde, overdose } from "./medic-protocols/toxico";
import { EXTRA_DETAILS } from "./medic-details";
import { PRACTICE_A } from "./medic-practice-a";
import { PRACTICE_B } from "./medic-practice-b";
import { PRACTICE_C } from "./medic-practice-c";

const PRACTICE: Record<string, string[]> = { ...PRACTICE_A, ...PRACTICE_B, ...PRACTICE_C };
import type { Protocol, Rng, Stage, Step } from "./medic-types";

export type { Answers, Choice, Question, Step } from "./medic-types";

/** Protocoles disponibles, dans l'ordre d'affichage. */
const RAW_PROTOCOLS: Protocol[] = [
  // Cardio
  arret, douleurThoracique, bradycardie, tachycardie,
  // Respiratoire
  detresseRespiratoire, anaphylaxie, obstruction, inhalation,
  // Trauma
  hemorragie, thorax, traumaCranien, ecrasement, brulure,
  // Neurologie
  avc, convulsions, hypoglycemie, syncope,
  // Toxicologie
  overdose, monoxyde,
  // Environnement
  hyperthermie, hypothermie, morsure, electrisation,
  // Obstétrique et pédiatrie
  accouchement, arretPediatrique,
  // Manœuvres
  smr, casque, tensionPalpatoire, glycemie, bavu,
  // Procédures
  mort, refus, transportPrecoce, contention, detention, sceneCrime, epcr,
];
/** Ajoute les précisions complémentaires (medic-details) à la suite de celles déjà écrites dans chaque étape. */
export const PROTOCOLS: Protocol[] = RAW_PROTOCOLS.map((p) => ({
  ...p,
  build: (a, x) => p.build(a, x).map((st) => {
    const k = `${p.key}.${st.id}`;
    const extra = [...(EXTRA_DETAILS[k] ?? []), ...(PRACTICE[k] ?? [])];
    return extra.length ? { ...st, detail: [...(st.detail ?? []), ...extra] } : st;
  }),
}));
export const protocolOf = (key: string) => PROTOCOLS.find((p) => p.key === key) ?? PROTOCOLS[0];

/** Protocoles regroupés par catégorie, dans l'ordre de première apparition. */
export function protocolsByCategory(query = ""): { category: string; items: Protocol[] }[] {
  const out: { category: string; items: Protocol[] }[] = [];
  const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const needle = norm(query.trim());
  for (const p of PROTOCOLS) {
    if (needle && !norm(`${p.title} ${p.desc} ${p.category}`).includes(needle)) continue;
    const g = out.find((o) => o.category === p.category);
    if (g) g.items.push(p); else out.push({ category: p.category, items: [p] });
  }
  return out;
}

/* ───────────────────────── Constantes ───────────────────────── */

export type Vitals = { fc: string; fr: string; ta: string; spo2: string; gly: string; temp: string; etco2: string | null; trc: string; gcs: string; pupilles: string; peau: string; pouls: string; resp: string; label: string; tasHi: number; spo2Hi: number; etco2Hi: number | null };

/** Plages typiques du stade (le patient est considéré en vie sauf en arrêt cardiaque). */
export function measure(st: Stage): Vitals {
  const arrest = st.fc[1] === 0;
  const rg = (r: Rng, dec = 0) => {
    const f = (v: number) => (dec ? v.toFixed(dec).replace(".", ",") : String(Math.round(v)));
    return r[0] === r[1] ? f(r[0]) : `${f(r[0])} à ${f(r[1])}`;
  };
  const tad: Rng = [Math.round(st.tas[0] * 0.58), Math.round(st.tas[1] * 0.62)];
  return {
    fc: arrest ? "—" : rg(st.fc),
    fr: arrest ? "0" : rg(st.fr),
    ta: arrest ? "Imprenable" : `${rg(st.tas)} / ${rg(tad)}`,
    spo2: arrest ? "Non mesurable" : rg(st.spo2),
    gly: rg(st.gly, 2),
    temp: rg(st.temp, 1),
    etco2: st.etco2 ? rg(st.etco2) : null,
    trc: st.trc, gcs: String(st.gcs), pupilles: st.pupilles, peau: st.peau, pouls: st.pouls, resp: st.resp, label: st.label,
    tasHi: st.tas[1], spo2Hi: st.spo2[1], etco2Hi: st.etco2 ? st.etco2[1] : null,
  };
}

/* ───────────────────────── Niveaux BLS / ALS ───────────────────────── */

/** « ALS: » en tête = geste ou produit avancé (réservé aux medics formés). */
export type Level = "BLS" | "ALS" | "MIX";
export const isAls = (l: string) => l.startsWith("ALS:");
export const stripAls = (l: string) => l.replace(/^ALS:\s*/, "");
export function stepLevel(st: Step): Level {
  const n = st.lines.filter(isAls).length;
  return n === 0 ? "BLS" : n === st.lines.length ? "ALS" : "MIX";
}
/** Étapes affichées en mode « BLS seul » : on retire les lignes, doses et étapes avancées. */
export function onlyBls(steps: Step[]): Step[] {
  return steps
    .filter((st) => stepLevel(st) !== "ALS")
    .map((st) => ({ ...st, lines: st.lines.filter((l) => !isAls(l)), doses: st.doses?.filter((d) => !isAls(d)) }));
}
