import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { airRank, frDate, hoursDecimal, isMissingAiropsTableError, listPilotSummaries, listPilots, listUsersWithoutLogbook, type PilotRow } from "@/lib/airops";
import { getAirAccess } from "@/lib/airops-access";
import { AirShell, MissingTables } from "./AirShell";
import { CreateLogbook } from "./CreateLogbook";

export const metadata = { title: "Air Operations | LSFD Intranet" };

export default function AirOpsPage() {
  return (
    <AirShell crumbs={[{ label: "Accueil", href: "/" }, { label: "Air Operations Section" }]} tab="pilots"
      title="Air Operations Section" subtitle="Carnets de vol des pilotes, rangs internes et formulaires de vol.">
      <Content />
    </AirShell>
  );
}

async function Content() {
  const a = await getAirAccess();
  if (!a) redirect("/login");
  if (!a.canView) redirect("/");
  let pilots: PilotRow[] = [];
  let sums = new Map<string, { total: number; flights: number; last: string | null }>();
  let candidates: { id: string; name: string; grade: string }[] = [];
  try {
    [pilots, sums] = await Promise.all([listPilots(), listPilotSummaries()]);
    if (a.isCmd) candidates = await listUsersWithoutLogbook();
  } catch (e) { if (isMissingAiropsTableError(e)) return <MissingTables isAdmin={a.ctx.user.isAdmin} />; throw e; }
  const mine = pilots.find((p) => p.userId === a.ctx.user.id);
  const sorted = [...pilots].sort((x, y) => airRank(y.airRank).level - airRank(x.airRank).level || x.name.localeCompare(y.name, "fr"));
  return (
    <div>
      {mine && (
        <Link href={`/airops/pilots/${mine.id}`} data-testid="my-logbook" className="flex items-center justify-between gap-3 border border-[#0d2644] bg-[#0d2644] text-white rounded px-4 py-3 mb-4 hover:bg-[#143a63]">
          <span><span className="block text-[11px] uppercase tracking-widest text-white/70">Mon carnet de vol</span><span className="text-[15px] font-bold">{mine.name}{mine.callsign ? ` · « ${mine.callsign} »` : ""}</span></span>
          <span className="text-[13px] font-bold">Ouvrir →</span>
        </Link>
      )}
      {a.isCmd && <CreateLogbook candidates={candidates} />}
      {sorted.length === 0 ? (
        <p className="text-[13px] text-slate-500 border border-dashed border-slate-300 rounded p-6 text-center">Aucun carnet de vol n&apos;est ouvert.{a.isCmd ? " Ouvre le premier ci-dessus." : ""}</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded bg-white">
          <table className="w-full text-[13px]" data-testid="pilot-table">
            <thead className="bg-slate-800 text-white text-[11px] uppercase tracking-wide">
              <tr><th className="text-left px-3 py-2">Pilote</th><th className="text-left px-3 py-2">Rang interne</th><th className="text-right px-3 py-2">Heures</th><th className="text-right px-3 py-2">Vols</th><th className="text-left px-3 py-2">Dernier vol</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sorted.map((p) => {
                const s = sums.get(p.id);
                const r = airRank(p.airRank);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link href={`/airops/pilots/${p.id}`} data-testid="pilot-link" className="flex items-center gap-2.5 font-semibold text-slate-800 hover:underline">
                        <Avatar src={p.avatarUrl} firstName={p.name.split(" ")[0] ?? ""} lastName={p.name.split(" ").slice(1).join(" ")} className="w-7 h-7 text-[10px]" />
                        <span>{p.name}{p.callsign && <span className="ml-1.5 text-[11.5px] font-normal text-slate-500">« {p.callsign} »</span>}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2"><span className="inline-flex items-center gap-1.5"><span className="font-mono text-[11px] font-bold border border-slate-700 px-1">{r.abbr}</span>{r.label}</span></td>
                    <td className="px-3 py-2 text-right font-mono">{hoursDecimal(s?.total ?? 0)}</td>
                    <td className="px-3 py-2 text-right font-mono">{s?.flights ?? 0}</td>
                    <td className="px-3 py-2 text-slate-600">{s?.last ? frDate(s.last) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
