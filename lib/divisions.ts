import "server-only";
import { DIVISION_MODULES, type DivisionModule } from "@/config/divisions";
import { getAccessContext, isRecruitOnly } from "./access";
import { hasAccess } from "./access-rules";

/** Divisions que le compte connecté peut voir (aucun flag divisionnaire = liste vide). */
export async function getVisibleDivisions(): Promise<DivisionModule[]> {
  const ctx = await getAccessContext();
  if (!ctx) return [];
  if (isRecruitOnly(ctx.user.isAdmin, ctx.flags)) return [];
  return DIVISION_MODULES.filter((d) => hasAccess(ctx.user.isAdmin, ctx.flags, d.flags));
}
