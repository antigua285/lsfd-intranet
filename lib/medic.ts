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
import type { Protocol, Rng, Stage, Step } from "./medic-types";

export type { Answers, Choice, Question, Step } from "./medic-types";

/** Protocoles disponibles, dans l'ordre d'affichage. */
export const PROTOCOLS: Protocol[] = [arret, douleurThoracique, detresseRespiratoire, anaphylaxie, hemorragie];
export const protocolOf = (key: string) => PROTOCOLS.find((p) => p.key === key) ?? PROTOCOLS[0];

/** Protocoles regroupés par catégorie, dans l'ordre de première apparition. */
export function protocolsByCategory(): { category: string; items: Protocol[] }[] {
  const out: { category: string; items: Protocol[] }[] = [];
  for (const p of PROTOCOLS) {
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
