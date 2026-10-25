import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { isMissingFormsTableError, listForms, listSubmissionsBy } from "@/lib/forms";
import type { FormRecord, SubmissionSummary } from "@/lib/forms-types";

export const metadata = { title: "Rapports | LSFD Intranet" };

export default function FormsPage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <FormsContent />
      </Suspense>
    </div>
  );
}

async function FormsContent() {
  const me = await requireUser();

  let forms: FormRecord[] = [];
  let mine: SubmissionSummary[] = [];
  let missing = false;
  try {
    [forms, mine] = await Promise.all([listForms({ onlyPublished: true }), listSubmissionsBy(me.id)]);
  } catch (error) {
    if (!isMissingFormsTableError(error)) throw error;
    missing = true;
  }

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 uppercase">Rapports &amp; formulaires</h1>
          <p className="text-sm text-slate-500">Choisis un formulaire à remplir. Il est transmis aux modérateurs à l&apos;envoi.</p>
        </div>
        {me.isAdmin && !missing && (
          <Link href="/admin/forms" className="shrink-0 bg-[#0d2644] text-white text-[13px] font-bold uppercase tracking-wide rounded px-4 py-2 hover:bg-[#143a66] transition-colors">
            Gérer les formulaires
          </Link>
        )}
      </div>

      {missing ? (
        <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
          <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
          {me.isAdmin ? (
            <>Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC (une seule fois), puis recharge cette page.</>
          ) : (
            "Cette page n'est pas encore disponible. Un modérateur doit finir l'installation."
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <section>
            <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600 mb-2">Formulaires disponibles</h2>
            {forms.length === 0 ? (
              <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucun formulaire n&apos;est publié pour le moment.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {forms.map((form) => (
                  <li key={form.id}>
                    <Link href={`/forms/${form.id}`} className="block border border-slate-200 rounded p-3 hover:border-[#0d2644] hover:bg-slate-50 transition-colors">
                      <p className="text-[14px] font-bold text-slate-800 uppercase">{form.title}</p>
                      {form.subtitle && <p className="text-[13px] text-slate-500">{form.subtitle}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600 mb-2">Mes derniers envois</h2>
            {mine.length === 0 ? (
              <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Rien d&apos;envoyé pour l&apos;instant.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {mine.map((s) => (
                  <li key={s.id}>
                    <Link href={`/reports/${s.id}`} className="block border border-slate-200 rounded px-3 py-2 hover:bg-slate-50">
                      <p className="text-[13px] font-bold text-slate-800 truncate">{s.formTitle}</p>
                      <p className="text-[12px] text-slate-500">{new Date(s.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
