// src/config/navigation.ts

export const APP_MODULES = [
  { 
    id: 1, 
    title: "Documentation & Protocoles", 
    desc: "Ressources pédagogiques du département", 
    link: "/documents",
    image: "/images/docs.png",
    // Chemin SVG (l'intérieur de la balise <svg>) pour garder les icônes dynamiques
    iconPath: "M7 4.5h13a1 1 0 0 1 1 1V10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1zM9.5 4.5V11M12.5 7.75h5M4 12.5h13a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.5a1 1 0 0 1 1-1zM6.5 12.5V₁₉M9.5 ₁₅.75h5"
  },
  { 
    id: 2, 
    title: "Organisation", 
    desc: "Charte organisationnelle et personnel", 
    link: "/organization",
    image: "/images/tag.png",
    // Chemin SVG (l'intérieur de la balise <svg>) pour garder les icônes dynamiques
    iconPath: "M3.75 6A2.25 2.25 0 0 1 6 3.75h1.5M20.25 6A2.25 2.25 0 0 0 18 3.75h-1.5M3.75 18A2.25 2.25 0 0 0 6 20.25h1.5M20.25 18A2.25 2.25 0 0 1 18 20.25h-1.5M9 11.25v1.5c0 1.243 1.119 2.25 2.5 2.25h1c1.381 0 2.5-1.007 2.5-2.25v-1.5m0 0c0-1.243-1.119-2.25-2.5-2.25h-1c-1.381 0-2.5 1.007-2.5 2.25Z"
  },
  { 
    id: 3, 
    title: "Medilog", 
    desc: "Accéder à l'application Medilog", 
    link: "https://lsfd-medilog.duckdns.org/",
    image: "/images/medilog.png",
    iconPath: "M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
  },
  // Tu pourras ajouter la suite des modules ici de la même manière...
];