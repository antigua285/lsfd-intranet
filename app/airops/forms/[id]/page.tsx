import { notFound, redirect } from "next/navigation";
import { airForm, getForm, isMissingAiropsTableError } from "@/lib/airops";
import { getAirAccess } from "@/lib/airops-access";
import { UUID_PATTERN } from "@/lib/validation";
import { AirShell, MissingTables } from "../../AirShell";
import { AirFormEditor } from "../../AirFormEditor";

export const metadata = { title: "Formulaire de vol | LSFD Intranet" };

export default function AirFormPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AirShell crumbs={[{ label: "Accueil", href: "/" }, { label: "Air Operations", href: "/airops" }, { label: "Formulaires de vol", href: "/airops/forms" }, { label: "Formulaire" }]} tab="forms"
      title="Formulaire de vol" subtitle="Consultation et modification.">
      <Content params={params} />
    </AirShell>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const a = await getAirAccess();
  if (!a) redirect("/login");
  if (!a.canView) redirect("/");
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  let rec;
  try { rec = await getForm(id); } catch (e) { if (isMissingAiropsTableError(e)) return <MissingTables isAdmin={a.ctx.user.isAdmin} />; throw e; }
  const def = rec ? airForm(rec.kind) : undefined;
  if (!rec || !def) notFound();
  const canEdit = a.isCmd || (rec.authorId === a.ctx.user.id && !rec.signedAt);
  return <AirFormEditor def={def} formId={rec.id} initial={rec.data} canEdit={canEdit} isCmd={a.isCmd} signedBy={rec.signedBy} signedAt={rec.signedAt} authorName={rec.authorName} createdAt={rec.createdAt} />;
}
