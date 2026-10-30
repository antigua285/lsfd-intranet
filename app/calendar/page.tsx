import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getAccessContext, isTrainer } from "@/lib/access";
import { isMissingCalendarTableError, listCalendarEvents } from "@/lib/calendar";
import { CALENDAR_FLAG, addDays, monthGrid, monthParam, parseMonth, shiftMonth, todayKey, type CalEvent } from "@/lib/calendar-shared";
import { DRILL_FLAG } from "@/lib/drill-shared";
import { CalendarView } from "./CalendarView";

export const metadata = { title: "Calendrier | LSFD Intranet" };

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

export default function CalendarPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="max-w-6xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Calendrier" }]} />
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Calendrier</h1>
      <p className="text-sm text-slate-500 mb-5">Calendrier des événements du département.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: SP }) {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  const sp = await searchParams;
  const m = Array.isArray(sp.m) ? sp.m[0] : sp.m;
  const { year, month } = parseMonth(m);
  const weeks = monthGrid(year, month);
  const canEdit = ctx.user.isAdmin || ctx.flags.includes(CALENDAR_FLAG);
  // Les formations de l'académie ne s'affichent que pour ceux qui les suivent : TD, officiers, admins.
  const withAcademy = canEdit || isTrainer(ctx);
  let events: CalEvent[] = [];
  let missing = false;
  try {
    events = await listCalendarEvents(weeks[0][0].key, weeks[weeks.length - 1][6].key, withAcademy);
  } catch (error) {
    if (!isMissingCalendarTableError(error)) throw error;
    missing = true;
  }
  if (missing) {
    return (
      <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
        <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
        {ctx.user.isAdmin ? <>Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</> : "Cette page n'est pas encore disponible."}
      </div>
    );
  }
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const today = todayKey();
  return (
    <CalendarView
      year={year} month={month} weeks={weeks} events={events} today={today} canEdit={canEdit} showAcademy={withAcademy && !ctx.flags.includes(DRILL_FLAG)}
      prevHref={`/calendar?m=${monthParam(prev.year, prev.month)}`} nextHref={`/calendar?m=${monthParam(next.year, next.month)}`}
      todayHref={`/calendar?m=${today.slice(0, 7)}`} defaultDate={addDays(today, 0)}
    />
  );
}
