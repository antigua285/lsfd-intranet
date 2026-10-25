/**
 * Structure de la base. Chaque élément est UNE instruction SQL
 * (le driver HTTP de Neon n'accepte pas plusieurs instructions d'un coup).
 * Sans danger si relancé : tout est en "IF NOT EXISTS".
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username        text NOT NULL,
    password_hash   text NOT NULL,
    first_name      text NOT NULL,
    last_name       text NOT NULL,
    grade           text NOT NULL,
    station         text NOT NULL,
    avatar_url      text,
    is_admin        boolean NOT NULL DEFAULT false,
    failed_attempts integer NOT NULL DEFAULT 0,
    locked_until    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
  )`,
  // Identifiant unique sans tenir compte des majuscules ("Dupont" = "dupont").
  `CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (lower(username))`,
  // Numéro de téléphone (facultatif). Ajouté après coup : cette ligne met aussi
  // à jour une base existante, sans toucher aux comptes déjà créés.
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text`,

  // Organigramme : un arbre. Chaque ligne a un parent (NULL = tout en haut) et un
  // rang parmi ses "frères". Le niveau d'affichage (noir, orange, gras...) se
  // déduit de la profondeur dans l'arbre, il n'est pas stocké.
  `CREATE TABLE IF NOT EXISTS org_nodes (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id      uuid REFERENCES org_nodes(id) ON DELETE CASCADE,
    position       integer NOT NULL DEFAULT 0,
    title          text NOT NULL,
    role           text NOT NULL DEFAULT '',
    holder_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    holder_name    text,
    note           text,
    created_at     timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS org_nodes_parent_idx ON org_nodes (parent_id, position)`,

  // Carte interactive. Les positions sont des FRACTIONS de l'image (0 = bord
  // gauche / haut, 1 = bord droit / bas) : si tu remplaces map.png par une image
  // d'une autre taille, les points restent au bon endroit.
  // "kind" n'est volontairement pas verrouillé en base : on pourra ajouter de
  // nouveaux types de points sans migration.
  `CREATE TABLE IF NOT EXISTS map_features (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind       text NOT NULL,
    name       text NOT NULL,
    x          double precision NOT NULL CHECK (x BETWEEN 0 AND 1),
    y          double precision NOT NULL CHECK (y BETWEEN 0 AND 1),
    details    jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS map_features_kind_idx ON map_features (kind)`,
  // Zones (bataillons, bureaux...) : un polygone = liste de sommets [x, y].
  `CREATE TABLE IF NOT EXISTS map_zones (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind       text NOT NULL,
    name       text NOT NULL,
    color      text NOT NULL DEFAULT '#2563eb',
    points     jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Un bureau peut être un ASSEMBLAGE de bataillons : "members" = liste des
  // identifiants des bataillons. NULL = zone classique avec son propre tracé.
  `ALTER TABLE map_zones ADD COLUMN IF NOT EXISTS members jsonb`,

  // Formulaires : la structure (champs, règles carte) est une description stockée en
  // JSON, pas du code. Un formulaire = en-tête (titre, sous-titre...) + définition.
  `CREATE TABLE IF NOT EXISTS forms (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title        text NOT NULL,
    subtitle     text NOT NULL DEFAULT '',
    header_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
    footer       text NOT NULL DEFAULT '',
    definition   jsonb NOT NULL,
    published    boolean NOT NULL DEFAULT false,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
  )`,
  // Rapports reçus. On garde une COPIE du formulaire tel qu'il était à l'envoi
  // (form_snapshot) : modifier ou supprimer le formulaire plus tard ne change pas les
  // rapports déjà envoyés.
  `CREATE TABLE IF NOT EXISTS form_submissions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id        uuid REFERENCES forms(id) ON DELETE SET NULL,
    form_title     text NOT NULL,
    form_snapshot  jsonb NOT NULL,
    answers        jsonb NOT NULL,
    labels         jsonb NOT NULL DEFAULT '{}'::jsonb,
    summary        text NOT NULL DEFAULT '',
    submitted_by   uuid REFERENCES users(id) ON DELETE SET NULL,
    submitter_name text NOT NULL,
    status         text NOT NULL DEFAULT 'new',
    effects        jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at     timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS form_submissions_form_idx ON form_submissions (form_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS form_submissions_date_idx ON form_submissions (created_at DESC)`,
  // Quels rapports concernent quel point de la carte (historique d'une borne, etc.).
  `CREATE TABLE IF NOT EXISTS map_feature_reports (
    feature_id    uuid NOT NULL REFERENCES map_features(id) ON DELETE CASCADE,
    submission_id uuid NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    created_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (feature_id, submission_id)
  )`,
];
