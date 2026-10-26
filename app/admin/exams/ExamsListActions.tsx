"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteExamAction } from "./actions";

export function DeleteExamButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm(`Supprimer l'examen « ${title} » ? Les passages déjà effectués sont conservés.`)) return;
    setBusy(true);
    await deleteExamAction(id);
    setBusy(false);
    router.refresh();
  }
  return <button type="button" disabled={busy} onClick={remove} className="text-[12px] text-red-700 hover:underline disabled:opacity-50">Supprimer</button>;
}
