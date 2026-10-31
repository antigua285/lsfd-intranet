"use client";

import { useEffect, useRef, useState } from "react";

type Note = { id: string; title: string; body: string };
const KEY = "lsfd-mdc-notes-v1";
const MAX_NOTES = 30;
const MAX_BODY = 5000;
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function load(): Note[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((n): n is Note => !!n && typeof n.id === "string" && typeof n.title === "string" && typeof n.body === "string")
        .slice(0, MAX_NOTES);
    }
  } catch {
    /* stockage indisponible : on démarre vide */
  }
  return [];
}

const now = () => new Date().toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });

/** Bloc-notes OOC : plusieurs notes (un patient = une note), sauvegardées sur l'appareil, aucune donnée envoyée au serveur. */
export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  // Lecture du stockage de l'appareil après l'affichage (le serveur ne le connaît pas).
  useEffect(() => {
    const t = window.setTimeout(() => {
      const loaded = load();
      setNotes(loaded);
      setCurrent(loaded[0]?.id ?? null);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(notes));
    } catch {
      /* stockage plein ou bloqué : la note reste visible jusqu'au rechargement */
    }
  }, [notes, ready]);

  const note = notes.find((n) => n.id === current) ?? null;
  const update = (patch: Partial<Note>) => setNotes((list) => list.map((n) => (n.id === current ? { ...n, ...patch } : n)));

  const add = () => {
    if (notes.length >= MAX_NOTES) return;
    const n: Note = { id: newId(), title: `Patient ${notes.length + 1}`, body: "" };
    setNotes((list) => [n, ...list]);
    setCurrent(n.id);
  };
  const remove = () => {
    if (!note || !window.confirm(`Supprimer « ${note.title} » ?`)) return;
    const rest = notes.filter((n) => n.id !== note.id);
    setNotes(rest);
    setCurrent(rest[0]?.id ?? null);
  };
  const insert = (text: string) => {
    if (!note) return;
    const el = area.current;
    const start = el?.selectionStart ?? note.body.length;
    const end = el?.selectionEnd ?? note.body.length;
    const body = `${note.body.slice(0, start)}${text}${note.body.slice(end)}`.slice(0, MAX_BODY);
    update({ body });
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + text.length, start + text.length); });
  };
  const copy = async () => {
    if (!note) return;
    try {
      await navigator.clipboard.writeText(note.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      area.current?.select();
    }
  };

  const chip = "h-10 px-3 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 text-[13px] font-semibold";

  return (
    <div className="mdc-wallpaper min-h-full p-4 flex flex-col md:flex-row gap-4">
      <aside className="md:w-64 shrink-0 flex flex-col gap-2">
        <button type="button" onClick={add} data-testid="note-add" disabled={notes.length >= MAX_NOTES} className="h-12 rounded-xl bg-[#c00d0d] hover:bg-[#d61414] text-white font-bold disabled:opacity-50">+ Nouvelle note</button>
        <ul className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible" data-testid="note-list">
          {notes.map((n) => (
            <li key={n.id} className="shrink-0 md:shrink">
              <button type="button" onClick={() => setCurrent(n.id)} data-testid="note-item" aria-current={n.id === current} className={`w-full text-left rounded-xl px-3 py-2.5 border ${n.id === current ? "bg-white/20 border-white/40" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                <span className="block text-[14px] font-bold truncate">{n.title || "Sans titre"}</span>
                <span className="block text-[11px] text-white/55 truncate">{n.body.replace(/\s+/g, " ").slice(0, 40) || "Vide"}</span>
              </button>
            </li>
          ))}
        </ul>
        {ready && notes.length === 0 && <p className="text-[12px] text-white/60">Aucune note. Crée-en une pour commencer.</p>}
      </aside>

      <section className="flex-1 min-w-0 flex flex-col gap-3">
        {note ? (
          <>
            <input aria-label="Titre de la note" data-testid="note-title" value={note.title} maxLength={60} onChange={(e) => update({ title: e.target.value })} className="h-12 rounded-xl bg-white/10 border border-white/20 px-3 text-[18px] font-bold text-white placeholder-white/40 outline-none focus:border-white/50" />
            <div className="flex flex-wrap gap-2" aria-label="Insertions rapides">
              <button type="button" className={chip} data-testid="note-vitals" onClick={() => insert("OOC : FC ___ · TA ___/___ · SpO2 ___ % · FR ___ · GCS __/15 · T° ___\n")}>+ Constantes</button>
              <button type="button" className={chip} onClick={() => insert(`[${now()}] `)}>+ Heure</button>
              <button type="button" className={chip} onClick={() => insert("Conscient : oui / non · Respire : oui / non · Saigne : oui / non\n")}>+ État</button>
              <span className="flex-1" />
              <button type="button" className={chip} onClick={copy} data-testid="note-copy">{copied ? "Copié ✓" : "Copier"}</button>
              <button type="button" className={`${chip} text-red-300`} onClick={remove} data-testid="note-delete">Supprimer</button>
            </div>
            <textarea ref={area} aria-label="Contenu de la note" data-testid="note-body" value={note.body} maxLength={MAX_BODY} onChange={(e) => update({ body: e.target.value })} placeholder="Notes OOC : constantes, observations, ce qu'il reste à faire…" className="flex-1 min-h-64 rounded-xl bg-white/10 border border-white/20 p-3 text-[15px] leading-relaxed text-white placeholder-white/40 outline-none focus:border-white/50 resize-none" />
            <p className="text-[11px] text-white/50">Enregistré automatiquement sur cet appareil uniquement (rien n&apos;est envoyé au serveur).</p>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/50 text-[14px]">{ready ? "Sélectionne ou crée une note." : "Chargement…"}</div>
        )}
      </section>
    </div>
  );
}
