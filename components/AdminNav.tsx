import Link from "next/link";

const TABS = [
  { href: "/admin", label: "Comptes" },
  { href: "/admin/ranks", label: "Rangs" },
  { href: "/admin/forms", label: "Formulaires" },
  { href: "/admin/reports", label: "Rapports reçus" },
  { href: "/admin/access", label: "Accès & flags" },
  { href: "/admin/exams", label: "Examens" },
  { href: "/training/cards/manage?from=admin", label: "Cartes de révision" },
];

/** Petit menu commun aux pages de modération. */
export function AdminNav({ current }: { current: string }) {
  return (
    <nav aria-label="Administration" className="flex gap-1 border-b border-slate-200 mb-5">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.href === current ? "page" : undefined}
          className={`px-4 py-2 text-[13px] font-bold uppercase tracking-wide -mb-px border-b-2 transition-colors ${
            tab.href === current
              ? "border-[#0d2644] text-[#0d2644]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
