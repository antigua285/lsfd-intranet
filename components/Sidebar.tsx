import Link from "next/link";
import { APP_MODULES } from "@/config/navigation";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <div 
      className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-white ${
        isOpen ? "w-56" : "w-0"
      }`}
    >
      <aside className="w-56 border-r border-slate-200 flex flex-col h-full font-['Calibri','Arial',sans-serif]">
        
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Quick Links
          </p>
        </div>

        <nav className="flex-1 bg-white pt-2 overflow-y-auto">
          <ul className="flex flex-col space-y-0.5">
            {/* Boucle dynamique sur nos modules */}
            {APP_MODULES.map((mod) => (
              <li key={mod.id}>
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
        </nav>

        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-700">LSFD Secure Net</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <p className="text-[11px] text-slate-500">System Online</p>
          </div>
        </div>

      </aside>
    </div>
  );
}