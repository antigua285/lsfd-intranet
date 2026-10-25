import { Suspense } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { countForms, isMissingFormsTableError, listForms } from "@/lib/forms";
import type { FormRecord } from "@/lib/forms-types";
import { DeleteFormButton, TemplateButtons } from "./FormsListActions";

export const metadata = { title: "Formulaires | LSFD Intranet" };

export default function AdminFormsPage() {
  return (
    <div className="max-w-5xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <h1 className="text-xl font-bold text-slate-800 uppercase">Administration</h1>
      <p className="text-sm text-slate-500 mb-4">Création et gestion des formulaires. Réservé aux modérateurs.</p>
      <AdminNav current="/admin/forms" />
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireAdmin();
  let forms: FormRecord[] = [];
  let counts: Awaited<ReturnType<typeof countForms>> = [];
  try {
    [forms, counts] = await Promise.all([listForms(), countForms()]);
  } catch (error) {
    if (!isMissingFormsTableError(error)) throw error;
    return (
      <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
        <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
        Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC (une seule fois), puis recharge cette page.
      </div>
    );
  }
  const byForm = new Map(counts.map((c) => [c.formId, c]));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/forms/new" className="bg-[#0d2644] text-white text-[12px] font-bold uppercase tracking-wide rounded px-4 py-2 hover:bg-[#143a66]">Nouveau formulaire vierge</Link>
        <TemplateButtons />
      </div>
      {forms.length === 0 ? (
        <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucun formulaire. Crée-en un ou pars d&apos;un modèle.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded">
          {forms.map((form) => {
            const c = byForm.get(form.id);
            return (
              <li key={form.id} className="flex items-center gap-4 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-800 uppercase truncate">{form.title}</p>
                  <p className="text-[12px] text-slate-500">
                    {form.definition.fields.length} champs · {form.published ? "Publié" : "Brouillon"} · {c?.submissions ?? 0} rapport(s){c?.unread ? `, ${c.unread} nouveau(x)` : ""}
                  </p>
                </div>
                <Link href={`/admin/reports?form=${form.id}`} className="text-[12px] text-[#0d2644] hover:underline">Rapports</Link>
                <Link href={`/admin/forms/${form.id}`} className="text-[12px] text-[#0d2644] font-bold hover:underline">Modifier</Link>
                <DeleteFormButton id={form.id} title={form.title} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
