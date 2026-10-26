"use client";

/* Le mélange se fait après l'affichage (Math.random côté serveur et navigateur donnerait deux ordres différents) :
   d'où ces mises à jour d'état dans des effets. */
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Flashcard } from "@/lib/flashcards-types";
import { CardEditor } from "./CardEditor";
import { mergeSaved } from "./manage/CardManager";

type Dir = "left" | "right";
const SWAP_MS = 180;
const DRAG_THRESHOLD = 70;

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Paquet mélangé : chaque carte passe une fois avant que le tirage recommence (sans répéter la dernière tout de suite). */
function newQueue(ids: string[], avoidFirst?: string): string[] {
  const q = shuffled(ids);
  if (q.length > 1 && q[0] === avoidFirst) [q[0], q[1]] = [q[1], q[0]];
  return q;
}

export function StudyDeck({ initialCards, canEdit, allFlags = [] }: { initialCards: Flashcard[]; canEdit: boolean; allFlags?: { code: string; name: string }[] }) {
  const [cards, setCards] = useState(initialCards);
  const [topic, setTopic] = useState("");
  const [queue, setQueue] = useState<string[] | null>(null); // null tant que le mélange n'est pas fait (évite un écart serveur/navigateur)
  const [pos, setPos] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<Dir | null>(null);
  const [entering, setEntering] = useState<Dir | null>(null);
  const [panel, setPanel] = useState<"edit" | "new" | null>(null);
  const busy = useRef(false);
  const pointer = useRef<{ x: number; y: number; onCard: boolean; moved: boolean } | null>(null);

  const topics = useMemo(() => [...new Set(cards.map((c) => c.topic).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")), [cards]);
  const pool = useMemo(() => cards.filter((c) => !topic || c.topic === topic), [cards, topic]);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const poolKey = pool.map((c) => c.id).join(",");

  // Mélange au chargement et à chaque changement de thème.
  const lastTopic = useRef<string | null>(null);
  useEffect(() => {
    if (lastTopic.current === topic && queue !== null) return;
    lastTopic.current = topic;
    setQueue(newQueue(pool.map((c) => c.id)));
    setPos(0);
    setHistory([]);
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, poolKey]);

  // Cartes ajoutées ou supprimées pendant la séance : on garde l'ordre en cours.
  useEffect(() => {
    setQueue((q) => {
      if (q === null) return q;
      const ids = new Set(pool.map((c) => c.id));
      const kept = q.filter((id) => ids.has(id));
      const added = shuffled(pool.map((c) => c.id).filter((id) => !q.includes(id)));
      if (kept.length === q.length && added.length === 0) return q;
      return [...kept, ...added];
    });
  }, [poolKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentId = queue ? queue[Math.min(pos, Math.max(queue.length - 1, 0))] : undefined;
  const card = currentId ? byId.get(currentId) : undefined;

  const go = useCallback(
    (dir: Dir, back = false) => {
      if (busy.current || !queue || queue.length === 0) return;
      if (back && history.length === 0) { setDragX(0); return; }
      busy.current = true;
      setLeaving(dir);
      window.setTimeout(() => {
        if (back) {
          const prev = history[history.length - 1];
          setHistory((h) => h.slice(0, -1));
          if (!pool.some((c) => c.id === prev)) {
            // la carte précédente a été supprimée ou n'est plus dans le thème : on reste ici
          } else if (pos > 0 && queue[pos - 1] === prev) {
            setPos(pos - 1);
          } else {
            // on revient à un tirage précédent : la carte revue passe en tête du paquet courant
            setQueue([prev, ...queue.filter((id) => id !== prev)]);
            setPos(0);
          }
        } else {
          const nextPos = pos + 1;
          setHistory((h) => [...h.slice(-50), queue[pos]]);
          if (nextPos >= queue.length) {
            setQueue(newQueue(pool.map((c) => c.id), queue[pos]));
            setPos(0);
          } else {
            setPos(nextPos);
          }
        }
        setFlipped(false);
        setDragX(0);
        setLeaving(null);
        setEntering(dir === "left" ? "right" : "left");
        window.setTimeout(() => { setEntering(null); busy.current = false; }, SWAP_MS);
      }, SWAP_MS);
    },
    [queue, pos, history, pool]
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (busy.current) return;
    pointer.current = { x: e.clientX, y: e.clientY, onCard: !!(e.target as HTMLElement).closest("[data-card]"), moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const p = pointer.current;
    if (!p) return;
    const dx = e.clientX - p.x;
    if (Math.abs(dx) > 8) p.moved = true;
    if (p.moved) setDragX(dx);
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const p = pointer.current;
    pointer.current = null;
    setDragging(false);
    if (!p) return;
    const dx = e.clientX - p.x;
    if (p.moved && Math.abs(dx) > DRAG_THRESHOLD) go(dx < 0 ? "left" : "right");
    else if (p.moved) setDragX(0); // trop court : la carte revient
    else if (p.onCard) setFlipped((f) => !f);
    else go("left"); // clic à côté de la carte
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go("left"); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go("right", true); }
  }

  const wrapStyle: React.CSSProperties = {
    transform: leaving
      ? `translateX(${leaving === "left" ? "-120%" : "120%"})`
      : `translateX(${dragX}px) rotate(${dragX / 40}deg)`,
    opacity: leaving ? 0 : 1,
    transition: dragging ? "none" : `transform ${SWAP_MS}ms ease, opacity ${SWAP_MS}ms ease`,
  };

  return (
    <div>
      <style>{`
        @keyframes deck-in-from-right { from { transform: translateX(80%); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes deck-in-from-left { from { transform: translateX(-80%); opacity: 0 } to { transform: none; opacity: 1 } }
        .deck-enter-right { animation: deck-in-from-right ${SWAP_MS}ms ease-out }
        .deck-enter-left { animation: deck-in-from-left ${SWAP_MS}ms ease-out }
        .deck-flip { transition: transform 450ms cubic-bezier(.4,.2,.2,1) }
        @media (prefers-reduced-motion: reduce) { .deck-flip { transition: none } .deck-enter-right, .deck-enter-left { animation: none } }
      `}</style>

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Thèmes">
          {["", ...topics].map((t) => (
            <button key={t || "all"} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)}
              className={`text-[12px] rounded-full border px-3 py-1 transition-colors ${topic === t ? "bg-[#0d2644] text-white border-[#0d2644]" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}>
              {t || "Tous les thèmes"}
            </button>
          ))}
        </div>
      )}

      {queue === null ? (
        <div className="h-80" aria-busy="true" />
      ) : !card ? (
        <p className="text-[13px] text-slate-500 border border-slate-200 rounded-xl p-6 text-center">
          {cards.length === 0 ? "Aucune carte pour le moment." : "Aucune carte dans ce thème."}
        </p>
      ) : (
        <>
          <div
            data-testid="deck-stage"
            tabIndex={0}
            role="group"
            aria-label="Carte de révision. Espace pour retourner, flèches pour changer de carte."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { pointer.current = null; setDragging(false); setDragX(0); }}
            onKeyDown={onKeyDown}
            className="relative h-80 select-none cursor-pointer rounded-xl flex items-center justify-center overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d2644]"
            style={{ touchAction: "pan-y", perspective: 1200 }}
          >
            <div className={entering ? `deck-enter-${entering}` : ""} style={{ width: "100%", maxWidth: 520, height: 260 }}>
              <div style={{ ...wrapStyle, width: "100%", height: "100%" }}>
                <div
                  data-card
                  data-testid="deck-card"
                  data-flipped={flipped}
                  className="deck-flip relative w-full h-full"
                  style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "none" }}
                >
                  <Face hidden={flipped} testid="deck-front" text={card.question} tone="front" />
                  <Face hidden={!flipped} testid="deck-back" text={card.answer} tone="back" back />
                </div>
              </div>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">{flipped ? `Réponse : ${card.answer}` : `Question : ${card.question}`}</p>

          <div className="flex items-center justify-between mt-2 text-[12px] text-slate-500 max-w-[520px] mx-auto">
            <button type="button" onClick={() => go("right", true)} disabled={history.length === 0} className="hover:underline disabled:opacity-30">← Précédente</button>
            <span data-testid="deck-counter">Carte {Math.min(pos + 1, queue.length)} / {queue.length}</span>
            <button type="button" onClick={() => go("left")} className="hover:underline">Suivante →</button>
          </div>
          <p className="text-center text-[12px] text-slate-400 mt-1">
            Clique sur la carte pour la retourner · clique à côté ou fais-la glisser pour changer de carte
          </p>
        </>
      )}

      {canEdit && (
        <div className="mt-6 max-w-[520px] mx-auto flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            {card && card.editable && <button type="button" onClick={() => setPanel(panel === "edit" ? null : "edit")} className="font-bold text-[#0d2644] hover:underline">Modifier cette carte</button>}
            <button type="button" onClick={() => setPanel(panel === "new" ? null : "new")} className="font-bold text-[#0d2644] hover:underline">+ Nouvelle carte</button>
            <Link href="/training/cards/manage" className="text-slate-600 hover:underline">Gérer toutes les cartes</Link>
          </div>
          {panel === "edit" && card && card.editable && (
            <CardEditor key={card.id} card={card} topics={topics} allFlags={allFlags}
              onSaved={(c, affected) => setCards((all) => mergeSaved(all, c, affected))}
              onDeleted={(id) => { setCards((all) => all.filter((x) => x.id !== id)); setPanel(null); setFlipped(false); }}
              onCancel={() => setPanel(null)} />
          )}
          {panel === "new" && (
            <CardEditor card={null} topics={topics} allFlags={allFlags} onSaved={(c, affected) => setCards((all) => [...mergeSaved(all, c, affected), c])} onCancel={() => setPanel(null)} />
          )}
        </div>
      )}
    </div>
  );
}

/** Une face de la carte : du texte et un contour arrondi, rien d'autre. */
function Face({ text, hidden, testid, tone, back = false }: { text: string; hidden: boolean; testid: string; tone: "front" | "back"; back?: boolean }) {
  return (
    <div
      data-testid={testid}
      aria-hidden={hidden}
      className={`absolute inset-0 rounded-2xl border-2 bg-white flex items-center justify-center p-8 text-center overflow-y-auto ${tone === "front" ? "border-slate-300" : "border-[#0d2644]"}`}
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: back ? "rotateY(180deg)" : "none" }}
    >
      <p className="text-[17px] leading-snug text-slate-800 whitespace-pre-wrap break-words max-h-full">{text}</p>
    </div>
  );
}
