import Link from "next/link";

// Liste des modules inspirée du document de référence
import { Suspense } from "react";
import { getVisibleModules } from "@/lib/access";
import { DivisionDashboard } from "@/components/DivisionDashboard";

export default function Home() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const modules = await getVisibleModules();
  return (
    <main className="max-w-6xl mx-auto flex flex-col font-['Calibri','Arial',sans-serif]">
      
      {/* En-tête de la page d'accueil inspiré de l'image */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <h1 className="text-xl font-bold text-[#1f1f1f] uppercase tracking-wide">LSFD IPP</h1>
        <div className="h-5 w-[2px] bg-[#c00d0d]"></div>
        <p className="text-slate-600 text-sm">All your documents, forms, apps, and support in one place.</p>
      </div>

      {/* Grille des modules (4 colonnes, 2 lignes) */}
{/* ... le reste du code de ta grille ... */}
<div className="grid grid-cols-4 gap-1">
  {modules.map((mod) => (
    <Link 
      key={`${mod.id}-${mod.title}`} 
      href={mod.link}
      className="group relative h-40 bg-slate-800 overflow-hidden flex flex-col items-center justify-center p-4 text-center border border-white hover:border-[#c00d0d] transition-colors"
    >
      <img src={mod.image} alt={mod.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors z-0"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* On utilise mod.iconPath pour avoir la bonne icône sur chaque tuile */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-[#c00d0d] mb-2">
          <path strokeLinecap="round" strokeLinejoin="round" d={mod.iconPath} />
        </svg>
        
        <h2 className="text-white text-[15px] font-bold mb-1">{mod.title}</h2>
        <p className="text-white/80 text-[11px] leading-snug px-2">{mod.desc}</p>
      </div>
    </Link>
  ))}
</div>

      {/* Dashboard → séparateur → divisions / unités (visibles selon les flags divisionnaires) */}
      <Suspense fallback={null}>
        <DivisionDashboard />
      </Suspense>

    </main>
  );
}