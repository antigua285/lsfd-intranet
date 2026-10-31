import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isMissingMapTableError, listFeatures, listZones } from "@/lib/map";
import { isPathAllowed } from "@/lib/module-gate";
import type { MapFeature, MapZone } from "@/lib/map-types";
import { MapView } from "../../map/MapView";
import { MissingTableNotice } from "../../map/MissingTableNotice";

export const metadata = { title: "Carte | LSFD MDC" };

export default function MdcMapPage() {
  return (
    <div className="bg-slate-100 text-slate-900 min-h-full p-3 font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const me = await requireUser();
  // Les règles d'accès de la page Carte du site s'appliquent aussi ici.
  if (!(await isPathAllowed(me.id, "/map"))) notFound();
  let features: MapFeature[] = [];
  let zones: MapZone[] = [];
  try {
    [features, zones] = await Promise.all([listFeatures(), listZones()]);
  } catch (error) {
    if (!isMissingMapTableError(error)) throw error;
    return <MissingTableNotice isAdmin={me.isAdmin} />;
  }
  return <MapView initialFeatures={features} initialZones={zones} editing={false} showReportLinks={false} />;
}
