/** Cartes aéronautiques, tracés de préparation de vol et calculs de navigation (sans accès base : serveur et navigateur). */

export type ChartKind = "airport" | "sectional";

/**
 * Cartes disponibles. Les images se déposent dans public/aviation/ (voir LISEZ-MOI.txt).
 * `defaultNmPerWidth` : milles nautiques couverts par la LARGEUR de l'image (indépendant de la résolution).
 * Une carte sans valeur doit être calibrée une fois (« Calibrer l'échelle »).
 */
export type ChartDef = { key: string; kind: ChartKind; ident: string; title: string; subtitle: string; image: string; defaultNmPerWidth?: number; freqs?: string[] };
export const CHARTS: ChartDef[] = [
  { key: "lsx", kind: "airport", ident: "LSX", title: "Los Santos Intl", subtitle: "Airport Diagram", image: "/aviation/lsx.png", freqs: ["TWR 120.95", "ATIS 133.9"] },
  { key: "sda", kind: "airport", ident: "SDA", title: "Sandy Shores Airfield", subtitle: "Airport Diagram", image: "/aviation/sda.png" },
  { key: "gbc", kind: "airport", ident: "GBC", title: "McKenzie / Grapeseed Airfield", subtitle: "Airport Diagram", image: "/aviation/gbc.png" },
  { key: "sectional", kind: "sectional", ident: "LSA", title: "Los Santos Sectional", subtitle: "VFR Sectional Chart · VOR-DME LSA 113.9", image: "/aviation/los-santos-sectional.png", defaultNmPerWidth: 97.7, freqs: ["VOR-DME LSA 113.9 (Ch 86)"] },
];
export const chartDef = (key: string) => CHARTS.find((c) => c.key === key);
export const KIND_LABEL: Record<ChartKind, string> = { airport: "Airport Diagram", sectional: "Sectional Chart" };

/* ------------------------------------------------------------------ points de carte */
export const POINT_KINDS = [
  { key: "airport", label: "Aérodrome", color: "#1d4ed8" },
  { key: "heliport", label: "Héliport / hélistation", color: "#b91c1c" },
  { key: "vor", label: "VOR-DME", color: "#1d4ed8" },
  { key: "waypoint", label: "Point VFR (waypoint)", color: "#a21caf" },
  { key: "reporting", label: "Point de report", color: "#a21caf" },
  { key: "landing", label: "Zone de poser (LZ)", color: "#15803d" },
  { key: "dip", label: "Point d'eau (dip site)", color: "#0369a1" },
  { key: "obstacle", label: "Obstacle", color: "#374151" },
  { key: "hazard", label: "Danger", color: "#c2410c" },
] as const;
export type PointKind = (typeof POINT_KINDS)[number]["key"];
export const pointKind = (k: string) => POINT_KINDS.find((p) => p.key === k) ?? POINT_KINDS[3];
export type ChartPoint = { id: string; chartKey: string; kind: PointKind; ident: string; name: string; x: number; y: number; freq: string; elevation: number | null; note: string };
export const POINT_LIMITS = { ident: 12, name: 60, freq: 60, note: 300 };

