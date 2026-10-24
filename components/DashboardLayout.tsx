"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // On vérifie si on est sur la racine (le hub principal)
  const isHomePage = pathname === "/";
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* La sidebar n'est rendue que si on N'EST PAS sur la page d'accueil */}
      {!isHomePage && <Sidebar isOpen={isSidebarOpen} />}
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar} 
          showBurger={!isHomePage} // On masque le burger sur l'accueil
        />
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}