"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "lsfd-mdc-notepad-v1";
const MAX = 20000;

/** Bloc-notes : un seul document de texte brut, enregistré automatiquement sur l'appareil (rien n'est envoyé au serveur). */
export function Notepad() {
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [menu, setMenu] = useState<null | "file" | "format">(null);
  const [copied, setCopied] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  // Lecture du stockage de l'appareil après l'affichage (le serveur ne le connaît pas).
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        setText((window.localStorage.getItem(KEY) ?? "").slice(0, MAX));
      } catch {
        /* stockage indisponible : on démarre vide */
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, text);
    } catch {
      /* stockage plein ou bloqué : le texte reste visible jusqu'au rechargement */
    }
  }, [text, ready]);

  const newFile = () => {
    setMenu(null);
    if (text && !window.confirm("Effacer le texte actuel ?")) return;
    setText("");
    area.current?.focus();
  };
  const copyAll = async () => {
    setMenu(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      area.current?.select();
    }
  };

  const lines = text === "" ? 1 : text.split("\n").length;
  const item = "block w-full text-left px-4 py-1.5 text-[13px] hover:bg-sky-100";

  return (
    <div className="flex flex-col h-full bg-white text-black" onClick={() => setMenu(null)}>
      <div className="relative flex items-center gap-1 px-1 h-8 shrink-0 bg-white border-b border-slate-200 text-[13px]" onClick={(e) => e.stopPropagation()}>
        <button type="button" data-testid="np-file" onClick={() => setMenu(menu === "file" ? null : "file")} className={`px-3 h-7 rounded hover:bg-slate-100 ${menu === "file" ? "bg-slate-100" : ""}`}>Fichier</button>
        <button type="button" data-testid="np-format" onClick={() => setMenu(menu === "format" ? null : "format")} className={`px-3 h-7 rounded hover:bg-slate-100 ${menu === "format" ? "bg-slate-100" : ""}`}>Format</button>
        {copied && <span className="ml-2 text-[12px] text-green-700">Copié ✓</span>}
        {menu === "file" && (
          <div className="absolute top-8 left-1 z-10 w-52 bg-white border border-slate-300 shadow-lg py-1">
            <button type="button" className={item} data-testid="np-new" onClick={newFile}>Nouveau</button>
            <button type="button" className={item} data-testid="np-copy" onClick={copyAll}>Copier tout le texte</button>
          </div>
        )}
        {menu === "format" && (
          <div className="absolute top-8 left-14 z-10 w-60 bg-white border border-slate-300 shadow-lg py-1">
            <button type="button" className={item} data-testid="np-wrap" onClick={() => { setWrap((w) => !w); setMenu(null); }}>{wrap ? "✓ " : "   "}Retour automatique à la ligne</button>
          </div>
        )}
      </div>
      <textarea
        ref={area}
        aria-label="Texte du bloc-notes"
        data-testid="np-text"
        value={text}
        maxLength={MAX}
        spellCheck={false}
        wrap={wrap ? "soft" : "off"}
        onChange={(e) => setText(e.target.value)}
        className={`flex-1 min-h-0 w-full resize-none border-0 outline-none p-2 bg-white text-black text-[15px] leading-snug ${wrap ? "" : "overflow-x-auto whitespace-pre"}`}
        style={{ fontFamily: "Consolas, 'Courier New', monospace" }}
      />
      <div className="h-6 shrink-0 flex items-center justify-end gap-6 px-3 bg-slate-100 border-t border-slate-200 text-[12px] text-slate-600">
        <span data-testid="np-count">{lines} ligne(s)</span>
        <span>{text.length} caractère(s)</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
