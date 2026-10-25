/**
 * Organigramme de départ, repris du PDF "FIRE DEPT, LOS SANTOS — DATABASE".
 * Utilisé une seule fois par `npm run db:seed-org`. Ensuite, tout se modifie
 * depuis le site (bouton EDIT PAGE), ce fichier n'a plus d'importance.
 *
 * Les titulaires sont inscrits en texte libre : il suffit ensuite de glisser
 * le compte de la personne sur la ligne pour le lier.
 */
export type SeedNode = {
  title: string;
  /** Intitulé du poste. Sans titulaire, la ligne s'affiche "Vacant (poste)". */
  role?: string;
  holder?: string;
  note?: string;
  children?: SeedNode[];
};

const vacantCaptain: Pick<SeedNode, "role"> = { role: "Fire Captain" };

export const ORG_SEED: SeedNode[] = [
  {
    title: "OFFICE OF THE FIRE CHIEF",
    role: "Fire Chief",
    holder: "Prescott, Susan",
    children: [
      {
        title: "ADMINISTRATIVE OPERATIONS",
        role: "Deputy Chief",
        children: [
          {
            title: "FIRE PREVENTION & SAFETY BUREAU",
            role: "Fire Marshal/Deputy Chief",
            holder: "Sanders, Peter",
            children: [
              {
                title: "ADMINISTRATIVE SECTION",
                role: "Battalion Chief",
                holder: "Moore, Michael",
                children: [
                  {
                    title: "Legal Unit",
                    ...vacantCaptain,
                    note: "En charge du respect du Code du Feu dans la Ville de Los Santos, afin d'assurer que les bâtiments commerciaux et résidentiels répondent aux normes de sécurité incendie. Prépare les dossiers pénaux concernant les biens non conformes (incluant les cultures et distribution illégales de cannabis, en lien avec sa légalisation). Collabore avec l'Avocat municipal.",
                  },
                  {
                    title: "Cannabis Unit",
                    ...vacantCaptain,
                    note: "En charge de superviser les contrôles en matière de sécurité incendie, d'inventaire de produits chimiques, de redevances de permis et d'approbation d'activité des entreprises liées à la culture et à la vente de cannabis pour la Ville de Los Santos.",
                  },
                ],
              },
              {
                title: "ARSON/COUNTER TERRORISM SECTION",
                role: "Battalion Chief",
                holder: "Hernandez, Pedro",
                children: [
                  { title: "Arson Investigation Unit", role: "Senior Arson Investigator", holder: "Halvorsen, Edward" },
                  {
                    title: "Industrial and Commercial Unit",
                    note: "En charge des vérifications des normes incendies pour les bâtiments commerciaux et industriels dans sa juridiction.",
                  },
                  {
                    title: "Brush Clearance Unit",
                    note: "Vérifie et fait appliquer les notifications de débroussaillage, contrôle les habitations et donne des indications concernant les zones \"sauvages\" appartenant à la Ville.",
                  },
                  {
                    title: "Public Assemblage Unit",
                    note: "En charge des régulations autour des événements (affluence, ...), supervise et autorise les spectacles pyrotechniques, remonte les infractions à l'Avocat municipal.",
                  },
                ],
              },
            ],
          },
          {
            title: "SUPPLY & MAINTENANCE DIVISION",
            role: "Assistant Chief",
            children: [
              {
                title: "MAINTENANCE SECTION",
                role: "Equipment Surintendant, civilian",
                children: [
                  {
                    title: "Field Repair Shop",
                    role: "Equipment Repair Supervisor, civilian",
                    note: "En charge de la maintenance et de la réparation des véhicules généraux du département.",
                  },
                  {
                    title: "Aerial Shop",
                    role: "Equipment Repair Supervisor, civilian",
                    note: "En charge de la maintenance et de la réparation des Trucks et Engines du département.",
                  },
                ],
              },
            ],
          },
          {
            title: "TRAINING DIVISION",
            role: "Assistant Chief",
            children: [
              {
                title: "RECRUIT SERVICE SECTION",
                role: "Battalion Chief",
                children: [
                  {
                    title: "Drill Tower",
                    role: "Fire Captain II/RTO",
                    holder: "Balestra, Paola",
                    note: "Recrutement et sélection des nouveaux pompiers",
                  },
                  {
                    title: "Firefighter Recruitment Service Unit",
                    note: "Formation des nouvelles recrues.\n\nMoins engageant que la gestion académique, pourrait être staffé par ceux qui n'ont pas de div admin pour alléger le processus de recrutement et ne pas tout faire reposer sur les épaules des mêmes personnes tout le recrutement/format",
                  },
                  {
                    title: "In-Service Training Unit/FTO",
                    note: "Formation des pompiers en service actif.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: "ADMINISTRATION BUREAU",
        role: "Deputy Chief",
        children: [
          {
            title: "PROFESSIONAL STANDARDS DIVISION",
            role: "Assistant Chief",
            note: "Affaires internes du département, sous-staffé par des Capitaines et des \"Fire Special Investigator\" en plusieurs unités reliées au PSD directement. Pas de \"sections\" ni d'unités propres.",
          },
          {
            title: "COMMUNITY LIAISON SECTION",
            role: "Public Information Director",
            note: "La Community Liaison Office n'existe plus dans les derniers documents du département, devenue une section dirigée par un Public Information Director. Affaires publiques du département.",
            children: [
              {
                title: "COMMUNITY LIAISON UNIT",
                role: "Fire Captain/PIO",
                note: "Composée de 2 PIO aux dernières nouvelles, et de plusieurs PSO (gestion direct avec les médias pour les demandes sur les urgences, administration des réseaux sociaux). Poste civil possible.",
                children: [
                  {
                    title: "FireStat LS",
                    note: "Gestion des statistiques du département pour publication, transparence. Déjà joué par le passé, souvent salué.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: "EMERGENCY OPERATIONS",
        role: "Deputy Chief",
        children: [
          {
            title: "OPERATIONS CENTRAL BUREAU",
            role: "Deputy Chief",
            children: [
              {
                title: "BATTALION 1",
                role: "Battalion Chief",
                holder: "Wallace, Richard",
                children: [
                  { title: "Fire Station 9 (Davis)", role: "Fire Captain II", holder: "Valenzuela, Teresa" },
                  { title: "Fire Station 52 (Rockford Hills)", ...vacantCaptain },
                ],
              },
              {
                title: "BATTALION 4",
                role: "Battalion Chief",
                children: [
                  { title: "Fire Station 80 (New Empire Way)", ...vacantCaptain },
                  { title: "Fire Station 114 (LSIA)", ...vacantCaptain },
                  { title: "Fire Station 63 (Vespucci)", ...vacantCaptain },
                ],
              },
            ],
          },
          {
            title: "OPERATIONS VALLEY BUREAU",
            role: "Deputy Chief",
            children: [
              {
                title: "BATTALION 10",
                role: "Battalion Chief",
                children: [{ title: "Fire Station 81 (El Burro Heights)", ...vacantCaptain }],
              },
              {
                title: "BATTALION 14",
                role: "Battalion Chief",
                children: [
                  { title: "Fire Station 89 (Paleto Bay)", ...vacantCaptain },
                  { title: "Fire Station 91 (Sandy Shores)", ...vacantCaptain },
                ],
              },
            ],
          },
          {
            title: "EMERGENCY MEDICAL SERVICES BUREAU",
            role: "Deputy Chief",
            children: [
              {
                title: "EMS ADMINISTRATION/TRAINING SECTION",
                role: "Battalion Chief",
                children: [{ title: "EMS Training Unit", role: "Apparatus Operator", holder: "Tsukioka, Emiko" }],
              },
            ],
          },
          {
            title: "SPECIAL OPERATIONS DIVISION",
            role: "Assistant Chief",
            children: [
              {
                title: "AIR OPERATIONS SECTION",
                role: "Battalion Chief",
                children: [{ title: "Air Operations Unit", role: "Fire Pilot V" }],
              },
              {
                title: "DISASTER RESPONSE SECTION",
                role: "Battalion Chief",
                holder: "Wallace, Richard",
                children: [
                  { title: "Urban Search and Rescue Unit", role: "Fire Captain", holder: "Castillo, Gabriel" },
                  { title: "CERT" },
                  { title: "Crew 3" },
                ],
              },
            ],
          },
          { title: "METROPOLITAN FIRE COMMUNICATIONS", role: "Assistant Chief" },
        ],
      },
    ],
  },
];
