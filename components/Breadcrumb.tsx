import Link from "next/link";
import type { Crumb } from "@/lib/nav";

/** Fil d'Ariane + bouton « retour » vers le parent logique (l'avant-dernier élément). */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const parent = [...items].reverse().find((c) => c.href);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2" data-testid="breadcrumb">
      {parent && (
        <Link href={parent.href!} data-testid="back-button" className="inline-flex items-center rounded border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-bold text-slate-700 hover:bg-slate-50">
          ← Retour : {parent.label}
        </Link>
      )}
      <nav aria-label="Fil d'Ariane">
        <ol className="flex flex-wrap items-center gap-1 text-[12px] text-slate-500">
          {items.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {c.href && i < items.length - 1 ? (
                <Link href={c.href} className="hover:underline">{c.label}</Link>
              ) : (
                <span aria-current={i === items.length - 1 ? "page" : undefined} className={i === items.length - 1 ? "font-bold text-slate-700" : ""}>{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
