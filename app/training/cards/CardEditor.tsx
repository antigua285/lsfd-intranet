"use client";

import { useState } from "react";
import { CARD_LIMITS, type Flashcard } from "@/lib/flashcards";
import { deleteCardAction, saveCardAction } from "./actions";

const INPUT = "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#0d2644]";

/** Formulaire d'une carte (création ou modification) : utilisé sur la page de révision et dans la gestion. */
export function CardEditor({
  card,
  topics,
  onSaved,
  onDeleted,
  onCancel,
}: {
  card: Flashcard | null;
  topics: string[];
  onSaved: (card: Flashcard) => void;
  onDeleted?: (id: string) => void;
  onCancel?: () => void;
}) {
  const [question, setQuestion] = useState(card?.question ?? "");
  const [answer, setAnswer] = useState(card?.answer ?? "");
  const [topic, setTopic] = useState(card?.topic ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await saveCardAction(card?.id ?? null, { question, answer, topic });
      if (!result.ok) return setError(result.error);
      if (result.card) onSaved(result.card);
      if (!card) { setQuestion(""); setAnswer(""); }
    } catch {
      setError("L'enregistrement a échoué (session expirée ?).");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!card || !window.confirm("Supprimer cette carte ?")) return;
    setBusy(true);
    try {
      const result = await deleteCardAction(card.id);
      if (!result.ok) return setError(result.error);
      onDeleted?.(card.id);
    } catch {
      setError("La suppression a échoué.");
    } finally {
      setBusy(false);
    }
  }

  const listId = `topics-${card?.id ?? "new"}`;
  return (
    <form onSubmit={save} className="flex flex-col gap-2 border border-slate-200 rounded-lg p-3 bg-slate-50" aria-label={card ? "Modifier la carte" : "Nouvelle carte"}>
      <label className="text-[12px] text-slate-600">Question
        <textarea className={INPUT} rows={2} maxLength={CARD_LIMITS.question} value={question} onChange={(e) => setQuestion(e.target.value)} />
      </label>
      <label className="text-[12px] text-slate-600">Réponse
        <textarea className={INPUT} rows={3} maxLength={CARD_LIMITS.answer} value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </label>
      <label className="text-[12px] text-slate-600">Thème (facultatif)
        <input className={INPUT} list={listId} maxLength={CARD_LIMITS.topic} value={topic} onChange={(e) => setTopic(e.target.value)} />
        <datalist id={listId}>{topics.map((t) => <option key={t} value={t} />)}</datalist>
      </label>
      {error && <p role="alert" className="text-[12px] text-red-700">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className="bg-[#0d2644] text-white text-[12px] font-bold uppercase tracking-wide rounded px-4 py-1.5 disabled:opacity-50">
          {card ? "Enregistrer" : "Ajouter la carte"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="text-[12px] text-slate-600 hover:underline">Fermer</button>}
        <span className="flex-1" />
        {card && onDeleted && <button type="button" disabled={busy} onClick={remove} className="text-[12px] text-red-700 hover:underline">Supprimer</button>}
      </div>
    </form>
  );
}
