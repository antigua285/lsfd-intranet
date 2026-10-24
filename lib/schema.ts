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
];
