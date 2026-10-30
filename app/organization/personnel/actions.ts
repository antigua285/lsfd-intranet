"use server";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access";
import { isMissingPersonnelTableError, parseDate, parsePhone, parseShortText, parseText, ensureProfile } from "@/lib/personnel";
import { DB_STATUSES, EMPLOYMENT_STATUSES, STAFF_FLAG } from "@/lib/personnel-shared";
import { isMissingRankTableError, setUserRank } from "@/lib/ranks";
import { query } from "@/lib/db";
import { UUID_PATTERN } from "@/lib/validation";

export type SheetResult = { ok: true; message: string } | { ok: false; error: string };
const fail = (error: string): SheetResult => ({ ok: false, error });

/** Qui agit sur cette fiche : le propriétaire, les OFFICER et les modérateurs. Relu côté serveur à chaque appel. */
async function actor(userId: string) {
  const ctx = await getAccessContext();
  if (!ctx) throw new Error("Accès refusé.");
  if (!UUID_PATTERN.test(userId)) return null;
  const isStaff = ctx.user.isAdmin || ctx.flags.includes(STAFF_FLAG);
  return { ctx, isStaff, isSelf: ctx.user.id === userId };
}

async function guarded(userId: string, work: () => Promise<SheetResult>): Promise<SheetResult> {
  try {
    const r = await work();
    if (r.ok) { revalidatePath(`/organization/personnel/${userId}`); revalidatePath("/organization/personnel"); revalidatePath("/profile"); }
    return r;
  } catch (error) {
    if (isMissingPersonnelTableError(error)) return fail("La base n'est pas à jour : lance `npm run db:setup` depuis ton PC.");
    throw error;
  }
}

const obj = (raw: unknown) => (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});

/** Section 0 : statut de la base (le propriétaire ou un officier). */
export async function saveBaseAction(userId: string, raw: unknown): Promise<SheetResult> {
  const a = await actor(userId);
  if (!a || !(a.isSelf || a.isStaff)) return fail("Accès refusé.");
  return guarded(userId, async () => {
    const v = obj(raw).dbStatus;
    if (!DB_STATUSES.some((s) => s.value === v)) return fail("Statut invalide.");
    await ensureProfile(userId);
    await query(`UPDATE profiles SET db_status = $2 WHERE user_id = $1`, [userId, v]);
    return { ok: true, message: "Statut enregistré." };
  });
}

/** Section 1 : le propriétaire modifie ses champs ; seul un officier modifie le nom. */
export async function savePersonalAction(userId: string, raw: unknown): Promise<SheetResult> {
  const a = await actor(userId);
  if (!a || !(a.isSelf || a.isStaff)) return fail("Accès refusé.");
  return guarded(userId, async () => {
    const r = obj(raw);
    const badge = parseText(r.badge, "Le numéro de badge", 20); if (!badge.ok) return fail(badge.error);
    const birth = parseDate(r.birthDate, "La date de naissance", false); if (!birth.ok) return fail(birth.error);
    if (birth.value && birth.value > new Date().toISOString().slice(0, 10)) return fail("La date de naissance est dans le futur.");
    const languages = parseText(r.languages, "Les langues", 120); if (!languages.ok) return fail(languages.error);
    const phone = parsePhone(typeof r.phone === "string" ? r.phone : ""); if (!phone.ok) return fail(phone.error);
    const phone2 = parsePhone(typeof r.phone2 === "string" ? r.phone2 : ""); if (!phone2.ok) return fail(phone2.error);
    const address = parseText(r.address, "L'adresse", 200); if (!address.ok) return fail(address.error);
    await ensureProfile(userId);
    if (a.isStaff) {
      const first = parseShortText(String(r.firstName ?? ""), "Le prénom"); if (!first.ok) return fail(first.error);
      const last = parseShortText(String(r.lastName ?? ""), "Le nom"); if (!last.ok) return fail(last.error);
      await query(`UPDATE users SET first_name = $2, last_name = $3 WHERE id = $1`, [userId, first.value, last.value]);
    }
    await query(`UPDATE users SET phone = $2 WHERE id = $1`, [userId, phone.value]);
    await query(`UPDATE profiles SET badge=$2, birth_date=$3, languages=$4, phone2=$5, address=$6 WHERE user_id=$1`, [userId, badge.value, birth.value, languages.value, phone2.value, address.value]);
    return { ok: true, message: "Informations enregistrées." };
  });
}

/** Section 2 : réservée aux officiers et modérateurs. */
export async function saveEmploymentAction(userId: string, raw: unknown): Promise<SheetResult> {
  const a = await actor(userId);
  if (!a || !a.isStaff) return fail("Accès refusé.");
  return guarded(userId, async () => {
    const r = obj(raw);
    if (!EMPLOYMENT_STATUSES.some((s) => s.value === r.employmentStatus)) return fail("Statut actuel invalide.");
    const hired = parseDate(r.hiredOn, "La date de recrutement", false); if (!hired.ok) return fail(hired.error);
    const bureau = parseText(r.bureau, "Le bureau", 60); if (!bureau.ok) return fail(bureau.error);
    const station = parseShortText(String(r.station ?? ""), "La station"); if (!station.ok) return fail(station.error);
    await ensureProfile(userId);
    const rankId = typeof r.rankId === "string" && r.rankId ? r.rankId : null;
    if (rankId) {
      if (!UUID_PATTERN.test(rankId)) return fail("Rang invalide.");
      try {
        // Un officier non modérateur ne peut donner / retirer que les flags qu'il possède lui-même.
        if (!(await setUserRank(userId, rankId, a.ctx.user.isAdmin ? undefined : a.ctx.flags))) return fail("Ce rang n'existe plus.");
      } catch (error) {
        if (!isMissingRankTableError(error)) throw error;
      }
    }
    await query(`UPDATE users SET station = $2 WHERE id = $1`, [userId, station.value]);
    await query(`UPDATE profiles SET employment_status=$2, hired_on=$3, bureau=$4 WHERE user_id=$1`, [userId, r.employmentStatus, hired.value, bureau.value || "Central"]);
    return { ok: true, message: "Emploi enregistré." };
  });
}

