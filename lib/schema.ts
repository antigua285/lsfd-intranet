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
  // Pièces jointes d'un rapport : liste de { url, caption } (liens d'images, jamais de fichiers).
  `ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb`,
  // Formation : cartes de révision (question au recto, réponse au verso).
  `CREATE TABLE IF NOT EXISTS flashcards (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic      text NOT NULL DEFAULT '',
    question   text NOT NULL,
    answer     text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Drill Tower (académie des recrues) : promotions, appartenance, calendrier des formations.
  // DTRECRUIT = recrue en académie ; la catégorie « drill-tower » est réservée à DTRECRUIT + TD (modifiable dans Accès & flags).
  `INSERT INTO flags (code, name, description) VALUES
     ('DTRECRUIT', 'Recrue Drill Tower', 'Recrue en académie : accède uniquement à la catégorie Drill Tower'),
     ('PROB', 'Probation', 'Pompier en probation : possède un carnet de probation')
   ON CONFLICT (code) DO NOTHING`,
  `INSERT INTO module_access (module_key, flags) VALUES ('drill-tower', ARRAY['DTRECRUIT','TD']) ON CONFLICT (module_key) DO NOTHING`,
  `CREATE TABLE IF NOT EXISTS drill_cohorts (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name         text NOT NULL,
    starts_on    date,
    graduated_at timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS drill_members (
    user_id   uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    cohort_id uuid NOT NULL REFERENCES drill_cohorts(id) ON DELETE CASCADE,
    added_at  timestamptz NOT NULL DEFAULT now(),
    graduated_at timestamptz
  )`,
  `CREATE TABLE IF NOT EXISTS drill_events (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text NOT NULL,
    description text NOT NULL DEFAULT '',
    starts_at   timestamptz NOT NULL,
    ends_at     timestamptz,
    location    text NOT NULL DEFAULT '',
    instructor  text NOT NULL DEFAULT '',
    mandatory   boolean NOT NULL DEFAULT false,
    canceled    boolean NOT NULL DEFAULT false,
    cohort_id   uuid REFERENCES drill_cohorts(id) ON DELETE CASCADE,
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS drill_events_start_idx ON drill_events (starts_at)`,
  // Formation par flags : « gérée par » (qui peut modifier / corriger) et « visible par » (qui peut réviser).
  // Liste vide = comportement d'origine (toute la TD gère ; tout le monde révise).
  `ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS flags text[] NOT NULL DEFAULT '{}'`,
  `ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS manage_flags text[] NOT NULL DEFAULT '{}'`,
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
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS manage_flags text[] NOT NULL DEFAULT '{}'`,
  // Examens pratiques : remplis par l'instructeur (kind = 'practical'), sans clé ni chronomètre.
  `ALTER TABLE exams ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'written'`,
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
  // Probation : modèle unique (catégories + checklists), un carnet par pompier en probation.
  `CREATE TABLE IF NOT EXISTS probation_template (
    id         smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    categories jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  // checked = { "<id compétence>": { by, at } }. snapshot = modèle + cases figés à l'archivage.
  `CREATE TABLE IF NOT EXISTS probation_notebooks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
    owner_name  text NOT NULL,
    checked     jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    archived_at timestamptz,
    archived_by text NOT NULL DEFAULT '',
    snapshot    jsonb
  )`,
  `CREATE INDEX IF NOT EXISTS probation_notebooks_user_idx ON probation_notebooks (user_id)`,
  `CREATE TABLE IF NOT EXISTS probation_comments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id uuid NOT NULL REFERENCES probation_notebooks(id) ON DELETE CASCADE,
    author_id   uuid REFERENCES users(id) ON DELETE SET NULL,
    author_name text NOT NULL,
    body        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS probation_comments_nb_idx ON probation_comments (notebook_id, created_at)`,
  // Bornes incendie : ID automatique à 5 chiffres (colonne "code") et nom unique.
  `ALTER TABLE map_features ADD COLUMN IF NOT EXISTS code text`,
  // Avant de poser l'unicité, on renomme les doublons existants : « Nom », « Nom (2) », « Nom (3) »…
  `UPDATE map_features f SET name = f.name || ' (' || d.rn || ')'
     FROM (SELECT id, row_number() OVER (PARTITION BY lower(name) ORDER BY created_at, id) AS rn
             FROM map_features WHERE kind = 'hydrant') d
    WHERE f.id = d.id AND d.rn > 1`,
  // Les bornes déjà placées reçoivent leur ID (une seule fois : seulement celles qui n'en ont pas encore).
  `UPDATE map_features f SET code = lpad((d.rn + d.base)::text, 5, '0')
     FROM (SELECT id,
                  row_number() OVER (ORDER BY created_at, id) AS rn,
                  (SELECT COALESCE(MAX(code::int), 0) FROM map_features WHERE kind = 'hydrant' AND code ~ '^[0-9]{1,5}$') AS base
             FROM map_features WHERE kind = 'hydrant' AND code IS NULL) d
    WHERE f.id = d.id`,
  `CREATE UNIQUE INDEX IF NOT EXISTS map_features_hydrant_code_uniq ON map_features (code) WHERE kind = 'hydrant'`,
  `CREATE UNIQUE INDEX IF NOT EXISTS map_features_hydrant_name_uniq ON map_features (lower(name)) WHERE kind = 'hydrant'`,
];
