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
  // Flags d'accès : un flag = une permission (ex. ACTS). Les comptes en reçoivent,
  // les catégories du site et les formulaires en exigent (au moins un).
  `CREATE TABLE IF NOT EXISTS flags (
    code        text PRIMARY KEY,
    name        text NOT NULL,
    description text NOT NULL DEFAULT '',
    created_at  timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS user_flags (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flag    text NOT NULL REFERENCES flags(code) ON DELETE CASCADE,
    PRIMARY KEY (user_id, flag)
  )`,
  // Réglages des catégories du dashboard (le contenu des catégories reste dans le code).
  // flags vide = catégorie ouverte à tous ; position NULL = ordre du code.
  `CREATE TABLE IF NOT EXISTS module_access (
    module_key text PRIMARY KEY,
    flags      text[] NOT NULL DEFAULT '{}',
    position   integer
  )`,
  `ALTER TABLE forms ADD COLUMN IF NOT EXISTS flags text[] NOT NULL DEFAULT '{}'`,
  // Copie des flags du formulaire sur chaque rapport (reste valable si le formulaire est supprimé).
  `ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS form_flags text[] NOT NULL DEFAULT '{}'`,
  // Formation : cartes de révision (question au recto, réponse au verso).
  `CREATE TABLE IF NOT EXISTS flashcards (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic      text NOT NULL DEFAULT '',
    question   text NOT NULL,
    answer     text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Formation : examens sur mesure. La clé d'accès n'est stockée que hachée.
  `CREATE TABLE IF NOT EXISTS exams (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title             text NOT NULL,
    description       text NOT NULL DEFAULT '',
    duration_minutes  integer,
    threshold_percent integer,
    max_attempts      integer NOT NULL DEFAULT 1,
    published         boolean NOT NULL DEFAULT false,
    key_hash          text,
    questions         jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
  )`,
  // Images des questions (base64) : pas de disque sur Vercel.
  `CREATE TABLE IF NOT EXISTS exam_images (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mime       text NOT NULL,
    data       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Un passage d'examen. exam_snapshot = copie de l'examen tel qu'il était au démarrage
  // (avec les bonnes réponses : ne JAMAIS l'envoyer tel quel au candidat).
  `CREATE TABLE IF NOT EXISTS exam_attempts (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id      uuid REFERENCES exams(id) ON DELETE SET NULL,
    exam_title   text NOT NULL,
    user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
    candidate    jsonb NOT NULL,
    snapshot     jsonb NOT NULL,
    answers      jsonb NOT NULL DEFAULT '{}'::jsonb,
    status       text NOT NULL DEFAULT 'in_progress',
    started_at   timestamptz NOT NULL DEFAULT now(),
    deadline     timestamptz,
    submitted_at timestamptz,
    grades       jsonb NOT NULL DEFAULT '{}'::jsonb,
    verdict      text,
    comment      text NOT NULL DEFAULT '',
    graded_by    uuid REFERENCES users(id) ON DELETE SET NULL,
    grader_name  text NOT NULL DEFAULT '',
    sent_at      timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS exam_attempts_user_idx ON exam_attempts (user_id, started_at DESC)`,
  `CREATE INDEX IF NOT EXISTS exam_attempts_status_idx ON exam_attempts (status, submitted_at DESC)`,
  // Clé d'accès lisible par la TD (transmission rapide). Les anciens examens n'ont que key_hash.
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS access_key text`,
  // Qui peut passer quel examen (assigné par la TD ou un modérateur).
  `CREATE TABLE IF NOT EXISTS exam_assignments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id     uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (exam_id, user_id)
  )`,
];
