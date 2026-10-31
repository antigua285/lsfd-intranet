/** Air Operations Section : constantes, types et utilitaires sans accès base (serveur et navigateur). */

export const AIROPS_FLAG = "AIROPS";
export const AIROPS_CMD_FLAG = "AIROPSCMD";
export const AIROPS_LINK = "/airops";

/* ------------------------------------------------------------------ rangs internes */
/** Échelle interne de la section, du plus bas au plus haut. Modifiable ici sans migration (la clé est stockée). */
export const AIR_RANKS = [
  { key: "student", label: "Fire Pilot I", abbr: "FP1", level: 1 },
  { key: "copilot", label: "Fire Pilot II", abbr: "FP2", level: 2 },
  { key: "pilot", label: "Fire Pilot III", abbr: "FP3", level: 3 },
  { key: "senior", label: "Fire Pilot IV", abbr: "FP4", level: 4 },
  { key: "instructor", label: "Fire Pilot V", abbr: "FP5", level: 5 },
  { key: "chief", label: "Battalion Chief", abbr: "BC", level: 6 },
] as const;
export type AirRankKey = (typeof AIR_RANKS)[number]["key"];
export const airRank = (key: string) => AIR_RANKS.find((r) => r.key === key) ?? AIR_RANKS[0];

/** Qualifications (équivalent des « ratings / endorsements » d'un carnet). */
export const QUALIFICATIONS = [
  { key: "night", label: "Night (NVFR)" },
  { key: "ifr", label: "Instrument Rating (IR)" },
  { key: "nvg", label: "Night Vision Goggles (NVG)" },
  { key: "hoist", label: "Hoist Operations (HHO)" },
  { key: "bucket", label: "Helibucket (Aerial Firefighting)" },
  { key: "medevac", label: "MEDEVAC" },
  { key: "sling", label: "External Sling Load (HESLO)" },
  { key: "mountain", label: "Mountain Flying" },
  { key: "instructor", label: "Flight Instructor (FI)" },
  { key: "examiner", label: "Flight Examiner (FE)" },
] as const;

/** Appareils proposés dans les carnets et formulaires : à adapter à la flotte réelle. */
export const AIRCRAFT_TYPES = [
  { key: "maverick", label: "Buckingham Maverick", category: "Hélicoptère" },
  { key: "valkyrie", label: "Buckingham Valkyrie", category: "Hélicoptère" },
] as const;
export const aircraftLabel = (key: string) => AIRCRAFT_TYPES.find((a) => a.key === key)?.label ?? key;

export const MISSIONS = [
  { key: "training", label: "Training / Dual Instruction" },
  { key: "bucket", label: "Water Drop (Aerial Firefighting)" },
  { key: "medevac", label: "MEDEVAC" },
  { key: "sar", label: "Search and Rescue (SAR)" },
  { key: "hoist", label: "Hoist Operations (HHO)" },
  { key: "recon", label: "Recon / Observation" },
  { key: "transport", label: "Crew / Cargo Transport" },
  { key: "ferry", label: "Ferry Flight" },
  { key: "proficiency", label: "Proficiency Check (PC)" },
] as const;
export const missionLabel = (key: string) => MISSIONS.find((m) => m.key === key)?.label ?? key;

export const AIR_LIMITS = { callsign: 20, license: 30, notes: 1000, point: 40, route: 300, registration: 12, crew: 200, remarks: 600, note: 300, title: 120 };

/* ------------------------------------------------------------------ types */
export type PilotRow = {
  id: string; userId: string | null; name: string; grade: string; station: string; avatarUrl: string | null;
  callsign: string; airRank: string; qualifications: string[]; licenseNo: string; medicalUntil: string | null; notes: string; createdAt: string;
};
export type FlightRow = {
  id: string; pilotId: string; flownOn: string; aircraftType: string; registration: string; from: string; to: string; route: string;
  depTime: string; arrTime: string; mission: string; totalMin: number; picMin: number; sicMin: number; givenMin: number; receivedMin: number;
  nightMin: number; ifrMin: number; nvgMin: number; landDay: number; landNight: number; drops: number; hoists: number;
  crew: string; remarks: string; signedBy: string | null; signedAt: string | null; createdBy: string;
};
export type FlightInput = Omit<FlightRow, "id" | "pilotId" | "signedBy" | "signedAt" | "createdBy">;
export type RankEvent = { id: string; airRank: string; note: string; byName: string; createdAt: string };
export type PilotTotals = {
  total: number; pic: number; sic: number; given: number; received: number; night: number; ifr: number; nvg: number;
  landDay: number; landNight: number; drops: number; hoists: number; flights: number;
  last30: number; last90: number; landDay90: number; landNight90: number; lastFlight: string | null;
};

