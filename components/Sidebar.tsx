import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  /** Liens de la sidebar, filtrés selon les flags du compte (rendus côté serveur). */
  linksSlot: React.ReactNode;
}

export function Sidebar({ isOpen, linksSlot }: SidebarProps) {
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
          {linksSlot}
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