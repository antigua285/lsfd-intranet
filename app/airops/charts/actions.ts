"use server";

import { revalidatePath } from "next/cache";
import { assertAir, assertAirCmd, fullName, myPilot } from "@/lib/airops-access";
import { createForm, isMissingAiropsTableError } from "@/lib/airops";
import { chartDef } from "@/lib/airops-charts";
import {
  createChartPoint, createPlan, deleteChartPoint, deletePlan, getPlan, parsePlanData, parsePlanTitle, parsePointInput, setCalibration, updateChartPoint, updatePlan,
} from "@/lib/airops-charts-db";
import { UUID_PATTERN } from "@/lib/validation";

export type ChartResult = { ok: true; message: string; id?: string } | { ok: false; error: string };
const bad = (error: string): ChartResult => ({ ok: false, error });

async function guarded(key: string, work: () => Promise<ChartResult>): Promise<ChartResult> {
  try {
    if (!chartDef(key)) return bad("Carte inconnue.");
    const r = await work();
    if (r.ok) revalidatePath(`/airops/charts/${key}`);
    return r;
  } catch (error) {
    if (isMissingAiropsTableError(error)) return bad("La base n'est pas à jour : lance `npm run db:setup` depuis ton PC.");
    throw error;
  }
}

/* ------------------------------------------------------------ échelle (commandement) */
export async function saveCalibrationAction(key: string, nmPerWidth: number): Promise<ChartResult> {
  const a = await assertAirCmd();
  return guarded(key, async () => {
    if (typeof nmPerWidth !== "number" || !Number.isFinite(nmPerWidth) || nmPerWidth <= 0.01 || nmPerWidth > 5000) return bad("Échelle invalide.");
    await setCalibration(key, nmPerWidth, fullName(a));
    return { ok: true, message: "Échelle enregistrée pour tous les pilotes." };
  });
}

/* ------------------------------------------------------------ points de carte (commandement) */
export async function savePointAction(key: string, pointId: string | null, raw: unknown): Promise<ChartResult> {
  await assertAirCmd();
  return guarded(key, async () => {
    const p = parsePointInput(raw);
    if (!p.ok) return bad(p.error);
    if (pointId === null) return { ok: true, message: "Point ajouté.", id: await createChartPoint(key, p.value) };
    if (!UUID_PATTERN.test(pointId)) return bad("Point invalide.");
    return (await updateChartPoint(pointId, key, p.value)) ? { ok: true, message: "Point modifié.", id: pointId } : bad("Ce point n'existe plus.");
  });
}
export async function deletePointAction(key: string, pointId: string): Promise<ChartResult> {
  await assertAirCmd();
  return guarded(key, async () => (UUID_PATTERN.test(pointId) && (await deleteChartPoint(pointId, key)) ? { ok: true, message: "Point supprimé." } : bad("Ce point n'existe plus.")));
}

/* ------------------------------------------------------------ préparations de vol */
export async function savePlanAction(key: string, planId: string | null, rawTitle: unknown, rawData: unknown): Promise<ChartResult> {
  const a = await assertAir();
  return guarded(key, async () => {
    const title = parsePlanTitle(rawTitle);
    if (!title.ok) return bad(title.error);
    const data = parsePlanData(rawData);
    if (!data.ok) return bad(data.error);
    if (planId === null) {
      const me = await myPilot(a);
      return { ok: true, message: "Préparation enregistrée.", id: await createPlan(key, title.value, data.value, me?.id ?? null, a.ctx.user.id, fullName(a)) };
    }
    if (!UUID_PATTERN.test(planId)) return bad("Préparation invalide.");
    const p = await getPlan(planId);
    if (!p || p.chartKey !== key) return bad("Cette préparation n'existe plus.");
    if (!a.isCmd && p.authorId !== a.ctx.user.id) return bad("Seul l'auteur ou le commandement peut modifier cette préparation.");
    return (await updatePlan(planId, title.value, data.value)) ? { ok: true, message: "Préparation mise à jour.", id: planId } : bad("Cette préparation n'existe plus.");
  });
}
export async function deletePlanAction(key: string, planId: string): Promise<ChartResult> {
  const a = await assertAir();
  return guarded(key, async () => {
    if (!UUID_PATTERN.test(planId)) return bad("Préparation invalide.");
    const p = await getPlan(planId);
    if (!p || p.chartKey !== key) return bad("Cette préparation n'existe plus.");
    if (!a.isCmd && p.authorId !== a.ctx.user.id) return bad("Seul l'auteur ou le commandement peut supprimer cette préparation.");
    return (await deletePlan(planId)) ? { ok: true, message: "Préparation supprimée." } : bad("Cette préparation n'existe plus.");
  });
}

/** Crée un plan de vol (formulaire AOS-FP) prérempli à partir d'un tracé ; le pilote complète ensuite les cases obligatoires. */
export async function planToFlightPlanAction(key: string, planId: string, summary: { dep: string; dest: string; route: string; eet: string; speed: number; title: string }): Promise<ChartResult> {
  const a = await assertAir();
  return guarded(key, async () => {
    if (!UUID_PATTERN.test(planId)) return bad("Préparation invalide.");
    const p = await getPlan(planId);
    if (!p || p.chartKey !== key) return bad("Enregistre d'abord la préparation.");
    const me = await myPilot(a);
    const cut = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "");
    const data: Record<string, string> = {
      ident: cut(me?.callsign ?? "", 12), rules: "V", flightType: "N", dep: cut(summary.dep, 40), dest: cut(summary.dest, 40),
      routeText: cut(summary.route, 500), pic: fullName(a), other: cut(`Préparé sur la carte « ${chartDef(key)?.title} » : ${summary.title}`, 400),
    };
    if (/^\d{2}:\d{2}$/.test(summary.eet)) data.eet = summary.eet;
    if (Number.isFinite(summary.speed) && summary.speed > 0 && summary.speed <= 400) data.speed = String(Math.round(summary.speed));
    for (const k of Object.keys(data)) if (!data[k]) delete data[k];
    const id = await createForm("flightplan", data, me?.id ?? null, a.ctx.user.id, fullName(a));
    revalidatePath("/airops/forms");
    return { ok: true, message: "Plan de vol créé : complète les cases obligatoires.", id };
  });
}