/* ------------------------------------------------------------------ durées */
/** 90 → « 1,5 » (heures décimales, comme sur un carnet papier). */
export function hoursDecimal(min: number): string {
  return (min / 60).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
/** 90 → « 1 h 30 ». */
export function hoursHM(min: number): string {
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}
/** Accepte « 1,5 », « 1.5 », « 1:30 », « 1h30 » ; renvoie des minutes ou null. Vide = 0. */
export function parseDuration(raw: string): number | null {
  const t = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!t) return 0;
  let m = /^(\d{1,3}):(\d{2})$/.exec(t) ?? /^(\d{1,3})h(\d{1,2})?$/.exec(t);
  if (m) {
    const min = Number(m[2] ?? 0);
    return min < 60 ? Number(m[1]) * 60 + min : null;
  }
  m = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(t);
  if (!m) return null;
  return Math.round(Number(`${m[1]}.${m[2] ?? "0"}`) * 60);
}
/** « 14:05 » + « 15:35 » → 90 (passe minuit incluse). */
export function blockMinutes(dep: string, arr: string): number | null {
  const a = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(dep), b = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(arr);
  if (!a || !b) return null;
  const d = Number(a[1]) * 60 + Number(a[2]);
  const r = Number(b[1]) * 60 + Number(b[2]);
  return (r - d + 1440) % 1440;
}

export function frDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function sumFlights(flights: readonly FlightRow[], today: string): PilotTotals {
  const t: PilotTotals = { total: 0, pic: 0, sic: 0, given: 0, received: 0, night: 0, ifr: 0, nvg: 0, landDay: 0, landNight: 0, drops: 0, hoists: 0, flights: flights.length, last30: 0, last90: 0, landDay90: 0, landNight90: 0, lastFlight: null };
  const day = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000;
  const now = day(today);
  for (const f of flights) {
    t.total += f.totalMin; t.pic += f.picMin; t.sic += f.sicMin; t.given += f.givenMin; t.received += f.receivedMin;
    t.night += f.nightMin; t.ifr += f.ifrMin; t.nvg += f.nvgMin; t.landDay += f.landDay; t.landNight += f.landNight; t.drops += f.drops; t.hoists += f.hoists;
    const age = now - day(f.flownOn);
    if (age >= 0 && age <= 30) t.last30 += f.totalMin;
    if (age >= 0 && age <= 90) { t.last90 += f.totalMin; t.landDay90 += f.landDay + f.landNight; t.landNight90 += f.landNight; }
    if (!t.lastFlight || f.flownOn > t.lastFlight) t.lastFlight = f.flownOn;
  }
  return t;
}

/* ------------------------------------------------------------------ formulaires de vol */
export type AirFieldType = "text" | "long" | "date" | "time" | "number" | "select" | "yn" | "check" | "score";
export type AirField = {
  id: string; label: string; type: AirFieldType;
  /** Largeur sur 12 colonnes (12 par défaut). */
  span?: 3 | 4 | 6 | 8 | 12;
  /** Numéro de case affiché sur le formulaire officiel (ex. « 7 »). */
  box?: string;
  options?: { value: string; label: string; points?: number }[];
  hint?: string; required?: boolean; max?: number;
};
export type AirSection = { title: string; fields: AirField[] };
export type AirFormKind = "flightplan" | "frat" | "mission" | "preflight";
export type AirFormDef = { kind: AirFormKind; title: string; code: string; subtitle: string; sections: AirSection[] };

const YN = [{ value: "yes", label: "Oui" }, { value: "no", label: "Non" }];
const OK3 = [{ value: "ok", label: "OK" }, { value: "dis", label: "Anomalie" }, { value: "na", label: "N/A" }];
const AIRCRAFT_OPTS = AIRCRAFT_TYPES.map((a) => ({ value: a.key, label: a.label }));

