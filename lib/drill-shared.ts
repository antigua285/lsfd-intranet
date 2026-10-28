/** Drill Tower : constantes et utilitaires sans accès base (utilisables côté serveur et navigateur). */

export const DRILL_FLAG = "DTRECRUIT";
export const DRILL_LINK = "/drill-tower";
export const GRADUATE_FLAG = "PROB";

export const DRILL_LIMITS = { title: 120, description: 1000, location: 120, instructor: 80, cohort: 60 };

export type DrillEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string; // ISO
  endsAt: string | null;
  location: string;
  instructor: string;
  mandatory: boolean;
  canceled: boolean;
  cohortId: string | null;
  cohortName: string | null;
};

export type Cohort = { id: string; name: string; startsOn: string | null; graduatedAt: string | null; createdAt: string };
export type CohortMember = { userId: string; name: string; grade: string; station: string; graduatedAt: string | null };
export type CohortWithMembers = Cohort & { members: CohortMember[] };

export const TZ = "Europe/Paris";

function offsetMinutes(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(utcMs));
  const v = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return (Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second")) - utcMs) / 60000;
}

/** « 2026-11-05T18:30 » saisi à l'heure de Paris → instant réel. */
export function parisLocalToDate(local: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let t = guess - offsetMinutes(guess) * 60000;
  const second = offsetMinutes(t);
  if (second !== offsetMinutes(guess)) t = guess - second * 60000; // passage heure d'été / hiver
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Instant réel → valeur d'un champ datetime-local, à l'heure de Paris. */
export function dateToParisLocal(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(d);
  const v = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}`;
}

export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
export const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });

/** Plage horaire lisible : « 18:30 – 20:00 » ou « 18:30 ». */
export function fmtRange(e: { startsAt: string; endsAt: string | null }): string {
  return e.endsAt ? `${fmtTime(e.startsAt)} – ${fmtTime(e.endsAt)}` : fmtTime(e.startsAt);
}
