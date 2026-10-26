import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { isMissingAccessTableError, listFlags, type Flag } from "@/lib/access";
import { requireAdmin } from "@/lib/auth";
import { getForm, isMissingFormsTableError } from "@/lib/forms";
import type { FormRecord } from "@/lib/forms-types";
import { UUID_PATTERN } from "@/lib/validation";
import { FormBuilder } from "../FormBuilder";

export const metadata = { title: "Créateur de formulaire | LSFD Intranet" };

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-6xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <EditContent params={params} />
      </Suspense>
    </div>
  );
}

async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  let form: FormRecord | null = null;
  if (id !== "new") {
    if (!UUID_PATTERN.test(id)) notFound();
    try {
      form = await getForm(id);
    } catch (error) {
      if (!isMissingFormsTableError(error)) throw error;
    }
    if (!form) notFound();
  }
  let allFlags: Flag[] = [];
  try {
    allFlags = await listFlags();
  } catch (error) {
    if (!isMissingAccessTableError(error)) throw error;
  }
  const initial = form ?? {
    title: "NEW FORM", subtitle: "", headerLines: [], footer: "", published: false, flags: [],
    definition: { fields: [], actions: [] },
  };
  return (
    <>
      <h1 className="text-xl font-bold text-slate-800 uppercase">Administration</h1>
      <p className="text-sm text-slate-500 mb-4">Créateur de formulaire.</p>
      <AdminNav current="/admin/forms" />
      <Link href="/admin/forms" className="text-[12px] text-slate-500 hover:underline">← Tous les formulaires</Link>
      <div className="mt-3">
        <FormBuilder key={form?.id ?? "new"} formId={form?.id ?? null} initial={initial} allFlags={allFlags.map((f) => ({ code: f.code, name: f.name }))} />
      </div>
    </>
  );
}
