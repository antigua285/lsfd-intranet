import Link from "next/link";

export default function DocumentReader() {
  return (
    // "fixed inset-0 z-50" permet de recouvrir tout le site (header et sidebar inclus)
    <div className="fixed inset-0 z-50 bg-slate-800 flex flex-col">
      
      {/* Barre supérieure ultra minimaliste avec juste la flèche */}
      <div className="bg-[#494949] p-3 flex items-center shadow-md shrink-0">
        <Link 
          href="/documents" 
          className="text-white hover:text-[#313131] transition-colors p-2 rounded-full hover:bg-[#c00d0d]}"
          title="Retour aux documents"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
      </div>

      {/* Liseuse PDF qui prend 100% de l'espace restant */}
      <div className="flex-1 w-full h-full">
        <iframe 
          src="/pdfs/radio.pdf" 
          className="w-full h-full border-none"
          title="PDF Document Viewer"
        />
      </div>
      
    </div>
  );
}