export const AIR_FORMS: AirFormDef[] = [
  {
    kind: "flightplan", code: "AOS-FP", title: "Plan de vol", subtitle: "Modèle inspiré du plan de vol OACI (cases numérotées) et du formulaire FAA 7233-1",
    sections: [
      { title: "Identification", fields: [
        { id: "ident", box: "7", label: "Identification de l'aéronef", type: "text", span: 4, required: true, max: 12, hint: "ex. LSFD-1 ou immatriculation" },
        { id: "rules", box: "8a", label: "Règles de vol", type: "select", span: 4, options: [{ value: "V", label: "V — VFR" }, { value: "I", label: "I — IFR" }, { value: "Y", label: "Y — IFR puis VFR" }, { value: "Z", label: "Z — VFR puis IFR" }] },
        { id: "flightType", box: "8b", label: "Type de vol", type: "select", span: 4, options: [{ value: "S", label: "S — Régulier" }, { value: "N", label: "N — Non régulier" }, { value: "G", label: "G — Aviation générale" }, { value: "M", label: "M — Militaire" }, { value: "X", label: "X — Autre (urgence / secours)" }] },
        { id: "acType", box: "9", label: "Type d'aéronef", type: "select", span: 6, options: AIRCRAFT_OPTS },
        { id: "wake", box: "9", label: "Turbulence de sillage", type: "select", span: 3, options: [{ value: "L", label: "L — Légère" }, { value: "M", label: "M — Moyenne" }, { value: "H", label: "H — Lourde" }] },
        { id: "count", box: "9", label: "Nombre d'aéronefs", type: "number", span: 3, max: 20 },
        { id: "equip", box: "10", label: "Équipement radio / navigation", type: "text", span: 12, max: 60, hint: "ex. S/C — VOR, DME, transpondeur mode C, ELT" },
      ] },
      { title: "Départ", fields: [
        { id: "dep", box: "13", label: "Aérodrome de départ", type: "text", span: 6, required: true, max: 40 },
        { id: "depTime", box: "13", label: "Heure de départ (HH:MM)", type: "time", span: 6, required: true },
      ] },
      { title: "Route", fields: [
        { id: "speed", box: "15", label: "Vitesse de croisière (kt)", type: "number", span: 4, max: 400 },
        { id: "level", box: "15", label: "Niveau / altitude (ft)", type: "number", span: 4, max: 40000 },
        { id: "routeText", box: "15", label: "Route (balises VOR, points de report, waypoints)", type: "long", span: 12, max: 500, hint: "ex. LSIA → VOR SAN → DME 12 → Vinewood Pass → Sandy Shores" },
      ] },
      { title: "Destination", fields: [
        { id: "dest", box: "16", label: "Aérodrome de destination", type: "text", span: 6, required: true, max: 40 },
        { id: "eet", box: "16", label: "Durée totale estimée (HH:MM)", type: "time", span: 3 },
        { id: "alt1", box: "16", label: "Dégagement", type: "text", span: 3, max: 40 },
        { id: "other", box: "18", label: "Renseignements divers", type: "long", span: 12, max: 400, hint: "ex. RMK/ Mission largage, treuil installé, SAR" },
      ] },
      { title: "Renseignements complémentaires", fields: [
        { id: "endurance", box: "19", label: "Autonomie (HH:MM)", type: "time", span: 4, required: true },
        { id: "pob", box: "19", label: "Personnes à bord", type: "number", span: 4, required: true, max: 12 },
        { id: "elt", box: "19", label: "Radio de secours / ELT", type: "yn", span: 4, options: YN },
        { id: "survival", box: "19", label: "Équipement de survie", type: "text", span: 6, max: 80 },
        { id: "colour", box: "19", label: "Couleur et marques de l'aéronef", type: "text", span: 6, max: 80 },
        { id: "pic", box: "19", label: "Pilote commandant de bord", type: "text", span: 12, required: true, max: 80 },
      ] },
    ],
  },
  {
    kind: "frat", code: "AOS-FRAT", title: "Évaluation du risque du vol (FRAT)", subtitle: "Flight Risk Assessment Tool : décision GO / GO avec mesures / NO-GO avant le vol",
    sections: [
      { title: "Vol", fields: [
        { id: "ident", label: "Aéronef / indicatif", type: "text", span: 4, required: true, max: 20 },
        { id: "pic", label: "Pilote commandant de bord", type: "text", span: 4, required: true, max: 80 },
        { id: "date", label: "Date", type: "date", span: 4, required: true },
        { id: "mission", label: "Mission", type: "select", span: 6, options: MISSIONS.map((m) => ({ value: m.key, label: m.label })) },
        { id: "route", label: "Itinéraire / zone", type: "text", span: 6, max: 120 },
      ] },
      { title: "Pilote", fields: [
        { id: "rest", label: "Repos avant le vol", type: "score", span: 12, options: [{ value: "a", label: "Repos complet (8 h ou plus)", points: 0 }, { value: "b", label: "Repos court (5 à 8 h)", points: 3 }, { value: "c", label: "Moins de 5 h ou fatigue marquée", points: 6 }] },
        { id: "recency", label: "Récence sur le type", type: "score", span: 12, options: [{ value: "a", label: "Vol sur ce type dans les 30 derniers jours", points: 0 }, { value: "b", label: "Dernier vol entre 30 et 90 jours", points: 2 }, { value: "c", label: "Plus de 90 jours", points: 5 }] },
        { id: "health", label: "Condition physique et mentale", type: "score", span: 12, options: [{ value: "a", label: "Aucune gêne", points: 0 }, { value: "b", label: "Léger stress ou gêne", points: 3 }, { value: "c", label: "Malade, stressé ou sous traitement", points: 6 }] },
      ] },
      { title: "Aéronef", fields: [
        { id: "mx", label: "État de l'appareil", type: "score", span: 12, options: [{ value: "a", label: "Aucune anomalie ouverte", points: 0 }, { value: "b", label: "Anomalie mineure acceptée (liste d'équipement minimal)", points: 3 }, { value: "c", label: "Anomalie notable ou pré-vol incomplet", points: 7 }] },
        { id: "load", label: "Masse et centrage", type: "score", span: 12, options: [{ value: "a", label: "Largement dans les limites", points: 0 }, { value: "b", label: "Proche de la masse maximale", points: 3 }, { value: "c", label: "Dépassement possible", points: 8 }] },
      ] },
      { title: "Environnement", fields: [
        { id: "wx", label: "Météo sur la route", type: "score", span: 12, options: [{ value: "a", label: "VFR dégagé, vent faible", points: 0 }, { value: "b", label: "Visibilité réduite ou vent soutenu", points: 4 }, { value: "c", label: "Proche des minima, turbulence ou orage", points: 8 }] },
        { id: "night", label: "Luminosité", type: "score", span: 12, options: [{ value: "a", label: "Jour", points: 0 }, { value: "b", label: "Nuit avec éclairage", points: 3 }, { value: "c", label: "Nuit sans repère, terrain montagneux", points: 6 }] },
        { id: "site", label: "Zone d'intervention", type: "score", span: 12, options: [{ value: "a", label: "Terrain connu, plateforme préparée", points: 0 }, { value: "b", label: "Zone inconnue, obstacles possibles", points: 3 }, { value: "c", label: "Zone confinée, fumée ou câbles probables", points: 6 }] },
      ] },
      { title: "Pressions extérieures", fields: [
        { id: "pressure", label: "Pression de la mission", type: "score", span: 12, options: [{ value: "a", label: "Aucune", points: 0 }, { value: "b", label: "Urgence modérée", points: 2 }, { value: "c", label: "Vie en jeu, tentation de réduire les marges", points: 5 }] },
        { id: "crew", label: "Équipage", type: "score", span: 12, options: [{ value: "a", label: "Équipage complet et briefé", points: 0 }, { value: "b", label: "Équipage incomplet ou débriefing court", points: 3 }, { value: "c", label: "Équipage non briefé", points: 6 }] },
        { id: "mitigation", label: "Mesures d'atténuation décidées", type: "long", span: 12, max: 500 },
      ] },
    ],
  },
  {
    kind: "mission", code: "AOS-MR", title: "Rapport de mission aérienne", subtitle: "Compte rendu d'intervention : chronologie, résultats, incidents",
    sections: [
      { title: "Mission", fields: [
        { id: "ident", label: "Aéronef / indicatif", type: "text", span: 4, required: true, max: 20 },
        { id: "date", label: "Date", type: "date", span: 4, required: true },
        { id: "cad", label: "N° d'incident / CAD", type: "text", span: 4, max: 30 },
        { id: "type", label: "Nature de la mission", type: "select", span: 6, options: MISSIONS.map((m) => ({ value: m.key, label: m.label })) },
        { id: "requested", label: "Unité requérante", type: "text", span: 6, max: 80 },
        { id: "location", label: "Lieu d'intervention", type: "text", span: 12, max: 160 },
      ] },
      { title: "Chronologie (heures locales)", fields: [
        { id: "tAlert", label: "Alerte", type: "time", span: 3 },
        { id: "tOff", label: "Décollage", type: "time", span: 3 },
        { id: "tScene", label: "Arrivée sur zone", type: "time", span: 3 },
        { id: "tLeave", label: "Départ de zone", type: "time", span: 3 },
        { id: "tLand", label: "Atterrissage", type: "time", span: 3 },
        { id: "tReady", label: "Retour disponible", type: "time", span: 3 },
      ] },
      { title: "Équipage et résultats", fields: [
        { id: "pic", label: "Pilote commandant de bord", type: "text", span: 6, required: true, max: 80 },
        { id: "crew", label: "Équipage / passagers", type: "text", span: 6, max: 160 },
        { id: "patients", label: "Personnes prises en charge", type: "number", span: 3, max: 50 },
        { id: "hoists", label: "Treuillages", type: "number", span: 3, max: 50 },
        { id: "drops", label: "Largages d'eau", type: "number", span: 3, max: 200 },
        { id: "litres", label: "Volume largué (litres)", type: "number", span: 3, max: 200000 },
        { id: "dest", label: "Destination / hôpital", type: "text", span: 12, max: 120 },
      ] },
      { title: "Observations", fields: [
        { id: "hazards", label: "Dangers rencontrés (câbles, fumée, turbulence, oiseaux…)", type: "long", span: 12, max: 500 },
        { id: "narrative", label: "Récit de la mission", type: "long", span: 12, required: true, max: 1500 },
        { id: "incident", label: "Incident ou événement de sécurité à signaler", type: "yn", span: 4, options: YN },
        { id: "acStatus", label: "État de l'aéronef après vol", type: "select", span: 8, options: [{ value: "ok", label: "Apte au vol" }, { value: "limit", label: "Apte avec limitations" }, { value: "grounded", label: "Cloué au sol" }] },
      ] },
    ],
  },
  {
    kind: "preflight", code: "AOS-PF", title: "Visite pré-vol et anomalies", subtitle: "Liste de contrôle avant vol et fiche de discrépance (squawk) de l'aéronef",
    sections: [
      { title: "Aéronef", fields: [
        { id: "ident", label: "Immatriculation / indicatif", type: "text", span: 4, required: true, max: 20 },
        { id: "acType", label: "Type", type: "select", span: 4, options: AIRCRAFT_OPTS },
        { id: "date", label: "Date", type: "date", span: 4, required: true },
        { id: "hours", label: "Heures cellule (compteur)", type: "number", span: 4, max: 99999 },
        { id: "fuel", label: "Carburant embarqué (%)", type: "number", span: 4, max: 100 },
        { id: "pic", label: "Pilote", type: "text", span: 4, required: true, max: 80 },
      ] },
      { title: "Tour de l'appareil", fields: [
        { id: "docs", label: "Documents de bord et carnet de route", type: "check", span: 6, options: OK3 },
        { id: "fuselage", label: "Cellule, carénages, portes", type: "check", span: 6, options: OK3 },
        { id: "rotor", label: "Pales du rotor principal", type: "check", span: 6, options: OK3 },
        { id: "tail", label: "Rotor anti-couple", type: "check", span: 6, options: OK3 },
        { id: "gear", label: "Patins / train, flotteurs", type: "check", span: 6, options: OK3 },
        { id: "fluids", label: "Huile, hydraulique, fuites", type: "check", span: 6, options: OK3 },
        { id: "fuelCheck", label: "Carburant : quantité et purge", type: "check", span: 6, options: OK3 },
      ] },
      { title: "Cockpit et équipements", fields: [
        { id: "avionics", label: "Radios, GPS, transpondeur", type: "check", span: 6, options: OK3 },
        { id: "elt", label: "Balise de détresse (ELT)", type: "check", span: 6, options: OK3 },
        { id: "safety", label: "Extincteur, trousse de secours, harnais", type: "check", span: 6, options: OK3 },
        { id: "mission", label: "Équipement de mission (treuil, bambi bucket, projecteur)", type: "check", span: 6, options: OK3 },
      ] },
      { title: "Décision", fields: [
        { id: "squawk", label: "Anomalies constatées (une par ligne)", type: "long", span: 12, max: 600 },
        { id: "status", label: "État de l'appareil", type: "select", span: 6, required: true, options: [{ value: "ok", label: "Apte au vol" }, { value: "limit", label: "Apte avec limitations" }, { value: "grounded", label: "Cloué au sol" }] },
        { id: "action", label: "Mesure prise / maintenance demandée", type: "text", span: 6, max: 160 },
      ] },
    ],
  },
];
export const airForm = (kind: string) => AIR_FORMS.find((f) => f.kind === kind);

/** Total de points d'une FRAT et décision correspondante. */
export function fratResult(data: Record<string, string>): { points: number; level: "go" | "mitigate" | "nogo"; label: string; text: string } {
  const def = airForm("frat")!;
  let points = 0;
  for (const s of def.sections) for (const f of s.fields) if (f.type === "score") points += f.options?.find((o) => o.value === data[f.id])?.points ?? 0;
  if (points <= 14) return { points, level: "go", label: "GO", text: "Risque faible : vol autorisé." };
  if (points <= 29) return { points, level: "mitigate", label: "GO avec mesures", text: "Risque modéré : mesures d'atténuation écrites et accord du chef pilote." };
  return { points, level: "nogo", label: "NO-GO", text: "Risque élevé : vol à reporter ou à valider par le commandement Air Operations." };
}
