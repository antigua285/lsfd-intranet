"use client";

import { useState } from "react";
import { CARD_LIMITS, type Flashcard } from "@/lib/flashcards-types";
import { deleteCardAction, saveCardAction } from "./actions";

const INPUT = "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#0d2644]";

/** Formulaire d'une carte (création ou modification) : utilisé sur la page de révision et dans la gestion. */
export function CardEditor({
  card,
  topics,
  allFlags = [],
  onSaved,
  onDeleted,
  onCancel,
}: {
  card: Flashcard | null;
  topics: string[];
  allFlags?: { code: string; name: string }[];
  /** `affected` : autres cartes du thème dont les accès ont été mis à jour en même temps. */
  onSaved: (card: Flashcard, affected?: string[]) => void;
  onDeleted?: (id: string) => void;
  onCancel?: () => void;
}) {
  const [question, setQuestion] = useState(card?.question ?? "");
  const [answer, setAnswer] = useState(card?.answer ?? "");
  const [topic, setTopic] = useState(card?.topic ?? "");
  const [flags, setFlags] = useState<string[]>(card?.flags ?? []);
  const [manageFlags, setManageFlags] = useState<string[]>(card?.manageFlags ?? []);
  const [applyToTopic, setApplyToTopic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await saveCardAction(card?.id ?? null, { question, answer, topic, flags, manageFlags, applyToTopic });
      if (!result.ok) return setError(result.error);
      if (result.card) onSaved(result.card, result.affected);
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
      {allFlags.length > 0 && (
        <div className="flex flex-col gap-2 border border-slate-200 bg-white rounded p-2" data-testid="card-flags">
          <FlagPicker label="Visible par (révision)" hint="Aucun coché : tout le monde. Ex. OFFICERCANDIDATE pour les candidats au grade." allFlags={allFlags} value={flags} onChange={setFlags} />
          <FlagPicker label="Gérée par (modification)" hint="Aucun coché : toute la TD. Sinon, seuls les TD ayant un de ces flags (ex. OFFICER)." allFlags={allFlags} value={manageFlags} onChange={setManageFlags} />
          {topic.trim() && (
            <label className="flex items-center gap-1.5 text-[12px] text-slate-600">
              <input type="checkbox" checked={applyToTopic} onChange={(e) => setApplyToTopic(e.target.checked)} />
              Appliquer ces accès à toutes les cartes du thème « {topic.trim()} »
            </label>
          )}
        </div>
      )}
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

function FlagPicker({ label, hint, allFlags, value, onChange }: { label: string; hint: string; allFlags: { code: string; name: string }[]; value: string[]; onChange: (next: string[]) => void }) {
  return (
    <fieldset className="text-[12px]">
      <legend className="font-bold text-slate-600">{label}</legend>
      <p className="text-[11px] text-slate-500 mb-1">{hint}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {allFlags.map((f) => (
          <label key={f.code} className="flex items-center gap-1" title={f.name}>
            <input type="checkbox" checked={value.includes(f.code)} onChange={(e) => onChange(e.target.checked ? [...value, f.code] : value.filter((c) => c !== f.code))} />
            {f.code}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
