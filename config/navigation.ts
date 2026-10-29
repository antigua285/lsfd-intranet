// src/config/navigation.ts

export const APP_MODULES = [
  { 
    id: 1, 
    title: "Documentation & Protocoles", 
    desc: "Ressources pédagogiques du département", 
    link: "/documents",
    image: "/images/docs.png",
    // Chemin SVG (l'intérieur de la balise <svg>) pour garder les icônes dynamiques
    iconPath: "M7 4.5h13a1 1 0 0 1 1 1V10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1zM9.5 4.5V11M12.5 7.75h5M4 12.5h13a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.5a1 1 0 0 1 1-1zM6.5 12.5V19M9.5 15.75h5"
  },
  { 
    id: 2, 
    title: "Organisation", 
    desc: "Charte organisationnelle et personnel", 
    link: "/organization",
    image: "/images/organization.png",
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
  {
    id: 5,
    title: "Carte du département",
    desc: "Informations relatives aux secteurs et infrastructures",
    link: "/map",
    image: "/images/opmap.png",
    iconPath: "M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
  },
  {
    id: 6,
    title: "Rapports & Formulaires",
    desc: "Remplissage de rapports et formulaires",
    link: "/forms",
    image: "/images/flags.png",
    iconPath: "M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75"
  },
  {
    id: 7,
    title: "Formation",
    desc: "Espace FTC et probatoires",
    link: "/training",
    image: "/images/trn.png",
    iconPath: "M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
  },
  {
    id: 8,
    title: "Drill Tower",
    desc: "Calendrier des formations et révisions",
    link: "/drill-tower",
    image: "/images/drilltower.png",
    iconPath: "M12 3v3m0 0 3 2.25M12 6 9 8.25M6.75 21V10.5h10.5V21M9.75 21v-4.5h4.5V21M9 12.75h.008v.008H9v-.008Zm3 0h.008v.008H12v-.008Zm3 0h.008v.008H15v-.008Z"
  },
  // Tu pourras ajouter la suite des modules ici de la même manière...
];