/** Calendrier général : constantes et calculs de dates sans accès base (serveur et navigateur). */
import { TZ, dayKey } from "./drill-shared";

export const CALENDAR_FLAG = "OFFICER";
export const CALENDAR_LINK = "/calendar";
export const CAL_LIMITS = { title: 120, description: 1000, location: 120 };

export type CalCategory = "formation" | "academie" | "loisir" | "evenement" | "reunion" | "ceremonie";

export const CAL_CATEGORIES: { key: CalCategory; label: string; hint: string; color: string; manual: boolean }[] = [
  { key: "formation", label: "Formation générale", hint: "Formations ouvertes à tous", color: "#1d4ed8", manual: true },
  { key: "academie", label: "Formation académie", hint: "Alimentée par la Drill Tower (visible TD / officiers)", color: "#c2410c", manual: false },
  { key: "loisir", label: "Loisirs", hint: "Golf invitational, barbecue, sorties…", color: "#15803d", manual: true },
  { key: "evenement", label: "Événement", hint: "Événements divers du département", color: "#475569", manual: true },
  { key: "reunion", label: "Réunion", hint: "Briefings, réunions d'état-major", color: "#7e22ce", manual: true },
  { key: "ceremonie", label: "Cérémonie", hint: "Remises de médailles, promotions, hommages", color: "#b91c1c", manual: true },
];
export const catOf = (k: string) => CAL_CATEGORIES.find((c) => c.key === k) ?? CAL_CATEGORIES[3];

export type CalEvent = {
  id: string;
  source: "cal" | "drill";
  category: CalCategory;
  title: string;
  description: string;
  location: string;
  startsAt: string; // ISO
  endsAt: string | null;
  allDay: boolean;
  canceled: boolean;
  extra: string; // ligne d'info (instructeur, promotion…)
};

/** Date du jour à Paris (YYYY-MM-DD). */
export function todayKey(): string {
  return dayKey(new Date().toISOString());
}

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const fromKey = (k: string) => new Date(`${k}T00:00:00Z`);
export const addDays = (k: string, n: number) => toKey(new Date(fromKey(k).getTime() + n * 86400000));

/** « 2026-11 » valide, sinon le mois en cours. */
export function parseMonth(m: string | undefined): { year: number; month: number } {
  const r = /^(\d{4})-(\d{2})$/.exec(m ?? "");
  if (r && +r[2] >= 1 && +r[2] <= 12 && +r[1] >= 2000 && +r[1] <= 2100) return { year: +r[1], month: +r[2] };
  const t = todayKey();
  return { year: +t.slice(0, 4), month: +t.slice(5, 7) };
}
export const monthParam = (year: number, month: number) => `${year}-${pad(month)}`;
export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}
export const monthTitle = (year: number, month: number) => {
  const t = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("fr-FR", { timeZone: "UTC", month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Semaines affichées (dimanche → samedi), jours des mois voisins inclus. */
export function monthGrid(year: number, month: number): { key: string; day: number; inMonth: boolean }[][] {
  const first = `${year}-${pad(month)}-01`;
  const start = addDays(first, -fromKey(first).getUTCDay()); // getUTCDay : 0 = dimanche
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weeks = Math.ceil((fromKey(first).getUTCDay() + daysInMonth) / 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const key = addDays(start, w * 7 + d);
      return { key, day: +key.slice(8, 10), inMonth: key.slice(0, 7) === first.slice(0, 7) };
    })
  );
}

/** Tous les jours (Paris) couverts par un événement. */
export function eventDays(e: { startsAt: string; endsAt: string | null }): string[] {
  const a = dayKey(e.startsAt);
  const b = e.endsAt ? dayKey(e.endsAt) : a;
  const out: string[] = [];
  for (let k = a; k <= b && out.length < 62; k = addDays(k, 1)) out.push(k);
  return out;
}

export const WEEKDAYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
export { TZ };
