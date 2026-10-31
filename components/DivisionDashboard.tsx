import Link from "next/link";
import { getVisibleDivisions } from "@/lib/divisions";
import { DivisionLogo } from "./DivisionLogo";

/** Sous le dashboard principal : séparateur discret puis tuiles des divisions accessibles. Rien si aucun flag. */
export async function DivisionDashboard() {
  const divisions = await getVisibleDivisions();
  if (divisions.length === 0) return null;
  return (
    <section aria-label="Divisions et unités" data-testid="division-dashboard" className="mt-6">
      <hr className="border-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <p className="mt-3 mb-2 text-center text-[10.5px] uppercase tracking-[0.3em] text-slate-400">Divisions &amp; unités</p>
      <div className="grid grid-cols-4 gap-1">
        {divisions.map((d) => (
          <Link
            key={d.key}
            href={d.link}
            data-testid={`division-${d.key}`}
            className="group relative h-40 bg-slate-800 overflow-hidden flex flex-col items-center justify-center p-4 text-center border border-white hover:border-[#c00d0d] transition-colors"
          >
            {d.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0d2644] to-slate-900" />
            )}
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />
            <div className="relative z-10 flex flex-col items-center">
              <DivisionLogo src={d.logo} initials={d.initials} className="w-14 h-14 mb-2" />
              <h2 className="text-white text-[15px] font-bold mb-1">{d.title}</h2>
              <p className="text-white/80 text-[11px] leading-snug px-2">{d.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
