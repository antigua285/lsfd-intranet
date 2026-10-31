import { Suspense, type ReactNode } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Crumb } from "@/lib/nav";
import { AirNav } from "./AirNav";

/** Cadre commun des pages Air Operations : fil d'Ariane, titre, onglets, contenu chargé derrière un Suspense. */
export function AirShell({ crumbs, tab, title, subtitle, children }: { crumbs: Crumb[]; tab: "pilots" | "forms" | "maps"; title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Breadcrumb items={crumbs} />
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">{title}</h1>
      <p className="text-sm text-slate-500 mb-4">{subtitle}</p>
      <AirNav current={tab} />
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>{children}</Suspense>
    </div>
  );
}

export function MissingTables({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
      <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
      {isAdmin ? <>Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</> : "Cette section n'est pas encore disponible."}
    </div>
  );
}
