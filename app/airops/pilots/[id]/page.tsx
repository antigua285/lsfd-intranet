import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { AIR_RANKS, QUALIFICATIONS, airRank, frDate, getPilot, hoursDecimal, isMissingAiropsTableError, listFlights, listRankHistory, sumFlights } from "@/lib/airops";
import { getAirAccess } from "@/lib/airops-access";
import { UUID_PATTERN } from "@/lib/validation";
import { AirShell, MissingTables } from "../../AirShell";
import { Logbook } from "../../Logbook";
import { PilotAdmin } from "../../PilotAdmin";

export const metadata = { title: "Carnet de vol | LSFD Intranet" };

export default function PilotPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AirShell crumbs={[{ label: "Accueil", href: "/" }, { label: "Air Operations", href: "/airops" }, { label: "Carnet de vol" }]} tab="pilots"
      title="Carnet de vol" subtitle="Heures, vols, qualifications et rang interne du pilote.">
      <Content params={params} />
    </AirShell>
  );
}

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="border border-slate-200 rounded bg-white px-3 py-2">
    <p className="text-[10.5px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-[20px] font-bold font-mono text-slate-900 leading-tight">{value}</p>
    {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
  </div>
);

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const a = await getAirAccess();
  if (!a) redirect("/login");
  if (!a.canView) redirect("/");
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  let pilot, flights, history;
  try {
    pilot = await getPilot(id);
    if (!pilot) notFound();
    [flights, history] = await Promise.all([listFlights(id), listRankHistory(id)]);
  } catch (e) { if (isMissingAiropsTableError(e)) return <MissingTables isAdmin={a.ctx.user.isAdmin} />; throw e; }
  const today = new Date().toISOString().slice(0, 10);
  const t = sumFlights(flights, today);
  const r = airRank(pilot.airRank);
  const isMine = pilot.userId === a.ctx.user.id;
  const dayOk = t.landDay90 >= 3, nightOk = t.landNight90 >= 3;
  const medicalExpired = pilot.medicalUntil !== null && pilot.medicalUntil < today;
  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center gap-4 border border-slate-300 rounded bg-white p-4" data-testid="pilot-card">
        <Avatar src={pilot.avatarUrl} firstName={pilot.name.split(" ")[0] ?? ""} lastName={pilot.name.split(" ").slice(1).join(" ")} className="w-16 h-16 text-lg" />
        <div className="flex-1 min-w-56">
          <h2 className="text-[20px] font-extrabold text-slate-900 leading-tight">{pilot.name}{pilot.callsign && <span className="ml-2 text-[14px] font-normal text-slate-500">« {pilot.callsign} »</span>}</h2>
          <p className="text-[12.5px] text-slate-500">{pilot.grade}{pilot.station ? ` | ${pilot.station}` : ""}{pilot.licenseNo ? ` · Licence ${pilot.licenseNo}` : ""}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {pilot.qualifications.map((q) => <span key={q} className="text-[11px] border border-slate-400 rounded-full px-2 py-0.5 text-slate-700">{QUALIFICATIONS.find((x) => x.key === q)?.label ?? q}</span>)}
            {pilot.qualifications.length === 0 && <span className="text-[11.5px] text-slate-400">Aucune qualification enregistrée</span>}
          </div>
        </div>
        <div className="text-center border-2 border-[#0d2644] rounded px-4 py-2" data-testid="pilot-rank">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Rang interne</p>
          <p className="font-mono text-[22px] font-extrabold text-[#0d2644] leading-none">{r.abbr}</p>
          <p className="text-[12px] font-bold text-slate-800">{r.label}</p>
          <p className="text-[10.5px] text-slate-500">Niveau {r.level}/{AIR_RANKS.length}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2" data-testid="pilot-totals">
        <Stat label="Total (h)" value={hoursDecimal(t.total)} sub={`${t.flights} vol${t.flights > 1 ? "s" : ""}`} />
        <Stat label="Commandant (PIC)" value={hoursDecimal(t.pic)} />
        <Stat label="Co-pilote (SIC)" value={hoursDecimal(t.sic)} />
        <Stat label="Nuit" value={hoursDecimal(t.night)} sub={`IFR ${hoursDecimal(t.ifr)} · NVG ${hoursDecimal(t.nvg)}`} />
        <Stat label="Instruction" value={hoursDecimal(t.given + t.received)} sub={`donnée ${hoursDecimal(t.given)} · reçue ${hoursDecimal(t.received)}`} />
        <Stat label="Atterrissages" value={`${t.landDay + t.landNight}`} sub={`dont nuit ${t.landNight} · largages ${t.drops} · treuil. ${t.hoists}`} />
      </section>

      <section className="flex flex-wrap gap-2 text-[12.5px]" aria-label="Récence">
        <span className={`rounded border px-2.5 py-1 font-semibold ${dayOk ? "border-emerald-600 text-emerald-800 bg-emerald-50" : "border-amber-500 text-amber-800 bg-amber-50"}`} data-testid="currency-day">Récence jour (90 j) : {t.landDay90}/3 atterrissages</span>
        <span className={`rounded border px-2.5 py-1 font-semibold ${nightOk ? "border-emerald-600 text-emerald-800 bg-emerald-50" : "border-amber-500 text-amber-800 bg-amber-50"}`} data-testid="currency-night">Récence nuit (90 j) : {t.landNight90}/3 atterrissages</span>
        <span className="rounded border border-slate-300 px-2.5 py-1">30 j : {hoursDecimal(t.last30)} h · 90 j : {hoursDecimal(t.last90)} h</span>
        {pilot.medicalUntil && <span className={`rounded border px-2.5 py-1 font-semibold ${medicalExpired ? "border-red-600 text-red-700 bg-red-50" : "border-slate-300"}`}>Visite médicale : {medicalExpired ? "expirée le " : "valide jusqu'au "}{frDate(pilot.medicalUntil)}</span>}
      </section>

      <Logbook pilotId={pilot.id} flights={flights} canAdd={a.isCmd || isMine} isCmd={a.isCmd} isMine={isMine} />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="border border-slate-200 rounded bg-white p-4">
          <h3 className="text-[13px] font-bold uppercase text-slate-700 mb-2">Historique du rang interne</h3>
          <ol className="space-y-2" data-testid="rank-history">
            {history.map((h) => (
              <li key={h.id} className="border-l-2 border-[#0d2644] pl-3 text-[12.5px]">
                <p className="font-bold text-slate-800">{airRank(h.airRank).label} <span className="font-normal text-slate-500">· {new Date(h.createdAt).toLocaleDateString("fr-FR")} · {h.byName}</span></p>
                {h.note && <p className="text-slate-600">{h.note}</p>}
              </li>
            ))}
            {history.length === 0 && <li className="text-[12.5px] text-slate-500">Aucun mouvement enregistré.</li>}
          </ol>
        </div>
        {a.isCmd ? <PilotAdmin pilot={pilot} /> : pilot.notes ? (
          <div className="border border-slate-200 rounded bg-white p-4"><h3 className="text-[13px] font-bold uppercase text-slate-700 mb-2">Notes du commandement</h3><p className="text-[13px] whitespace-pre-wrap text-slate-700">{pilot.notes}</p></div>
        ) : null}
      </section>
    </div>
  );
}
