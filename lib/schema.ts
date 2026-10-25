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
];
