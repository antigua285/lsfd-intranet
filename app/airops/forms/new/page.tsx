import { redirect } from "next/navigation";
import { airForm } from "@/lib/airops-shared";
import { getAirAccess, myPilot } from "@/lib/airops-access";
import { AirShell } from "../../AirShell";
import { AirFormEditor } from "../../AirFormEditor";

export const metadata = { title: "Nouveau formulaire de vol | LSFD Intranet" };
type SP = Promise<{ [key: string]: string | string[] | undefined }>;

export default function NewAirFormPage({ searchParams }: { searchParams: SP }) {
  return (
    <AirShell crumbs={[{ label: "Accueil", href: "/" }, { label: "Air Operations", href: "/airops" }, { label: "Formulaires de vol", href: "/airops/forms" }, { label: "Nouveau" }]} tab="forms"
      title="Nouveau formulaire" subtitle="Remplis les cases puis enregistre : le formulaire apparaît dans la liste de la section.">
      <Content searchParams={searchParams} />
    </AirShell>
  );
}

async function Content({ searchParams }: { searchParams: SP }) {
  const a = await getAirAccess();
  if (!a) redirect("/login");
  if (!a.canView) redirect("/");
  const sp = await searchParams;
  const k = Array.isArray(sp.kind) ? sp.kind[0] : sp.kind;
  const def = k ? airForm(k) : undefined;
  if (!def) redirect("/airops/forms");
  const me = await myPilot(a);
  const name = me?.name ?? `${a.ctx.user.firstName} ${a.ctx.user.lastName}`;
  // Préremplissage : le pilote et la date du jour.
  const today = new Date().toISOString().slice(0, 10);
  const initial: Record<string, string> = {};
  for (const s of def.sections) for (const f of s.fields) {
    if (f.id === "pic") initial.pic = name;
    if (f.id === "date" && f.type === "date") initial.date = today;
    if (f.id === "ident" && me?.callsign) initial.ident = me.callsign;
  }
  return <AirFormEditor def={def} formId={null} initial={initial} canEdit isCmd={a.isCmd} signedBy={null} signedAt={null} authorName={null} createdAt={null} />;
}
