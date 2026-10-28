import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LinkButton } from "@/components/LinkButton";
import { getAccessContext, isTrainer } from "@/lib/access";
import { getMemberCohort, isMissingDrillTableError, listEvents, listTrainers } from "@/lib/drill";
import { DRILL_FLAG, dayKey, fmtDay, fmtRange, type DrillEvent } from "@/lib/drill-shared";
import type { PublicUser } from "@/lib/users";

export const metadata = { title: "Drill Tower | LSFD Intranet" };

export default function DrillTowerPage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Drill Tower" }]} />
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Drill Tower</h1>
      <p className="text-sm text-slate-500 mb-6">Académie : calendrier des formations, contacts de la Training Division et cartes de révision.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  const staff = isTrainer(ctx);
  if (!staff && !ctx.flags.includes(DRILL_FLAG)) notFound();

  let events: DrillEvent[] = [];
  let trainers: PublicUser[] = [];
  let cohort: Awaited<ReturnType<typeof getMemberCohort>> = null;
  try {
    [events, trainers] = await Promise.all([listEvents(staff ? { staff: true } : { staff: false, userId: ctx.user.id }), listTrainers()]);
    if (!staff) cohort = await getMemberCohort(ctx.user.id);
  } catch (error) {
    if (!isMissingDrillTableError(error)) throw error;
    return (
      <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
        <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
        {ctx.user.isAdmin ? <>Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</> : "Cette page n'est pas encore disponible."}
      </div>
    );
  }

  const now = serverNow();
  const endOf = (e: DrillEvent) => new Date(e.endsAt ?? new Date(new Date(e.startsAt).getTime() + 2 * 3600_000)).getTime();
  const upcoming = events.filter((e) => endOf(e) >= now);
  const past = events.filter((e) => endOf(e) < now).reverse().slice(0, 10);
  const next = upcoming.find((e) => !e.canceled);
  const days = [...new Set(upcoming.map((e) => dayKey(e.startsAt)))];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/drill-tower/cards" variant="primary" testId="btn-drill-cards">Cartes de révision</LinkButton>
        {staff && <LinkButton href="/drill-tower/manage" testId="btn-drill-manage">Gérer la Drill Tower</LinkButton>}
      </div>

      {cohort && (
        <p data-testid="my-cohort" className="text-[13px] text-slate-700 border border-slate-200 rounded-lg px-4 py-2.5">
          Ta promotion : <strong>{cohort.name}</strong>{cohort.startsOn ? ` · début le ${new Date(`${cohort.startsOn}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long" })}` : ""} · {cohort.members} recrue(s)
        </p>
      )}

      <section aria-label="Prochaine formation">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-600 mb-2">Prochaine formation</h2>
        {next ? (
          <div data-testid="next-event" className="border-2 border-[#0d2644] rounded-lg p-4 bg-slate-50">
            <p className="text-[12px] font-bold uppercase text-[#0d2644]">{fmtDay(next.startsAt)} · {fmtRange(next)}</p>
            <p className="text-[17px] font-bold text-slate-900 mt-0.5">{next.title}</p>
            <EventMeta e={next} staff={staff} />
            {next.description && <p className="text-[13px] text-slate-700 mt-2 whitespace-pre-wrap">{next.description}</p>}
          </div>
        ) : (
          <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucune formation n&apos;est programmée pour le moment.</p>
        )}
      </section>

      <section aria-label="Calendrier">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-600 mb-2">Calendrier des formations à venir</h2>
        {upcoming.length === 0 ? (
          <p className="text-[13px] text-slate-500">Rien de prévu.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {days.map((d) => (
              <div key={d}>
                <p className="text-[12px] font-bold uppercase text-slate-500 mb-1.5">{fmtDay(upcoming.find((e) => dayKey(e.startsAt) === d)!.startsAt)}</p>
                <ul className="flex flex-col gap-2">
                  {upcoming.filter((e) => dayKey(e.startsAt) === d).map((e) => <EventRow key={e.id} e={e} staff={staff} />)}
                </ul>
              </div>
            ))}
          </div>
        )}
        {past.length > 0 && (
          <details className="mt-4">
            <summary className="text-[12px] font-bold text-slate-600 cursor-pointer">Formations passées ({past.length})</summary>
            <ul className="flex flex-col gap-2 mt-2 opacity-80">{past.map((e) => <EventRow key={e.id} e={e} staff={staff} dateLabel />)}</ul>
          </details>
        )}
      </section>

      <section aria-label="Training Division">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-600 mb-2">Contacter la Training Division</h2>
        {trainers.length === 0 ? (
          <p className="text-[13px] text-slate-500">Aucun membre de la Training Division n&apos;est encore renseigné.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" data-testid="trainer-list">
            {trainers.map((t) => (
              <li key={t.id} data-testid="trainer-card" className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 bg-white">
                <Avatar src={t.avatarUrl} firstName={t.firstName} lastName={t.lastName} className="w-14 h-14 text-lg" />
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-slate-900 truncate">{t.firstName} {t.lastName}</p>
                  <p className="text-[12px] text-slate-600">{t.grade} · {t.station}</p>
                  <p className="text-[13px] text-slate-900 font-bold">{t.phone ? <>Tél. {t.phone}</> : <span className="font-normal text-slate-400">Téléphone non renseigné</span>}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EventMeta({ e, staff }: { e: DrillEvent; staff: boolean }) {
  return (
    <p className="text-[12px] text-slate-600 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
      {e.location && <span>Lieu : <strong>{e.location}</strong></span>}
      {e.instructor && <span>Instructeur : <strong>{e.instructor}</strong></span>}
      {e.mandatory && <span className="font-bold text-red-700">Obligatoire</span>}
      {e.canceled && <span className="font-bold text-red-700">Annulée</span>}
      {staff && <span>{e.cohortName ? `Promotion : ${e.cohortName}` : "Toutes les promotions"}</span>}
    </p>
  );
}

function EventRow({ e, staff, dateLabel = false }: { e: DrillEvent; staff: boolean; dateLabel?: boolean }) {
  return (
    <li data-testid="event-row" className={`border border-slate-200 rounded-lg p-3 flex gap-3 ${e.canceled ? "bg-slate-50" : "bg-white"}`}>
      <div className="w-28 shrink-0 text-[12px] font-bold text-[#0d2644]">{dateLabel ? <>{fmtDay(e.startsAt)}<br /></> : null}{fmtRange(e)}</div>
      <div className="min-w-0 flex-1">
        <p className={`text-[14px] font-bold text-slate-900 ${e.canceled ? "line-through" : ""}`}>{e.title}</p>
        <EventMeta e={e} staff={staff} />
        {e.description && <p className="text-[12px] text-slate-600 mt-1 whitespace-pre-wrap">{e.description}</p>}
      </div>
    </li>
  );
}

/** Horloge serveur isolée (la page est rendue à la demande, dans Suspense). */
function serverNow(): number {
  return new Date().getTime();
}
