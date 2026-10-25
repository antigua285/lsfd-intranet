"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFromTemplateAction, deleteFormAction } from "./actions";

const BTN = "border border-slate-300 text-slate-700 text-[12px] font-bold uppercase tracking-wide rounded px-3 py-1.5 hover:bg-slate-100 disabled:opacity-50";

export function TemplateButtons() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function create(key: "test" | "hydrant") {
    setBusy(true);
    setError(null);
    const result = await createFromTemplateAction(key);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.push(`/admin/forms/${result.id}`);
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} className={BTN} onClick={() => create("test")}>Modèle : formulaire de test</button>
      <button type="button" disabled={busy} className={BTN} onClick={() => create("hydrant")}>Modèle : inspection de borne incendie</button>
      {error && <span role="alert" className="text-[12px] text-red-700">{error}</span>}
    </div>
  );
}

export function DeleteFormButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm(`Supprimer « ${title} » ? Les rapports déjà reçus sont conservés.`)) return;
    setBusy(true);
    await deleteFormAction(id);
    setBusy(false);
    router.refresh();
  }
  return <button type="button" disabled={busy} onClick={remove} className="text-[12px] text-red-700 hover:underline disabled:opacity-50">Supprimer</button>;
}
