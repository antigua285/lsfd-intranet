import Link from "next/link";
import { redirect } from "next/navigation";
import { AIR_FORMS, airForm, isMissingAiropsTableError, listForms, type FormRecord } from "@/lib/airops";
import { getAirAccess } from "@/lib/airops-access";
import { AirShell, MissingTables } from "../AirShell";

export const metadata = { title: "Formulaires de vol | LSFD Intranet" };
type SP = Promise<{ [key: string]: string | string[] | undefined }>;

export default function AirFormsPage({ searchParams }: { searchParams: SP }) {
  return (
    <AirShell crumbs={[{ label: "Accueil", href: "/" }, { label: "Air Operations", href: "/airops" }, { label: "Formulaires de vol" }]} tab="forms"
      title="Formulaires de vol" subtitle="Plans de vol, évaluation du risque, rapports de mission et visites pré-vol.">
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
  const kind = k && airForm(k) ? k : null;
  let forms: FormRecord[] = [];
  try { forms = await listForms(kind); } catch (e) { if (isMissingAiropsTableError(e)) return <MissingTables isAdmin={a.ctx.user.isAdmin} />; throw e; }
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-5">
        {AIR_FORMS.map((f) => (
          <Link key={f.kind} href={`/airops/forms/new?kind=${f.kind}`} data-testid={`new-${f.kind}`} className="block border border-slate-300 border-l-4 border-l-[#c00d0d] bg-white rounded px-3 py-2 hover:bg-slate-50">
            <p className="font-mono text-[11px] text-slate-500">{f.code}</p>
            <p className="text-[14px] font-bold text-slate-800 leading-tight">{f.title}</p>
            <p className="text-[11.5px] text-slate-500 leading-snug mt-0.5">Nouveau →</p>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 mb-3 text-[12.5px]" role="group" aria-label="Filtrer par type">
        <Link href="/airops/forms" className={`px-2.5 py-1 rounded border ${!kind ? "bg-slate-800 text-white border-slate-800" : "bg-white border-slate-300"}`}>Tous</Link>
        {AIR_FORMS.map((f) => <Link key={f.kind} href={`/airops/forms?kind=${f.kind}`} className={`px-2.5 py-1 rounded border ${kind === f.kind ? "bg-slate-800 text-white border-slate-800" : "bg-white border-slate-300"}`}>{f.title}</Link>)}
      </div>
      {forms.length === 0 ? <p className="text-[13px] text-slate-500 border border-dashed border-slate-300 rounded p-5 text-center">Aucun formulaire pour le moment.</p> : (
        <ul className="divide-y divide-slate-200 border border-slate-200 rounded bg-white" data-testid="airform-list">
          {forms.map((f) => (
            <li key={f.id}>
              <Link href={`/airops/forms/${f.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2 hover:bg-slate-50">
                <span className="font-mono text-[11px] text-slate-500 w-20">{airForm(f.kind)?.code}</span>
                <span className="text-[13.5px] font-semibold text-slate-800 flex-1 min-w-48">{f.title}</span>
                <span className="text-[12px] text-slate-500">{f.authorName} · {new Date(f.createdAt).toLocaleDateString("fr-FR")}</span>
                {f.signedBy ? <span className="text-[11px] font-bold text-emerald-700">✔ contresigné</span> : <span className="text-[11px] text-slate-400">à contresigner</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
