import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canSee, getAccessContext } from "@/lib/access";
import { getForm, isMissingFormsTableError } from "@/lib/forms";
import { listFeatures } from "@/lib/map";
import { UUID_PATTERN } from "@/lib/validation";
import { FormFiller, type PointOption } from "../FormFiller";

export const metadata = { title: "Formulaire | LSFD Intranet" };

export default function FillFormPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-3xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <FillContent params={params} />
      </Suspense>
    </div>
  );
}

async function FillContent({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  let form;
  try {
    form = await getForm(id);
  } catch (error) {
    if (isMissingFormsTableError(error)) notFound();
    throw error;
  }
  if (!form || !form.published || !canSee(ctx, form.flags)) notFound();

  // Points de la carte dont le formulaire a besoin (ex. les bornes), triés par nom.
  const kinds = new Set(form.definition.fields.filter((f) => f.type === "feature").map((f) => f.featureKind));
  const pointOptions: Record<string, PointOption[]> = {};
  if (kinds.size > 0) {
    for (const feature of await listFeatures()) {
      if (!kinds.has(feature.kind)) continue;
      const number = feature.code ? ` (${feature.code})` : feature.details.number ? ` (${feature.details.number})` : "";
      (pointOptions[feature.kind] ??= []).push({ id: feature.id, label: `${feature.name}${number}` });
    }
    for (const list of Object.values(pointOptions)) list.sort((a, b) => a.label.localeCompare(b.label, "fr", { numeric: true }));
  }

  return (
    <>
      <Link href="/forms" className="text-[12px] text-slate-500 hover:underline">← Tous les formulaires</Link>
      <header className="mt-2 mb-5 pb-3 border-b-2 border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 uppercase">{form.title}</h1>
        {form.subtitle && <p className="text-[15px] text-slate-700">{form.subtitle}</p>}
        {form.headerLines.map((line, i) => (
          <p key={i} className="text-[13px] text-slate-600">{line}</p>
        ))}
      </header>
      <FormFiller formId={form.id} fields={form.definition.fields} pointOptions={pointOptions} />
      {form.footer && <p className="mt-6 text-[12px] italic text-slate-600 whitespace-pre-wrap">{form.footer}</p>}
    </>
  );
}
