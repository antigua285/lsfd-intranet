"use client";

import { useState, useTransition } from "react";
import { LIMITS, type TemplateCategory } from "@/lib/probation-shared";
import { saveTemplateAction } from "../actions";

const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

export function TemplateEditor({ initial }: { initial: TemplateCategory[] }) {
  const [cats, setCats] = useState<TemplateCategory[]>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const patchCat = (i: number, fn: (c: TemplateCategory) => TemplateCategory) => {
    setMsg(null);
    setCats((l) => l.map((c, k) => (k === i ? fn(c) : c)));
  };

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await saveTemplateAction(cats);
      setMsg(r.ok ? { ok: true, text: "Modèle enregistré." } : { ok: false, text: r.error });
    });
  }

  const btn = "text-[12px] border border-slate-300 rounded px-2 py-1 hover:bg-slate-50 disabled:opacity-40";

  return (
    <div className="flex flex-col gap-4">
      {cats.length === 0 && <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucune catégorie pour l&apos;instant.</p>}
      {cats.map((cat, ci) => (
        <section key={cat.id} data-testid="tpl-category" className="border border-slate-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input value={cat.title} maxLength={LIMITS.title} onChange={(e) => patchCat(ci, (c) => ({ ...c, title: e.target.value }))} placeholder="Titre de la catégorie" aria-label="Titre de la catégorie" className="flex-1 min-w-[200px] border border-slate-300 rounded px-3 py-1.5 text-[14px] font-bold" />
            <button type="button" className={btn} disabled={ci === 0} onClick={() => { setMsg(null); setCats((l) => move(l, ci, ci - 1)); }} aria-label="Monter la catégorie">↑</button>
            <button type="button" className={btn} disabled={ci === cats.length - 1} onClick={() => { setMsg(null); setCats((l) => move(l, ci, ci + 1)); }} aria-label="Descendre la catégorie">↓</button>
            <button type="button" className={`${btn} text-red-700`} onClick={() => { if (cat.items.length === 0 || window.confirm(`Supprimer « ${cat.title || "cette catégorie"} » et ses ${cat.items.length} compétences ?`)) { setMsg(null); setCats((l) => l.filter((_, k) => k !== ci)); } }}>Supprimer</button>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {cat.items.map((item, ii) => (
              <li key={item.id} className="flex gap-2 items-center">
                <input value={item.label} maxLength={LIMITS.label} onChange={(e) => patchCat(ci, (c) => ({ ...c, items: c.items.map((x, k) => (k === ii ? { ...x, label: e.target.value } : x)) }))} placeholder="Compétence" aria-label="Compétence" data-testid="tpl-item" className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-[14px]" />
                <button type="button" className={btn} disabled={ii === 0} onClick={() => patchCat(ci, (c) => ({ ...c, items: move(c.items, ii, ii - 1) }))} aria-label="Monter">↑</button>
                <button type="button" className={btn} disabled={ii === cat.items.length - 1} onClick={() => patchCat(ci, (c) => ({ ...c, items: move(c.items, ii, ii + 1) }))} aria-label="Descendre">↓</button>
                <button type="button" className={`${btn} text-red-700`} onClick={() => patchCat(ci, (c) => ({ ...c, items: c.items.filter((_, k) => k !== ii) }))} aria-label="Supprimer la compétence">✕</button>
              </li>
            ))}
          </ul>
          <button type="button" className={`${btn} mt-3`} disabled={cat.items.length >= LIMITS.items} onClick={() => patchCat(ci, (c) => ({ ...c, items: [...c.items, { id: newId(), label: "" }] }))}>+ Compétence</button>
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btn} disabled={cats.length >= LIMITS.categories} data-testid="add-category" onClick={() => { setMsg(null); setCats((l) => [...l, { id: newId(), title: "", items: [] }]); }}>+ Catégorie</button>
        <button type="button" onClick={save} disabled={pending} data-testid="save-template" className="bg-[#0d2644] text-white text-[13px] font-bold rounded px-4 py-1.5 disabled:opacity-50">Enregistrer le modèle</button>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`text-[13px] ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
