import Link from "next/link";
import { getVisibleModules } from "@/lib/access";

export function SidebarLinksSkeleton() {
  return <div className="px-4 py-2 text-[12px] text-slate-400">Chargement…</div>;
}

/** Liens du menu latéral : uniquement les catégories que le compte a le droit de voir. */
export async function SidebarLinks() {
  const modules = await getVisibleModules();
  return (
    <ul className="flex flex-col space-y-0.5">
      {modules.map((mod) => (
        <li key={`${mod.id}-${mod.title}`}>
          <Link
            href={mod.link}
            className="flex items-center px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-l-2 border-transparent hover:border-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-3 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d={mod.iconPath} />
            </svg>
            {mod.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
