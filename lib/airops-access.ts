import "server-only";
import { getAccessContext, type AccessContext } from "./access";
import { AIROPS_CMD_FLAG, AIROPS_FLAG, getPilotByUser, type PilotRow } from "./airops";

export type AirAccess = { ctx: AccessContext; canView: boolean; isCmd: boolean };

/** Droits sur la section : AIROPS consulte, AIROPSCMD (et les modérateurs) éditent tout. */
export async function getAirAccess(): Promise<AirAccess | null> {
  const ctx = await getAccessContext();
  if (!ctx) return null;
  const isCmd = ctx.user.isAdmin || ctx.flags.includes(AIROPS_CMD_FLAG);
  const canView = isCmd || ctx.flags.includes(AIROPS_FLAG);
  return { ctx, canView, isCmd };
}

/** Pour les actions serveur : refuse si le compte n'a aucun accès à la section. */
export async function assertAir(): Promise<AirAccess> {
  const a = await getAirAccess();
  if (!a || !a.canView) throw new Error("Accès refusé.");
  return a;
}
export async function assertAirCmd(): Promise<AirAccess> {
  const a = await assertAir();
  if (!a.isCmd) throw new Error("Accès refusé.");
  return a;
}
export async function myPilot(a: AirAccess): Promise<PilotRow | null> {
  return getPilotByUser(a.ctx.user.id);
}
export const fullName = (a: AirAccess) => `${a.ctx.user.firstName} ${a.ctx.user.lastName}`;
