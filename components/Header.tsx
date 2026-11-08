import type { ReactNode } from "react";
import Link from "next/link";

interface HeaderProps {
  toggleSidebar: () => void;
  showBurger: boolean;
  /** Bloc profil de l'utilisateur connecté (photo, nom, grade | station). */
  userSlot: ReactNode;
  /** Icône tablette vers le Toughbook (rendue côté serveur, absente si pas d'accès). */
  toughbookSlot?: ReactNode;
}

export function Header({ toggleSidebar, showBurger, userSlot, toughbookSlot }: HeaderProps) {
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
      <div className="fd-searchbox flex justify-center w-1/3">
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
        {/* Style fd98 uniquement : loupe + « Search the site » à la place de la barre de recherche */}
        <button type="button" className="fd-only fd-search" title="Search the site">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" width="30" height="30"><circle cx="13" cy="13" r="9" fill="#eaf1fb" stroke="#222" strokeWidth="3" /><path d="M20 20 L29 29" stroke="#222" strokeWidth="5" strokeLinecap="round" /></svg>
          <span>Search the site</span>
        </button>
        
        {/* Accès au MDC (Toughbook), à gauche du bouton Home / panneau admin */}
        {toughbookSlot}

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

        {/* Profil Utilisateur (utilisateur connecté, cliquable vers /profile) */}
        <div className="fd-hdr-user">{userSlot}</div>
      </div>

    </header>
  );
}