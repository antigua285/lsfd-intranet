export function OfficialBanner() {
  return (
    <div className="bg-[#0d2644] text-white flex justify-between items-center px-5 py-2 text-[13px] font-sans">
      
      {/* Partie Gauche : Sceau et Texte */}
      <div className="flex items-center gap-2">
        <img 
          src="https://i.imgur.com/z8yAfpK.png" 
          alt="Seal of Los Santos" 
          className="w-5 h-auto object-contain align-middle" 
        />
        <span>An Official Website of the City of Los Santos</span>
      </div>

      {/* Partie Droite : Boutons vers le forum */}
      <div className="flex items-center gap-1.5">
        <a 
          href="https://forum-fr.gta.world/topic/28698-myls311-portail-des-services-municipaux/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-transparent text-white border border-white px-2.5 py-1 rounded-[3px] text-xs no-underline inline-block hover:bg-white hover:text-[#0d2644] transition-colors"
        >
          City Services
        </a>
        <a 
          href="https://forum-fr.gta.world/topic/28656-composition-du-gouvernement-de-la-ville-et-du-comt%C3%A9-de-los-santos/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-transparent text-white border border-white px-2.5 py-1 rounded-[3px] text-xs no-underline inline-block hover:bg-white hover:text-[#0d2644] transition-colors"
        >
          City Directory
        </a>
      </div>

    </div>
  );
}