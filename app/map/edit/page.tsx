import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { isMissingMapTableError, listFeatures, listZones } from "@/lib/map";
import type { MapFeature, MapZone } from "@/lib/map-types";
import { MapView } from "../MapView";
import { MissingTableNotice } from "../MissingTableNotice";

export const metadata = { title: "Modifier la carte | LSFD Intranet" };

export default function EditMapPage() {
  return (
    <div className="max-w-[1500px] mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 uppercase">Modifier la carte</h1>
          <p className="text-sm text-slate-500">
            Réservé aux modérateurs. Chaque modification est enregistrée immédiatement.
          </p>
        </div>
        <Link
          href="/map"
          className="shrink-0 border border-slate-300 text-slate-700 text-[13px] font-bold uppercase tracking-wide rounded px-4 py-2 hover:bg-slate-100 transition-colors"
        >
          Retour à la carte
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <EditContent />
      </Suspense>
    </div>
  );
}

async function EditContent() {
  await requireAdmin();

  let features: MapFeature[] = [];
  let zones: MapZone[] = [];
  try {
    [features, zones] = await Promise.all([listFeatures(), listZones()]);
  } catch (error) {
    if (!isMissingMapTableError(error)) throw error;
    return <MissingTableNotice isAdmin />;
  }

  return <MapView initialFeatures={features} initialZones={zones} editing />;
}
