// Dashboard divisionnaire : une entrée par division / unité.
// Une division n'apparaît que pour les comptes qui ont AU MOINS UN des flags listés (les modérateurs voient tout).
// Un compte sans aucun flag divisionnaire ne voit rien sous le dashboard principal, pas même le séparateur.

export type DivisionModule = {
  /** Identifiant stable (sert de clé). */
  key: string;
  title: string;
  desc: string;
  link: string;
  /** Logo à déposer dans public/divisions/ (PNG, idéalement carré, fond transparent). */
  logo: string;
  /** Sigle affiché si le logo n'est pas encore déposé. */
  initials: string;
  /** Image de fond facultative de la tuile (public/divisions/…). Sans image : fond uni sombre. */
  image?: string;
  /** Flags qui donnent accès à la division. */
  flags: string[];
};

export const DIVISION_MODULES: DivisionModule[] = [
  {
    key: "airops",
    title: "Air Operations Section",
    desc: "Carnets de vol, formulaires et préparation des vols",
    link: "/airops",
    logo: "/divisions/airops.png",
    initials: "AOS",
    flags: ["AIROPS", "AIROPSCMD"],
  },
  // Prochaines divisions : copier le bloc ci-dessus avec ses propres flags.
];
