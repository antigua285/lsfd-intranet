"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
  /** Bloc profil affiché à droite du header (rendu côté serveur). */
  userSlot: ReactNode;
  /** Liens du menu latéral (rendus côté serveur, filtrés par flags). */
  navSlot: ReactNode;
}

export function DashboardLayout({ children, userSlot, navSlot }: DashboardLayoutProps) {
  const pathname = usePathname();
  // On vérifie si on est sur la racine (le hub principal)
  const isHomePage = pathname === "/";
  // La page de connexion s'affiche seule : ni header, ni menu latéral
  const isLoginPage = pathname === "/login";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoginPage) {
    return <main className="flex-1 overflow-y-auto bg-slate-100">{children}</main>;
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* La sidebar n'est rendue que si on N'EST PAS sur la page d'accueil */}
      {!isHomePage && <Sidebar isOpen={isSidebarOpen} linksSlot={navSlot} />}

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          toggleSidebar={toggleSidebar}
          showBurger={!isHomePage} // On masque le burger sur l'accueil
          userSlot={userSlot}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
