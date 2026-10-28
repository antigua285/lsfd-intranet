"use client";

import Link from "next/link";
import { useState } from "react";

// Structure de test pour tes futurs manuels
const DOCUMENT_CATEGORIES = [
  {
    id: "admin",
    title: "ADMINISTRATIVE & HR",
    documents: [
      { id: 10, title: "INTERNAL REGULATION & ETHICAL AND MORAL STANDARDS", date: "2024", type: "DOC", link: "/documents/ethics" },
      { id: 11, title: "RADIO PROCEDURES", date: "2025", type: "DOC", link: "/documents/radio" },
      { id: 12, title: "UNIFORM SPECIFICATION", date: "2023", type: "DOC", link: "/documents/uniform" },
    ]
  },
  {
    id: "ems",
    title: "EMS MATERIAL",
    documents: [
      { id: 1, title: "B1 - PREHOSPITAL CARE TREATMENT - GENERAL PATIENT CARE", date: "2026", type: "PDF", link: "/documents/book1" },
      { id: 2, title: "B2 - PREHOSPITAL CARE TREATMENT - TREATMENT PROTOCOLS", date: "2026", type: "PDF", link: "/documents/book2" },
      { id: 3, title: "B3 - PREHOSPITAL CARE TREATMENT - PARAMEDIC", date: "2026", type: "PDF", link: "/documents/book3" },
      { id: 4, title: "B4 - PREHOSPITAL CARE TREATMENT - MASS CASUALTY INCIDENTS", date: "2026", type: "PDF", link: "/documents/book4" },
    ]
  },
  {
    id: "fire",
    title: "FIRE SUPPRESSION & RESCUE",
    documents: [
      { id: 5, title: "B5 - GENERAL OPERATIONS", date: "2025", type: "PDF", link: "/documents/fire1" },
      { id: 6, title: "B6 - STRATEGIES & SECURITY", date: "2026", type: "PDF", link: "/documents/fire2" },
      { id: 7, title: "B7 - VENTILATION TECHNIQUES", date: "2026", type: "PDF", link: "/documents/fire3" },
      { id: 8, title: "B8 - SEARCH & RESCUE", date: "2026", type: "PDF", link: "/documents/fire4" },
      { id: 9, title: "B9 - OPERATIONAL SPECIFICITIES", date: "2026", type: "PDF", link: "/documents/fire5" },
      { id: 13, title: "B10 - VEHICLE RESCUE", date: "2026", type: "PDF", link: "/documents/vehiclerescue" },
    ]
  }
];

// Composant réutilisable pour chaque catégorie (Accordéon)
function CategoryAccordion({ category }: { category: typeof DOCUMENT_CATEGORIES[0] }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-3 border border-slate-300 rounded bg-white overflow-hidden shadow-sm font-['Calibri','Arial',sans-serif]">
      {/* En-tête cliquable */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-3"
      >
        <span className="font-bold text-slate-800 text-[14px] tracking-wide">{category.title}</span>
        
        {/* Icône Chevron dynamique */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2} 
          stroke="currentColor" 
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Liste des documents (visible si isOpen est true) */}
      {isOpen && (
        <div className="border-t border-slate-200">
          <ul className="flex flex-col">
            {category.documents.map((doc) => (
              <li key={doc.id} className="border-b border-slate-100 last:border-0">
                <Link 
                  href={doc.link}
                  className="flex justify-between items-center px-4 py-2.5 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {/* Icône de fichier */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-600 group-hover:text-red-700">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="text-[13px] text-slate-700 font-medium group-hover:text-slate-900">{doc.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{doc.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Page principale
export default function DocumentsPage() {
  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      {/* En-tête de la page */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 font-['Calibri','Arial',sans-serif] uppercase">Documents & Protocols</h1>
        <p className="text-sm text-slate-500 font-['Calibri','Arial',sans-serif]">
          Central repository for all LSFD manuals, SOPs, and administrative forms.
        </p>
      </div>

      {/* Zone de recherche spécifique aux documents (Optionnel mais très utile) */}
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Filter documents by name or keyword..." 
          className="w-full p-2 border border-slate-300 rounded shadow-sm text-sm font-['Calibri','Arial',sans-serif] focus:outline-none focus:border-slate-500"
        />
      </div>

      {/* Affichage dynamique des catégories */}
      <div className="flex flex-col">
        {DOCUMENT_CATEGORIES.map((category) => (
          <CategoryAccordion key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}