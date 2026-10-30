/** Fiche de personnel : types et utilitaires sans accès base (serveur et navigateur). */

export const STAFF_FLAG = "OFFICER";

export const DB_STATUSES = [
  { value: "actif", label: "Actif" },
  { value: "modifications", label: "Modifications nécessaires" },
] as const;

export const EMPLOYMENT_STATUSES = [
  { value: "actif", label: "Actif" },
  { value: "suspendu", label: "Suspendu" },
  { value: "retraite", label: "Retraité" },
  { value: "separe", label: "Séparé" },
] as const;

export const labelOf = (list: readonly { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? v;

export type SheetRow = {
  history: { id: string; date: string; rank: string; assignment: string }[];
  assignments: { id: string; unit: string; startedOn: string; endedOn: string | null }[];
  discipline: { id: string; date: string; sanction: string; details: string }[];
  contacts: { id: string; name: string; address: string; phone: string }[];
};

export type Sheet = {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  grade: string;
  station: string;
  phone: string | null;
  rankId: string | null;
  fpId: string;
  dbStatus: string;
  badge: string;
  birthDate: string | null;
  languages: string;
  phone2: string | null;
  address: string | null; // null = confidentiel (non transmis)
  employmentStatus: string;
  hiredOn: string | null;
  bureau: string;
  history: SheetRow["history"];
  assignments: SheetRow["assignments"];
  discipline: SheetRow["discipline"] | null; // null = confidentiel
  contacts: SheetRow["contacts"] | null; // null = confidentiel
};

export type Perms = { isSelf: boolean; isStaff: boolean; canConfidential: boolean };

/** Âge en années pleines à partir d'une date « YYYY-MM-DD ». */
export function ageFrom(birth: string, today: string): number {
  const [by, bm, bd] = birth.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

export const fmtDate = (d: string | null) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" }) : "—");