/** Symboles SVG (24×24) : constantes, jamais construits à partir de texte saisi. */
export function symbolSvg(kind: string, color: string): string {
  const s = `stroke="${color}" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
  switch (kind) {
    case "airport": return `<svg viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="12" r="8" fill="#fff" ${s.replace('fill="none"', "")}/><path d="M12 5v14M5 12h14" ${s}/></svg>`;
    case "heliport": return `<svg viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="12" r="9" fill="#fff" stroke="${color}" stroke-width="2"/><path d="M8.5 7.5v9M15.5 7.5v9M8.5 12h7" ${s}/></svg>`;
    case "vor": return `<svg viewBox="0 0 24 24" width="28" height="28"><rect x="3" y="3" width="18" height="18" fill="#fff" ${s.replace('fill="none"', "")}/><path d="M12 5.5l5.2 3v6L12 17.5l-5.2-3v-6z" ${s}/><circle cx="12" cy="11.5" r="1.4" fill="${color}"/></svg>`;
    case "waypoint": return `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 3l9 17H3z" fill="#fff" ${s.replace('fill="none"', "")}/><circle cx="12" cy="14" r="1.6" fill="${color}"/></svg>`;
    case "reporting": return `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 3l9 17H3z" fill="${color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    case "landing": return `<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="8" fill="#fff" stroke="${color}" stroke-width="2" stroke-dasharray="3 2.5"/><path d="M9 8.5v7M15 8.5v7M9 12h6" ${s}/></svg>`;
    case "dip": return `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 3.5c3.6 4.4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.300 2.400-6.100 6-10.500z" fill="#fff" ${s.replace('fill="none"', "")}/></svg>`;
    case "obstacle": return `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 3L5 21M12 3l7 18M8 13h8" ${s}/></svg>`;
    default: return `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 3l10 18H2z" fill="#fff7ed" ${s.replace('fill="none"', "")}/><path d="M12 10v5" ${s}/><circle cx="12" cy="18" r="0.9" fill="${color}"/></svg>`;
  }
}

/* ------------------------------------------------------------------ données d'un tracé */
export const MARK_COLORS = ["#c026d3", "#dc2626", "#2563eb", "#16a34a", "#ea580c", "#111827"] as const;
export type RoutePt = { x: number; y: number; name: string; pointId?: string };
export type Mark =
  | { id: string; t: "line"; color: string; pts: [number, number][] }
  | { id: string; t: "text"; color: string; x: number; y: number; text: string }
  | { id: string; t: "symbol"; color: string; x: number; y: number; kind: PointKind; text: string };
export type Pattern = { id: string; start: [number, number]; end: [number, number]; side: "L" | "R"; altAgl: number; heli: boolean };
export type PlanData = { route: RoutePt[]; tas: number; windDir: number | null; windSpd: number; magVar: number; marks: Mark[]; patterns: Pattern[] };
export const PLAN_LIMITS = { route: 40, marks: 150, linePts: 400, patterns: 4, title: 80, name: 40, text: 60 };
export const emptyPlan = (): PlanData => ({ route: [], tas: 100, windDir: null, windSpd: 0, magVar: 13, marks: [], patterns: [] });
export const uid = () => Math.random().toString(36).slice(2, 10);

/* ------------------------------------------------------------------ navigation */
const NM_PER_FT = 1 / 6076.12;
export const nmToFt = (nm: number) => nm * 6076.12;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const norm360 = (d: number) => ((d % 360) + 360) % 360;

/** Position en « unités de largeur » : X = x, Y = y × (hauteur / largeur). Le nord est en haut de l'image. */
export const toW = (p: { x: number; y: number }, aspect: number) => ({ x: p.x, y: p.y * aspect });

export type Leg = { from: string; to: string; tc: number; mc: number; th: number | null; mh: number | null; nm: number; gs: number; wca: number | null; minutes: number | null };
/**
 * Route vraie (TC) = angle depuis le nord. Cap magnétique = TC − variation Est (variation Est : on SOUSTRAIT).
 * Avec vent (direction d'où il vient, force) : correction de dérive WCA = asin(W/V × sin(WD − TC)), TH = TC + WCA,
 * vitesse sol GS = V cos(WCA) − W cos(WD − TC).
 */
