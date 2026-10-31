"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MDC_HOME, appForPath } from "@/lib/toughbook-apps";

const FMT_TIME = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
const FMT_DATE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "2-digit", month: "short" });

const btn = "h-11 min-w-11 px-3 rounded-lg flex items-center justify-center gap-2 text-[14px] font-semibold bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors";

/** Barre des tâches du Toughbook : accueil, retour, application ouverte, plein écran, horloge (heure de Paris). */
export function Taskbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [full, setFull] = useState(false);
  const app = appForPath(pathname);
  const atHome = pathname === MDC_HOME;

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 15_000);
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => { window.clearInterval(id); document.removeEventListener("fullscreenchange", onFs); };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* plein écran refusé par le navigateur : sans conséquence */
    }
  };

  return (
    <nav aria-label="Barre des tâches" className="shrink-0 h-16 px-3 flex items-center gap-2 bg-black/60 border-t border-white/10">
      <Link href={MDC_HOME} aria-label="Accueil" data-testid="mdc-home" className={`${btn} ${atHome ? "bg-white/25" : ""}`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" /></svg>
        <span className="hidden sm:inline">Accueil</span>
      </Link>
      {!atHome && <button type="button" onClick={() => router.back()} aria-label="Retour" data-testid="mdc-back" className={btn}>←<span className="hidden sm:inline">Retour</span></button>}
      <div className="flex-1 min-w-0 text-center text-[14px] font-semibold text-white/80 truncate" data-testid="mdc-title">{app?.title ?? "Accueil"}</div>
      <button type="button" onClick={toggleFullscreen} aria-pressed={full} data-testid="mdc-fullscreen" className={btn}>{full ? "Quitter le plein écran" : "Plein écran"}</button>
      <Link href="/" data-testid="mdc-exit" className={btn}>Intranet</Link>
      <div className="pl-3 text-right leading-tight min-w-20" data-testid="mdc-clock" suppressHydrationWarning>
        <div className="text-[16px] font-bold tabular-nums">{now ? FMT_TIME.format(now) : "--:--"}</div>
        <div className="text-[11px] text-white/60 capitalize">{now ? FMT_DATE.format(now) : ""}</div>
      </div>
    </nav>
  );
}
