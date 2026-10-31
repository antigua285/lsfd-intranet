"use server";

import { revalidatePath } from "next/cache";
import { assertAir, assertAirCmd, fullName, myPilot } from "@/lib/airops-access";
import {
  createFlight, createForm, createPilot, deleteFlight, deleteForm, deletePilot, getFlight, getForm, getPilot, isMissingAiropsTableError,
  parseFlightInput, parseFormData, parsePilotInput, parseRankChange, setFlightSignature, setFormSignature, setPilotRank, updateFlight, updateForm, updatePilot,
} from "@/lib/airops";
import { UUID_PATTERN } from "@/lib/validation";

export type AirResult = { ok: true; message: string; id?: string } | { ok: false; error: string };

async function guarded(work: () => Promise<AirResult>): Promise<AirResult> {
  try {
    const r = await work();
    if (r.ok) revalidatePath("/airops", "layout");
    return r;
  } catch (error) {
    if (isMissingAiropsTableError(error)) return { ok: false, error: "La base n'est pas à jour : lance `npm run db:setup` depuis ton PC." };
    throw error;
  }
}
const bad = (error: string): AirResult => ({ ok: false, error });
const okId = (s: string) => UUID_PATTERN.test(s);

/* ---------------------------------------------------------------- carnets */
export async function createLogbookAction(userId: string): Promise<AirResult> {
  const a = await assertAirCmd();
  return guarded(async () => {
    if (!okId(userId)) return bad("Compte invalide.");
    const id = await createPilot(userId, fullName(a));
    return id ? { ok: true, message: "Carnet ouvert.", id } : bad("Ce compte a déjà un carnet (ou n'existe plus).");
  });
}
export async function savePilotAction(pilotId: string, raw: unknown): Promise<AirResult> {
  await assertAirCmd();
  return guarded(async () => {
    if (!okId(pilotId)) return bad("Carnet invalide.");
    const p = parsePilotInput(raw);
    if (!p.ok) return bad(p.error);
    return (await updatePilot(pilotId, p.value)) ? { ok: true, message: "Fiche pilote enregistrée." } : bad("Ce carnet n'existe plus.");
  });
}
export async function setRankAction(pilotId: string, raw: unknown): Promise<AirResult> {
  const a = await assertAirCmd();
  return guarded(async () => {
    if (!okId(pilotId)) return bad("Carnet invalide.");
    const p = parseRankChange(raw);
    if (!p.ok) return bad(p.error);
    return (await setPilotRank(pilotId, p.value.rank, p.value.note, fullName(a))) ? { ok: true, message: "Rang interne mis à jour." } : bad("Ce carnet n'existe plus.");
  });
}
export async function deleteLogbookAction(pilotId: string): Promise<AirResult> {
  await assertAirCmd();
  return guarded(async () => (okId(pilotId) && (await deletePilot(pilotId)) ? { ok: true, message: "Carnet supprimé." } : bad("Ce carnet n'existe plus.")));
}

/* ---------------------------------------------------------------- vols */
/** Le pilote saisit son propre carnet tant que la ligne n'est pas contresignée ; AIROPSCMD saisit partout. */
async function canWriteFlight(pilotId: string, flightId: string | null) {
  const a = await assertAir();
  if (a.isCmd) return { a, allowed: true };
  const me = await myPilot(a);
  if (!me || me.id !== pilotId) return { a, allowed: false };
  if (flightId) {
    const f = await getFlight(flightId);
    if (!f || f.pilotId !== pilotId || f.signedAt) return { a, allowed: false };
  }
  return { a, allowed: true };
}
export async function saveFlightAction(pilotId: string, flightId: string | null, raw: unknown): Promise<AirResult> {
  if (!okId(pilotId) || (flightId && !okId(flightId))) return bad("Vol invalide.");
  const { a, allowed } = await canWriteFlight(pilotId, flightId);
  if (!allowed) return bad("Tu ne peux pas modifier cette ligne (carnet d'un autre pilote ou vol déjà contresigné).");
  return guarded(async () => {
    const p = parseFlightInput(raw);
    if (!p.ok) return bad(p.error);
    if (!(await getPilot(pilotId))) return bad("Ce carnet n'existe plus.");
    if (flightId === null) { await createFlight(pilotId, p.value, fullName(a)); return { ok: true, message: "Vol ajouté au carnet." }; }
    return (await updateFlight(flightId, p.value)) ? { ok: true, message: "Vol modifié (contresignature retirée)." } : bad("Ce vol n'existe plus.");
  });
}
export async function deleteFlightAction(pilotId: string, flightId: string): Promise<AirResult> {
  if (!okId(pilotId) || !okId(flightId)) return bad("Vol invalide.");
  const { allowed } = await canWriteFlight(pilotId, flightId);
  if (!allowed) return bad("Tu ne peux pas supprimer cette ligne.");
  return guarded(async () => ((await deleteFlight(flightId)) ? { ok: true, message: "Vol supprimé." } : bad("Ce vol n'existe plus.")));
}
export async function signFlightAction(flightId: string, sign: boolean): Promise<AirResult> {
  const a = await assertAirCmd();
  return guarded(async () => (okId(flightId) && (await setFlightSignature(flightId, sign ? fullName(a) : null)) ? { ok: true, message: sign ? "Vol contresigné." : "Contresignature retirée." } : bad("Ce vol n'existe plus.")));
}

/* ---------------------------------------------------------------- formulaires */
export async function saveAirFormAction(kind: string, formId: string | null, raw: unknown): Promise<AirResult> {
  const a = await assertAir();
  if (formId && !okId(formId)) return bad("Formulaire invalide.");
  return guarded(async () => {
    const data = parseFormData(kind, raw);
    if (!data.ok) return bad(data.error);
    if (formId === null) {
      const me = await myPilot(a);
      const id = await createForm(kind, data.value, me?.id ?? null, a.ctx.user.id, fullName(a));
      return { ok: true, message: "Formulaire enregistré.", id };
    }
    const f = await getForm(formId);
    if (!f || f.kind !== kind) return bad("Ce formulaire n'existe plus.");
    if (!a.isCmd && (f.authorId !== a.ctx.user.id || f.signedAt)) return bad("Tu ne peux pas modifier ce formulaire (autre auteur ou déjà contresigné).");
    return (await updateForm(formId, kind, data.value)) ? { ok: true, message: "Formulaire modifié.", id: formId } : bad("Ce formulaire n'existe plus.");
  });
}
export async function deleteAirFormAction(formId: string): Promise<AirResult> {
  const a = await assertAir();
  return guarded(async () => {
    if (!okId(formId)) return bad("Formulaire invalide.");
    const f = await getForm(formId);
    if (!f) return bad("Ce formulaire n'existe plus.");
    if (!a.isCmd && (f.authorId !== a.ctx.user.id || f.signedAt)) return bad("Tu ne peux pas supprimer ce formulaire.");
    return (await deleteForm(formId)) ? { ok: true, message: "Formulaire supprimé." } : bad("Ce formulaire n'existe plus.");
  });
}
export async function signAirFormAction(formId: string, sign: boolean): Promise<AirResult> {
  const a = await assertAirCmd();
  return guarded(async () => (okId(formId) && (await setFormSignature(formId, sign ? fullName(a) : null)) ? { ok: true, message: sign ? "Formulaire contresigné." : "Contresignature retirée." } : bad("Ce formulaire n'existe plus.")));
}
