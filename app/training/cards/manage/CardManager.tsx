"use client";

import { useMemo, useState } from "react";
import type { Flashcard } from "@/lib/flashcards-types";
import { CardEditor } from "../CardEditor";

type Props = { initialCards: Flashcard[]; allFlags?: { code: string; name: string }[] };

/** Applique le résultat d'un enregistrement : la carte, plus les accès copiés aux autres cartes du thème. */
export function mergeSaved(all: Flashcard[], c: Flashcard, affected: string[] = []): Flashcard[] {
  return all.map((x) => (x.id === c.id ? c : affected.includes(x.id) ? { ...x, flags: c.flags, manageFlags: c.manageFlags } : x));
}

export function CardManager({ initialCards, allFlags = [] }: Props) {
  const [cards, setCards] = useState(initialCards);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [search, setSearch] = useState("");
  const topics = useMemo(() => [...new Set(cards.map((c) => c.topic).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")), [cards]);
  const needle = search.trim().toLowerCase();
  const shown = cards.filter((c) => !needle || `${c.question} ${c.answer} ${c.topic}`.toLowerCase().includes(needle));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setEditing(editing === "new" ? null : "new")} className="bg-[#0d2644] text-white text-[12px] font-bold uppercase tracking-wide rounded px-4 py-2">+ Nouvelle carte</button>
        <input aria-label="Rechercher une carte" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-[13px]" />
        <span className="text-[12px] text-slate-500">{cards.length} carte(s)</span>
      </div>
      {editing === "new" && (
        <CardEditor card={null} topics={topics} allFlags={allFlags} onSaved={(c, affected) => setCards((all) => [...mergeSaved(all, c, affected), c])} onCancel={() => setEditing(null)} />
      )}
      {shown.length === 0 ? (
        <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Aucune carte.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((card) => (
            <li key={card.id} data-testid="manage-card" className="border border-slate-200 rounded-lg p-3">
              {editing === card.id ? (
                <CardEditor card={card} topics={topics} allFlags={allFlags}
                  onSaved={(c, affected) => { setCards((all) => mergeSaved(all, c, affected)); setEditing(null); }}
                  onDeleted={(id) => { setCards((all) => all.filter((x) => x.id !== id)); setEditing(null); }}
                  onCancel={() => setEditing(null)} />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {card.topic && <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{card.topic}</p>}
                    {(card.flags.length > 0 || card.manageFlags.length > 0) && (
                      <p data-testid="card-access" className="text-[11px] text-slate-500">
                        {card.flags.length > 0 && <>Visible par : {card.flags.join(", ")}. </>}
                        {card.manageFlags.length > 0 && <>Gérée par : {card.manageFlags.join(", ")}.</>}
                      </p>
                    )}
                    <p className="text-[14px] font-bold text-slate-800 whitespace-pre-wrap">{card.question}</p>
                    <p className="text-[13px] text-slate-600 whitespace-pre-wrap mt-1">{card.answer}</p>
                  </div>
                  <button type="button" onClick={() => setEditing(card.id)} className="text-[12px] font-bold text-[#0d2644] hover:underline shrink-0">Modifier</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
