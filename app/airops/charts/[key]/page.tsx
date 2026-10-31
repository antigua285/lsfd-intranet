import { notFound, redirect } from "next/navigation";
import { chartDef } from "@/lib/airops-charts";
import { listChartPoints, listPlans, chartScale } from "@/lib/airops-charts-db";
import { isMissingAiropsTableError } from "@/lib/airops";
import { getAirAccess } from "@/lib/airops-access";
import { AirShell, MissingTables } from "../../AirShell";
import { ChartWorkspace } from "../ChartWorkspace";

export const metadata = { title: "Carte aéronautique | LSFD Intranet" };

export default function ChartPage({ params }: { params: Promise<{ key: string }> }) {
  return (
    <AirShell crumbs={[{ label: "Accueil", href: "/" }, { label: "Air Operations", href: "/airops" }, { label: "Cartes", href: "/airops/charts" }, { label: "Carte" }]} tab="maps"
      title="Carte aéronautique" subtitle="Consulte la carte, prépare ton vol, trace ta route et ton circuit d'atterrissage.">
      <Content params={params} />
    </AirShell>
  );
}

async function Content({ params }: { params: Promise<{ key: string }> }) {
  const a = await getAirAccess();
  if (!a) redirect("/login");
  if (!a.canView) redirect("/");
  const { key } = await params;
  const chart = chartDef(key);
  if (!chart) notFound();
  let points, plans, scale;
  try { [points, plans, scale] = await Promise.all([listChartPoints(key), listPlans(key), chartScale(key)]); }
  catch (e) { if (isMissingAiropsTableError(e)) return <MissingTables isAdmin={a.ctx.user.isAdmin} />; throw e; }
  return <ChartWorkspace chart={chart} points={points} plans={plans} scale={scale} isCmd={a.isCmd} meId={a.ctx.user.id} />;
}
