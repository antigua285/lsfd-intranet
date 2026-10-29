import { query } from "./db";
import { CAL_LIMITS, addDays, type CalCategory, type CalEvent, CAL_CATEGORIES } from "./calendar-shared";
import { parisLocalToDate } from "./drill-shared";
import type { Result } from "./validation";

export function isMissingCalendarTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === "42P01" || e?.code === "42703" || /relation "?calendar_/i.test(e?.message ?? "");
}

/** Événements qui touchent la plage [from, to] (jours YYYY-MM-DD, heure de Paris, marge d'un jour). */
export async function listCalendarEvents(from: string, to: string, withAcademy: boolean): Promise<CalEvent[]> {
  const lo = `${addDays(from, -1)}T00:00:00Z`;
  const hi = `${addDays(to, 2)}T00:00:00Z`;
  const rows = await query<{ id: string; category: string; title: string; description: string; location: string; startsAt: string; endsAt: string | null; allDay: boolean }>(
    `SELECT id, category, title, description, location, starts_at AS "startsAt", ends_at AS "endsAt", all_day AS "allDay"
       FROM calendar_events WHERE starts_at < $2 AND COALESCE(ends_at, starts_at) >= $1 ORDER BY starts_at`,
    [lo, hi]
  );
  const events: CalEvent[] = rows.map((r) => ({
    id: r.id, source: "cal", category: (CAL_CATEGORIES.some((c) => c.key === r.category) ? r.category : "evenement") as CalCategory,
    title: r.title, description: r.description, location: r.location, startsAt: new Date(r.startsAt).toISOString(),
    endsAt: r.endsAt ? new Date(r.endsAt).toISOString() : null, allDay: r.allDay, canceled: false, extra: "",
  }));
  if (withAcademy) {
    try {
      const d = await query<{ id: string; title: string; description: string; location: string; instructor: string; startsAt: string; endsAt: string | null; mandatory: boolean; canceled: boolean; cohortName: string | null }>(
        `SELECT e.id, e.title, e.description, e.location, e.instructor, e.starts_at AS "startsAt", e.ends_at AS "endsAt", e.mandatory, e.canceled, c.name AS "cohortName"
           FROM drill_events e LEFT JOIN drill_cohorts c ON c.id = e.cohort_id
          WHERE e.starts_at < $2 AND COALESCE(e.ends_at, e.starts_at) >= $1 ORDER BY e.starts_at`,
        [lo, hi]
      );
      for (const r of d) {
        const bits = [r.instructor && `Instructeur : ${r.instructor}`, r.cohortName ? `Promotion : ${r.cohortName}` : "Toutes les promotions", r.mandatory && "Obligatoire"].filter(Boolean);
        events.push({
          id: r.id, source: "drill", category: "academie", title: r.title, description: r.description, location: r.location,
          startsAt: new Date(r.startsAt).toISOString(), endsAt: r.endsAt ? new Date(r.endsAt).toISOString() : null, allDay: false, canceled: r.canceled, extra: bits.join(" · "),
        });
      }
    } catch (error) {
      if (!/drill_/i.test((error as { message?: string })?.message ?? "") && (error as { code?: string })?.code !== "42P01") throw error; // Drill Tower pas encore installée
    }
  }
  return events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export type CalInput = { title: string; category: CalCategory; description: string; location: string; startsAt: Date; endsAt: Date | null; allDay: boolean };

export function parseCalInput(raw: unknown): Result<CalInput> {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Événement invalide." };
  const r = raw as Record<string, unknown>;
  const text = (v: unknown, label: string, max: number, required: boolean): Result<string> => {
    const t = typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "";
    if (required && !t) return { ok: false, error: `${label} est obligatoire.` };
    if (t.length > max) return { ok: false, error: `${label} est trop long (${max} caractères max).` };
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(t)) return { ok: false, error: `${label} contient des caractères invalides.` };
    return { ok: true, value: t };
  };
  const title = text(r.title, "Le titre", CAL_LIMITS.title, true); if (!title.ok) return title;
  const description = text(r.description, "La description", CAL_LIMITS.description, false); if (!description.ok) return description;
  const location = text(r.location, "Le lieu", CAL_LIMITS.location, false); if (!location.ok) return location;
  const cat = CAL_CATEGORIES.find((c) => c.key === r.category && c.manual);
  if (!cat) return { ok: false, error: "Catégorie invalide." };
  const allDay = r.allDay === true;
  const fix = (v: unknown, end: boolean) => {
    if (typeof v !== "string" || !v) return null;
    const s = allDay ? `${v.slice(0, 10)}T${end ? "23:59" : "00:00"}` : v;
    return parisLocalToDate(s);
  };
  const startsAt = fix(r.startsAt, false);
  if (!startsAt) return { ok: false, error: "Date de début invalide." };
  let endsAt: Date | null = null;
  if (typeof r.endsAt === "string" && r.endsAt) {
    endsAt = fix(r.endsAt, true);
    if (!endsAt) return { ok: false, error: "Date de fin invalide." };
    if (endsAt <= startsAt) return { ok: false, error: "La fin doit être après le début." };
  }
  return { ok: true, value: { title: title.value, category: cat.key, description: description.value, location: location.value, startsAt, endsAt, allDay } };
}

export async function createCalendarEvent(i: CalInput, userId: string): Promise<void> {
  await query(
    `INSERT INTO calendar_events (title, category, description, location, starts_at, ends_at, all_day, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [i.title, i.category, i.description, i.location, i.startsAt.toISOString(), i.endsAt?.toISOString() ?? null, i.allDay, userId]
  );
}
export async function updateCalendarEvent(id: string, i: CalInput): Promise<boolean> {
  const rows = await query(
    `UPDATE calendar_events SET title=$2, category=$3, description=$4, location=$5, starts_at=$6, ends_at=$7, all_day=$8 WHERE id=$1 RETURNING id`,
    [id, i.title, i.category, i.description, i.location, i.startsAt.toISOString(), i.endsAt?.toISOString() ?? null, i.allDay]
  );
  return rows.length > 0;
}
export async function deleteCalendarEvent(id: string): Promise<boolean> {
  return (await query(`DELETE FROM calendar_events WHERE id=$1 RETURNING id`, [id])).length > 0;
}