export function computeLegs(route: RoutePt[], aspect: number, nmPerWidth: number | null, tas: number, windDir: number | null, windSpd: number, magVar: number): Leg[] {
  const legs: Leg[] = [];
  for (let i = 0; i + 1 < route.length; i++) {
    const a = toW(route[i], aspect), b = toW(route[i + 1], aspect);
    const dx = b.x - a.x, dy = b.y - a.y;
    const tc = norm360(deg(Math.atan2(dx, -dy)));
    const nm = nmPerWidth ? Math.hypot(dx, dy) * nmPerWidth : 0;
    let th: number | null = null, wca: number | null = null, gs = tas;
    if (windDir !== null && windSpd > 0 && tas > 0) {
      const s = (windSpd / tas) * Math.sin(rad(windDir - tc));
      if (Math.abs(s) < 1) {
        wca = deg(Math.asin(s));
        th = norm360(tc + wca);
        gs = tas * Math.cos(rad(wca)) - windSpd * Math.cos(rad(windDir - tc));
      } else gs = 0; // vent plus fort que la vitesse propre : route intenable
    } else th = tc;
    const mc = norm360(tc - magVar);
    const mh = th === null ? null : norm360(th - magVar);
    legs.push({ from: route[i].name, to: route[i + 1].name, tc, mc, th, mh, nm, gs, wca, minutes: nmPerWidth && gs > 0 ? (nm / gs) * 60 : null });
  }
  return legs;
}

/** Circuit d'atterrissage : points du tracé, en fractions d'image. start = seuil d'atterrissage, end = bout de piste. */
export type PatternGeo = { runway: [number, number][]; legs: { name: "UPWIND" | "CROSSWIND" | "DOWNWIND" | "BASE" | "FINAL"; pts: [number, number][] }[]; lengthNm: number | null };
export function patternGeometry(p: Pattern, aspect: number, nmPerWidth: number | null): PatternGeo | null {
  const T = toW({ x: p.start[0], y: p.start[1] }, aspect), E = toW({ x: p.end[0], y: p.end[1] }, aspect);
  const vx = E.x - T.x, vy = E.y - T.y, L = Math.hypot(vx, vy);
  if (L < 1e-5) return null;
  const u = { x: vx / L, y: vy / L };
  const left = { x: u.y, y: -u.x };
  const n = p.side === "L" ? left : { x: -left.x, y: -left.y };
  // Dimensions : en milles si l'échelle est connue (hélicoptère = circuit plus serré), sinon proportionnelles à la piste.
  const dim = p.heli ? { off: 0.35, ext: 0.4, fin: 0.7 } : { off: 0.6, ext: 0.6, fin: 1.1 };
  const w = (nm: number, rel: number) => (nmPerWidth ? nm / nmPerWidth : L * rel);
  const off = w(dim.off, 0.45), ext = w(dim.ext, 0.4), fin = w(dim.fin, 0.8);
  const F = { x: T.x - u.x * fin, y: T.y - u.y * fin };
  const B = { x: F.x + n.x * off, y: F.y + n.y * off };
  const C1 = { x: E.x + u.x * ext, y: E.y + u.y * ext };
  const C2 = { x: C1.x + n.x * off, y: C1.y + n.y * off };
  const back = (q: { x: number; y: number }): [number, number] => [q.x, q.y / aspect];
  return {
    runway: [back(T), back(E)],
    legs: [
      { name: "UPWIND", pts: [back(E), back(C1)] },
      { name: "CROSSWIND", pts: [back(C1), back(C2)] },
      { name: "DOWNWIND", pts: [back(C2), back(B)] },
      { name: "BASE", pts: [back(B), back(F)] },
      { name: "FINAL", pts: [back(F), back(T)] },
    ],
    lengthNm: nmPerWidth ? L * nmPerWidth : null,
  };
}

/** Échelle (NM sur la largeur de l'image) à partir de deux points et de la distance réelle entre eux (en NM). */
export function calibrate(a: [number, number], b: [number, number], aspect: number, realNm: number): number | null {
  const d = Math.hypot(b[0] - a[0], (b[1] - a[1]) * aspect);
  return d > 1e-6 && realNm > 0 ? realNm / d : null;
}
export const feetToNm = (ft: number) => ft * NM_PER_FT;
export const fmtNm = (nm: number, unit: "nm" | "ft") => (unit === "ft" ? `${Math.round(nmToFt(nm)).toLocaleString("fr-FR")} ft` : `${nm.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} NM`);
export const fmtDeg = (d: number) => `${String(Math.round(d) % 360).padStart(3, "0")}°`;
export function fmtMin(m: number | null): string {
  if (m === null) return "—";
  const t = Math.round(m);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}
