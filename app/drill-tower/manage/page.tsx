import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getAccessContext, isTrainer } from "@/lib/access";
import { isMissingDrillTableError, listCohorts, listEvents } from "@/lib/drill";
import { listUsers } from "@/lib/users";
import { dateToParisLocal } from "@/lib/drill-shared";
import { EventManager, type EventRow } from "./EventManager";
import { CohortManager } from "./CohortManager";

export const metadata = { title: "Gérer la Drill Tower | LSFD Intranet" };

export default function ManagePage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Drill Tower", href: "/drill-tower" }, { label: "Gestion" }]} />
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Gérer la Drill Tower</h1>
      <p className="text-sm text-slate-500 mb-6">Calendrier des formations et promotions de recrues (Training Division).</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  if (!isTrainer(ctx)) notFound();
  let data: Awaited<ReturnType<typeof load>>;
  try {
    data = await load();
  } catch (error) {
    if (!isMissingDrillTableError(error)) throw error;
    return <p className="text-[13px] text-slate-600">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</p>;
  }
  {
    const { events, cohorts, users } = data;
    const rows: EventRow[] = events.map((e) => ({
      id: e.id, title: e.title, description: e.description, startsAt: dateToParisLocal(e.startsAt), endsAt: e.endsAt ? dateToParisLocal(e.endsAt) : "",
      location: e.location, instructor: e.instructor, mandatory: e.mandatory, canceled: e.canceled, cohortId: e.cohortId ?? "",
    }));
    const candidates = users.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }));
    return (
      <div className="flex flex-col gap-10">
        <CohortManager cohorts={cohorts} users={candidates} />
        <EventManager events={rows} cohorts={cohorts.filter((c) => !c.graduatedAt).map((c) => ({ id: c.id, name: c.name }))} />
      </div>
    );
  }
}

async function load() {
  const [events, cohorts, users] = await Promise.all([listEvents({ staff: true }), listCohorts(), listUsers()]);
  return { events, cohorts, users };
}
