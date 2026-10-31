import Link from "next/link";
import { redirect } from "next/navigation";
import { CHARTS, KIND_LABEL } from "@/lib/airops-charts";
import { getAirAccess } from "@/lib/airops-access";
import { AirShell } from "../AirShell";
import { ChartThumb } from "./ChartThumb";

export const metadata = { title: "Cartes aéronautiques | LSFD Intranet" };

export default function ChartsPage() {
  return (
    <AirShell crumbs={[{ label: "Accueil", href: "/" }, { label: "Air Operations", href: "/airops" }, { label: "Cartes & préparation de vol" }]} tab="maps"
      title="Cartes & préparation de vol" subtitle="Diagrammes d'aérodromes et carte VFR du comté : choisis une carte, puis « Préparer un vol ».">
      <Content />
    </AirShell>
  );
}

async function Content() {
  const a = await getAirAccess();
  if (!a) redirect("/login");
  if (!a.canView) redirect("/");
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="chart-list">
      {CHARTS.map((c) => (
        <li key={c.key}>
          <Link href={`/airops/charts/${c.key}`} data-testid={`chart-${c.key}`} className="block border border-slate-300 rounded bg-white overflow-hidden hover:border-[#0d2644] hover:shadow">
            <div className="h-36 bg-slate-100"><ChartThumb src={c.image} alt={c.title} /></div>
            <div className="p-3">
              <p className="flex items-center gap-2"><span className="font-mono text-[12px] font-bold border border-slate-700 px-1">{c.ident}</span><span className="text-[10.5px] uppercase tracking-wide text-slate-500">{KIND_LABEL[c.kind]}</span></p>
              <p className="text-[14.5px] font-bold text-slate-800 leading-tight mt-1">{c.title}</p>
              <p className="text-[11.5px] text-slate-500">{c.subtitle}</p>
              {c.freqs && <p className="text-[11.5px] font-mono text-slate-600 mt-1">{c.freqs.join(" · ")}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
