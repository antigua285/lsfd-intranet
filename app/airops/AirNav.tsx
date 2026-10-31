import Link from "next/link";

const TABS = [
  { key: "pilots", href: "/airops", label: "Pilotes & carnets" },
  { key: "forms", href: "/airops/forms", label: "Formulaires de vol" },
  { key: "maps", href: "/airops/charts", label: "Cartes & préparation de vol" },
] as const;

/** Onglets de la section Air Operations . */
export function AirNav({ current }: { current: "pilots" | "forms" | "maps" }) {
  return (
    <nav aria-label="Air Operations" className="flex flex-wrap gap-1 border-b border-slate-300 mb-4">
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} data-testid={`airnav-${t.key}`} aria-current={current === t.key ? "page" : undefined}
          className={`px-3.5 py-2 text-[13px] font-bold border border-b-0 rounded-t ${current === t.key ? "bg-[#0d2644] text-white border-[#0d2644]" : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