export type RowKind = "history" | "assignments" | "discipline" | "contacts";

/** Qui peut modifier chaque liste : l'historique, les affectations et la discipline sont réservés aux officiers. */
const canEditKind = (kind: RowKind, a: { isSelf: boolean; isStaff: boolean }) => (kind === "contacts" ? a.isSelf || a.isStaff : a.isStaff);

export async function addRowAction(userId: string, kind: RowKind, raw: unknown): Promise<SheetResult> {
  const a = await actor(userId);
  if (!a || !["history", "assignments", "discipline", "contacts"].includes(kind) || !canEditKind(kind, a)) return fail("Accès refusé.");
  return guarded(userId, async () => {
    const r = obj(raw);
    await ensureProfile(userId);
    if (kind === "history") {
      const date = parseDate(r.date, "La date", true); if (!date.ok) return fail(date.error);
      const rank = parseText(r.rank, "Le rang", 60); if (!rank.ok) return fail(rank.error);
      const assignment = parseText(r.assignment, "L'affectation", 120); if (!assignment.ok) return fail(assignment.error);
      if (!rank.value && !assignment.value) return fail("Indique un rang ou une affectation.");
      await query(`INSERT INTO profile_history (user_id, on_date, rank, assignment) VALUES ($1,$2,$3,$4)`, [userId, date.value, rank.value, assignment.value]);
    } else if (kind === "assignments") {
      const unit = parseText(r.unit, "L'unité", 80, true); if (!unit.ok) return fail(unit.error);
      const start = parseDate(r.startedOn, "La date de début", true); if (!start.ok) return fail(start.error);
      const end = parseDate(r.endedOn, "La date de fin", false); if (!end.ok) return fail(end.error);
      if (end.value && end.value < start.value!) return fail("La fin doit être après le début.");
      await query(`INSERT INTO profile_assignments (user_id, unit, started_on, ended_on) VALUES ($1,$2,$3,$4)`, [userId, unit.value, start.value, end.value]);
    } else if (kind === "discipline") {
      const date = parseDate(r.date, "La date", true); if (!date.ok) return fail(date.error);
      const sanction = parseText(r.sanction, "La sanction", 100, true); if (!sanction.ok) return fail(sanction.error);
      const details = parseText(r.details, "Les détails", 500); if (!details.ok) return fail(details.error);
      await query(`INSERT INTO profile_discipline (user_id, on_date, sanction, details) VALUES ($1,$2,$3,$4)`, [userId, date.value, sanction.value, details.value]);
    } else {
      const name = parseText(r.name, "Le nom du contact", 100, true); if (!name.ok) return fail(name.error);
      const address = parseText(r.address, "L'adresse", 200); if (!address.ok) return fail(address.error);
      const phone = parsePhone(typeof r.phone === "string" ? r.phone : ""); if (!phone.ok) return fail(phone.error);
      if (!phone.value) return fail("Le numéro de téléphone est obligatoire.");
      await query(`INSERT INTO profile_contacts (user_id, name, address, phone) VALUES ($1,$2,$3,$4)`, [userId, name.value, address.value, phone.value]);
    }
    return { ok: true, message: "Ligne ajoutée." };
  });
}

const TABLES: Record<RowKind, string> = { history: "profile_history", assignments: "profile_assignments", discipline: "profile_discipline", contacts: "profile_contacts" };

export async function deleteRowAction(userId: string, kind: RowKind, rowId: string): Promise<SheetResult> {
  const a = await actor(userId);
  if (!a || !(kind in TABLES) || !canEditKind(kind, a) || !UUID_PATTERN.test(rowId)) return fail("Accès refusé.");
  return guarded(userId, async () => {
    const rows = await query(`DELETE FROM ${TABLES[kind]} WHERE id = $1 AND user_id = $2 RETURNING id`, [rowId, userId]);
    return rows.length ? { ok: true, message: "Ligne supprimée." } : fail("Cette ligne n'existe plus.");
  });
}

/** Marque la fin d'une affectation (officiers). */
export async function endAssignmentAction(userId: string, rowId: string, date: string): Promise<SheetResult> {
  const a = await actor(userId);
  if (!a || !a.isStaff || !UUID_PATTERN.test(rowId)) return fail("Accès refusé.");
  return guarded(userId, async () => {
    const d = parseDate(date, "La date de fin", true); if (!d.ok) return fail(d.error);
    const rows = await query(`UPDATE profile_assignments SET ended_on = $3 WHERE id = $1 AND user_id = $2 AND started_on <= $3 RETURNING id`, [rowId, userId, d.value]);
    return rows.length ? { ok: true, message: "Affectation terminée." } : fail("Date de fin invalide ou affectation introuvable.");
  });
}
