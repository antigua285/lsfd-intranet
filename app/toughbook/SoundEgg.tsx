"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Petit bouton discret : lit le son suivant du dossier public/sound (dans l'ordre alphabétique, en boucle).
 * Sert aussi de banc d'essai pour d'éventuels sons de l'interface.
 */
export function SoundEgg({ sounds }: { sounds: string[] }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const next = useRef(0);
  const timer = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [label, setLabel] = useState("");

  useEffect(() => () => {
    audio.current?.pause();
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const say = (text: string) => {
    setLabel(text);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLabel(""), 3000);
  };

  const stop = () => {
    audio.current?.pause();
    audio.current = null;
    setPlaying(false);
  };

  const toggle = () => {
    if (playing) { stop(); return; }
    if (sounds.length === 0) { say("Aucun son dans public/sound"); return; }
    const name = sounds[next.current % sounds.length];
    next.current += 1;
    const el = new Audio(`/sound/${encodeURIComponent(name)}`);
    audio.current = el;
    el.onended = () => { setPlaying(false); audio.current = null; };
    el.onerror = () => { setPlaying(false); audio.current = null; say(`Lecture impossible : ${name}`); };
    setPlaying(true);
    say(name.replace(/\.[^.]+$/, ""));
    el.play().catch(() => { setPlaying(false); audio.current = null; say(`Lecture bloquée : ${name}`); });
  };

  return (
    <div className="absolute top-1.5 right-2 z-10 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {label && <span role="status" data-testid="sound-label" className="text-[11px] text-white/45 max-w-40 truncate">{label}</span>}
      <button type="button" data-testid="sound-egg" aria-label={playing ? "Arrêter le son" : "Lire un son"} aria-pressed={playing} onClick={toggle}
        className="w-8 h-8 rounded-full flex items-center justify-center ring-1 ring-white/10 hover:ring-white/40 focus-visible:ring-white/60 outline-none transition-shadow">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#010a19" aria-hidden="true">
          {playing ? <rect x="6" y="6" width="12" height="12" rx="1.5" /> : <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />}
        </svg>
      </button>
    </div>
  );
}
