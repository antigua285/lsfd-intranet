import Link from "next/link";

interface HeaderProps {
  toggleSidebar: () => void;
  showBurger: boolean;
}

export function Header({ toggleSidebar, showBurger }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex justify-between items-center font-['Calibri','Arial',sans-serif] shrink-0 z-10">
      
      {/* Zone Gauche : Bouton Burger (conditionnel) */}
      <div className="flex items-center w-1/3">
        {showBurger && (
          <button 
            onClick={toggleSidebar}
            className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors mr-3"
            title="Toggle Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Zone Centrale : Barre de recherche (Toujours visible) */}
      <div className="flex justify-center w-1/3">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search records, personnel, or protocols..."
            className="w-full bg-slate-50 border border-slate-300 rounded pl-9 pr-3 py-1.5 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Zone Droite : Navigation Rapide & Profil Utilisateur */}
      <div className="flex items-center justify-end gap-3 w-1/3">
        
        {/* Bouton Home et Séparateur (Visibles uniquement sur les sous-pages) */}
        {showBurger && (
          <div className="flex items-center gap-3 mr-2">
            <Link 
              href="/" 
              className="text-slate-500 hover:text-[#0d2644] transition-colors p-1 rounded hover:bg-slate-100"
              title="Return to Hub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </Link>
            {/* Barre de séparation verticale */}
            <div className="h-6 w-[1px] bg-slate-300"></div>
          </div>
        )}

        {/* Profil Utilisateur */}
        <div className="text-right leading-tight">
          <p className="text-[13px] font-bold text-slate-800">J. Doe</p>
          <p className="text-[11px] text-slate-500">Captain | Station 7</p>
        </div>
        <div className="w-8 h-8 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-200 transition-colors">
          JD
        </div>
      </div>

    </header>
  );
}