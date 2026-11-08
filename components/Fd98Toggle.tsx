"use client";

import { useEffect, useRef, useState } from "react";

const CODE = "fd98";
const KEY = "lsfd-theme";

function setTheme(on: boolean) {
  const root = document.documentElement;
  if (on) root.setAttribute("data-theme", "fd98");
  else root.removeAttribute("data-theme");
  try {
    if (on) localStorage.setItem(KEY, "fd98");
    else localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible : le thème vaut pour la session */
  }
}

/** Vrai si la frappe vise un champ de saisie ou une fenêtre ouverte : le code secret ne doit pas se déclencher alors. */
function typingElsewhere(t: EventTarget | null): boolean {
  if (document.querySelector('dialog[open], [role="dialog"], [aria-modal="true"]')) return true;
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

/**
 * Easter egg : taper « fd98 » (sans rien d'ouvert ni de champ actif) bascule l'intranet entre son style actuel et un style
 * « institutionnel fin des années 90 » (voir la section fd98 de globals.css). Retaper le code revient au style moderne.
 */
export function Fd98Toggle() {
  const buf = useRef("");
  const last = useRef(0);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "fd98") document.documentElement.setAttribute("data-theme", "fd98");
    } catch {
      /* ignore */
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (location.pathname === "/toughbook" || location.pathname.startsWith("/toughbook/")) return;
      if (typingElsewhere(e.target)) { buf.current = ""; return; }
      const now = Date.now();
      if (now - last.current > 1500) buf.current = "";
      last.current = now;
      buf.current = (buf.current + e.key.toLowerCase()).slice(-CODE.length);
      if (buf.current !== CODE) return;
      buf.current = "";
      const on = document.documentElement.getAttribute("data-theme") !== "fd98";
      setTheme(on);
      setMsg(on ? "Mode fd98 activé — tapez fd98 pour revenir." : "Affichage moderne rétabli.");
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 2600);
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(timer); };
  }, []);

  if (!msg) return null;
  return (
    <div role="status" data-testid="fd98-toast" className="fixed bottom-3 left-3 z-[100] border border-slate-400 bg-white px-3 py-1.5 text-[12px] text-slate-800 shadow-lg">
      {msg}
    </div>
  );
}
