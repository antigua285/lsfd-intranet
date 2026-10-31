import Link from "next/link";
import { MDC_APPS } from "@/lib/toughbook-apps";

export default function ToughbookHome() {
  return (
    <div className="mdc-wallpaper min-h-full p-6 sm:p-8">
      <h1 className="text-[22px] font-bold tracking-wide">Applications</h1>
      <p className="text-[13px] text-white/60 mb-6">Touche une application pour l&apos;ouvrir.</p>
      <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" data-testid="mdc-apps">
        {MDC_APPS.map((app) => {
          const inner = (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-11 h-11 text-[#ff6b6b]" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={app.icon} /></svg>
              <span className="mt-3 text-[16px] font-bold leading-tight">{app.title}</span>
              <span className="mt-1 text-[12px] text-white/60 leading-snug">{app.desc}</span>
              {!app.href && <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-300/90">Bientôt</span>}
            </>
          );
          const base = "h-full min-h-40 rounded-2xl p-4 flex flex-col items-start border";
          return (
            <li key={app.key}>
              {app.href ? (
                <Link href={app.href} data-testid={`app-${app.key}`} className={`${base} bg-white/10 border-white/15 hover:bg-white/15 active:bg-white/20 transition-colors`}>{inner}</Link>
              ) : (
                <div aria-disabled="true" data-testid={`app-${app.key}`} className={`${base} bg-white/5 border-white/10 opacity-55`}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
