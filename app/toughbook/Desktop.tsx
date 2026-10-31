"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { MapView } from "../map/MapView";
import { AVAILABLE_APPS, type MdcApp } from "@/lib/toughbook-apps";
import { loadMdcMapAction, type MdcMapData } from "./actions";
import { Notepad } from "./Notepad";

const FMT_TIME = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
const FMT_DATE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" });

function AppIcon({ app, size }: { app: MdcApp; size: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-[22%] shadow-md shrink-0" style={{ width: size, height: size, background: `linear-gradient(145deg, ${app.from}, ${app.to})` }} aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="#fff" style={{ width: size * 0.6, height: size * 0.6 }}><path strokeLinecap="round" strokeLinejoin="round" d={app.glyph} /></svg>
    </span>
  );
}

const WinLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M2 4.2 10.4 3v8.1H2zM11.5 2.9 22 1.4v9.7H11.5zM2 12.1h8.4v8.1L2 19zM11.5 12.1H22v9.5l-10.5-1.5z" /></svg>
);

/** Bureau du Toughbook : icônes, fenêtres (applications ouvertes en même temps), barre des tâches et menu Démarrer. */
export function Desktop() {
  const [open, setOpen] = useState<string[]>([]); // ordre d'ouverture
  const [minimized, setMinimized] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [full, setFull] = useState(false);
  const [map, setMap] = useState<MdcMapData | "loading" | null>(null);
  const [, startTransition] = useTransition();
  const pointer = useRef<string>("mouse");

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 15_000);
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => { window.clearTimeout(first); window.clearInterval(id); document.removeEventListener("fullscreenchange", onFs); };
  }, []);

  const loadMap = () => {
    if (map && map !== "loading" && map.ok) return;
    setMap("loading");
    startTransition(async () => setMap(await loadMdcMapAction()));
  };

  const openApp = (key: string) => {
    setStartOpen(false);
    setOpen((o) => (o.includes(key) ? o : [...o, key]));
    setMinimized((m) => { const n = new Set(m); n.delete(key); return n; });
    setActive(key);
    if (key === "map") loadMap();
  };
  const closeApp = (key: string) => {
    setOpen((o) => o.filter((k) => k !== key));
    setMinimized((m) => { const n = new Set(m); n.delete(key); return n; });
    setActive((a) => (a === key ? open.filter((k) => k !== key && !minimized.has(k)).pop() ?? null : a));
  };
  const minimize = (key: string) => {
    setMinimized((m) => new Set(m).add(key));
    setActive((a) => (a === key ? open.filter((k) => k !== key && !minimized.has(k)).pop() ?? null : a));
  };
  const onTab = (key: string) => {
    if (active === key && !minimized.has(key)) minimize(key);
    else openApp(key);
  };
  const showDesktop = () => { setStartOpen(false); setMinimized(new Set(open)); setActive(null); };
  const toggleFullscreen = async () => {
    setStartOpen(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* plein écran refusé par le navigateur : sans conséquence */
    }
  };

  const appOf = (key: string) => AVAILABLE_APPS.find((a) => a.key === key)!;
  const content = (key: string) => {
    if (key === "notepad") return <Notepad />;
    if (key === "map") {
      if (!map || map === "loading") return <p className="p-4 text-[13px] text-slate-600">Chargement de la carte…</p>;
      if (!map.ok) return <p role="alert" className="p-4 text-[13px] text-red-700">{map.error}</p>;
      return <div className="h-full overflow-auto p-2 bg-slate-100"><MapView initialFeatures={map.features} initialZones={map.zones} editing={false} showReportLinks={false} fill /></div>;
    }
    return null;
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col select-none" data-testid="mdc-desktop">
      <div className="mdc-desktop relative flex-1 min-h-0 overflow-hidden" onClick={() => { setSelected(null); setStartOpen(false); }}>
        {/* Icônes du bureau, rangées de haut en bas puis de gauche à droite */}
        <ul className="absolute inset-0 p-2 flex flex-col flex-wrap content-start gap-1" data-testid="mdc-icons">
          {AVAILABLE_APPS.map((app) => (
            <li key={app.key}>
              <button
                type="button"
                data-testid={`icon-${app.key}`}
                onPointerDown={(e) => { pointer.current = e.pointerType; }}
                onClick={(e) => { e.stopPropagation(); setStartOpen(false); if (pointer.current === "touch" || pointer.current === "pen") openApp(app.key); else setSelected(app.key); }}
                onDoubleClick={(e) => { e.stopPropagation(); openApp(app.key); }}
                onKeyDown={(e) => { if (e.key === "Enter") openApp(app.key); }}
                className={`w-24 p-2 rounded flex flex-col items-center gap-1.5 border ${selected === app.key ? "bg-white/25 border-white/50" : "border-transparent hover:bg-white/10"}`}
              >
                <AppIcon app={app} size={52} />
                <span className="text-[12px] leading-tight text-white text-center" style={{ textShadow: "0 1px 3px rgba(0,0,0,.9)" }}>{app.title}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Fenêtres : toutes restent ouvertes (invisibles quand réduites) pour garder leur état */}
        {open.map((key) => {
          const app = appOf(key);
          const visible = active === key && !minimized.has(key);
          return (
            <section key={key} aria-label={app.title} aria-hidden={!visible} data-testid={`window-${key}`} data-visible={visible} onClick={(e) => e.stopPropagation()}
              className={`absolute inset-0 flex flex-col bg-white text-slate-900 ${visible ? "z-20" : "z-0 invisible pointer-events-none"}`}>
              <div className="h-9 shrink-0 flex items-center bg-[#f3f3f3] border-b border-slate-300 text-[13px]">
                <span className="pl-2"><AppIcon app={app} size={20} /></span>
                <span className="px-2 flex-1 truncate">{key === "notepad" ? "Sans titre - Bloc-notes" : app.title}</span>
                <button type="button" aria-label={`Réduire ${app.title}`} data-testid={`min-${key}`} onClick={() => minimize(key)} className="w-12 h-full hover:bg-slate-200 text-[16px]">—</button>
                <button type="button" aria-label={`Fermer ${app.title}`} data-testid={`close-${key}`} onClick={() => closeApp(key)} className="w-12 h-full hover:bg-[#e81123] hover:text-white text-[15px]">✕</button>
              </div>
              <div className="flex-1 min-h-0">{content(key)}</div>
            </section>
          );
        })}

        {startOpen && (
          <div role="menu" aria-label="Démarrer" data-testid="start-menu" onClick={(e) => e.stopPropagation()} className="absolute left-0 bottom-0 z-40 w-72 bg-[#1f1f1f]/97 text-white border border-white/10 shadow-2xl">
            <p className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-widest text-white/50">LSFD MDC</p>
            <ul className="py-1">
              {AVAILABLE_APPS.map((app) => (
                <li key={app.key}>
                  <button type="button" role="menuitem" data-testid={`start-${app.key}`} onClick={() => openApp(app.key)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 text-[14px]">
                    <AppIcon app={app} size={28} />{app.title}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/10 py-1">
              <button type="button" role="menuitem" data-testid="start-fullscreen" onClick={toggleFullscreen} className="w-full text-left px-4 py-2.5 hover:bg-white/10 text-[14px]">{full ? "Quitter le plein écran" : "Plein écran"}</button>
              <Link href="/" role="menuitem" data-testid="start-exit" className="block px-4 py-2.5 hover:bg-white/10 text-[14px]">Quitter le MDC (retour à l&apos;intranet)</Link>
            </div>
          </div>
        )}
      </div>

      {/* Barre des tâches */}
      <nav aria-label="Barre des tâches" className="shrink-0 h-12 flex items-stretch bg-[#1c1c1c] border-t border-white/10 text-white relative z-50" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Démarrer" aria-expanded={startOpen} data-testid="start-button" onClick={() => setStartOpen((s) => !s)} className={`w-14 flex items-center justify-center hover:bg-white/10 ${startOpen ? "bg-white/15" : ""}`}><WinLogo /></button>
        <div className="flex-1 min-w-0 flex items-stretch overflow-x-auto" data-testid="taskbar-tabs">
          {open.map((key) => {
            const app = appOf(key);
            const isActive = active === key && !minimized.has(key);
            return (
              <button key={key} type="button" data-testid={`tab-${key}`} aria-pressed={isActive} onClick={() => onTab(key)} className={`relative min-w-36 max-w-52 px-3 flex items-center gap-2 text-[13px] ${isActive ? "bg-white/15" : "bg-white/5 hover:bg-white/10"}`}>
                <AppIcon app={app} size={22} />
                <span className="truncate">{app.title}</span>
                <span className={`absolute left-0 right-0 bottom-0 h-[3px] ${isActive ? "bg-[#76b9ed]" : "bg-white/30"}`} />
              </button>
            );
          })}
        </div>
        <div className="px-3 flex flex-col justify-center items-end leading-tight text-[12px] min-w-24" data-testid="mdc-clock" suppressHydrationWarning>
          <span className="tabular-nums">{now ? FMT_TIME.format(now) : "--:--"}</span>
          <span className="tabular-nums text-white/70">{now ? FMT_DATE.format(now) : ""}</span>
        </div>
        <button type="button" aria-label="Afficher le bureau" data-testid="show-desktop" onClick={showDesktop} className="w-2.5 border-l border-white/30 hover:bg-white/20" />
      </nav>
    </div>
  );
}
