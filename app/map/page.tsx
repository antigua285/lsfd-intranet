import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { isMissingMapTableError, listFeatures, listZones } from "@/lib/map";
import type { MapFeature, MapZone } from "@/lib/map-types";
import { MapView } from "./MapView";
import { MissingTableNotice } from "./MissingTableNotice";

export const metadata = { title: "Carte | LSFD Intranet" };

export default function MapPage() {
  return (
    <div className="max-w-[1500px] mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <MapContent />
      </Suspense>
    </div>
  );
}

async function MapContent() {
  const me = await requireUser();

  let features: MapFeature[] = [];
  let zones: MapZone[] = [];
  let missingTable = false;
  try {
    [features, zones] = await Promise.all([listFeatures(), listZones()]);
  } catch (error) {
    if (!isMissingMapTableError(error)) throw error;
    missingTable = true;
  }

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 uppercase">Carte du département</h1>
          <p className="text-sm text-slate-500">
            Stations, bornes incendie, bâtiments à risque, météo et secteurs. Les filtres à droite
            permettent d&apos;afficher ou de masquer chaque élément.
          </p>
        </div>
        {me.isAdmin && !missingTable && (
          <Link
            href="/map/edit"
            className="shrink-0 bg-[#0d2644] text-white text-[13px] font-bold uppercase tracking-wide rounded px-4 py-2 hover:bg-[#143a66] transition-colors"
          >
            Edit map
          </Link>
        )}
      </div>

      {missingTable ? (
        <MissingTableNotice isAdmin={me.isAdmin} />
      ) : (
        <MapView initialFeatures={features} initialZones={zones} editing={false} showReportLinks={me.isAdmin} />
      )}
    </>
  );
}
