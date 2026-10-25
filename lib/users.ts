import { query } from "./db";

/** Ce qu'on a le droit d'afficher d'un utilisateur. Jamais le mot de passe. */
export type PublicUser = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  grade: string;
  station: string;
  avatarUrl: string | null;
  phone: string | null;
  isAdmin: boolean;
  createdAt: Date;
};

const PUBLIC_COLUMNS = `
  id,
  username,
  first_name AS "firstName",
  last_name AS "lastName",
  grade,
  station,
  avatar_url AS "avatarUrl",
  phone,
  is_admin AS "isAdmin",
  created_at AS "createdAt"`;

export async function getUserById(id: string): Promise<PublicUser | null> {
  const rows = await query<PublicUser>(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listUsers(): Promise<PublicUser[]> {
  return query<PublicUser>(
    `SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY is_admin DESC, last_name, first_name`
  );
}

/* ------------------------------ Connexion ------------------------------ */

export type LoginRecord = {
  id: string;
  passwordHash: string;
  locked: boolean;
};

export async function findLoginRecord(username: string): Promise<LoginRecord | null> {
  const rows = await query<LoginRecord>(
    `SELECT id,
            password_hash AS "passwordHash",
            (locked_until IS NOT NULL AND locked_until > now()) AS locked
       FROM users
      WHERE lower(username) = lower($1)`,
    [username]
  );
  return rows[0] ?? null;
}

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

/** 5 échecs d'affilée => compte verrouillé 15 minutes. */
export async function recordFailedLogin(id: string): Promise<void> {
  await query(
    `UPDATE users
        SET locked_until = CASE WHEN failed_attempts + 1 >= $2
                                THEN now() + make_interval(mins => $3)
                                ELSE locked_until END,
            failed_attempts = CASE WHEN failed_attempts + 1 >= $2
                                   THEN 0
                                   ELSE failed_attempts + 1 END
      WHERE id = $1`,
    [id, MAX_FAILED_ATTEMPTS, LOCK_MINUTES]
  );
}

export async function recordSuccessfulLogin(id: string): Promise<void> {
  await query(`UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`, [id]);
}

export async function getPasswordHash(id: string): Promise<string | null> {
  const rows = await query<{ passwordHash: string }>(
    `SELECT password_hash AS "passwordHash" FROM users WHERE id = $1`,
    [id]
  );
  return rows[0]?.passwordHash ?? null;
}

/* ----------------------------- Administration ----------------------------- */

export type NewUser = {
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  grade: string;
  station: string;
  avatarUrl: string | null;
  /** Facultatif */
  phone?: string | null;
  isAdmin: boolean;
};

/** Renvoie l'id créé, ou null si l'identifiant existe déjà. */
export async function createUser(user: NewUser): Promise<string | null> {
  const rows = await query<{ id: string }>(
    `INSERT INTO users (username, password_hash, first_name, last_name, grade, station, avatar_url, is_admin, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      user.username,
      user.passwordHash,
      user.firstName,
      user.lastName,
      user.grade,
      user.station,
      user.avatarUrl,
      user.isAdmin,
      user.phone ?? null,
    ]
  );
  return rows[0]?.id ?? null;
}

export type ProfileFields = {
  username: string;
  firstName: string;
  lastName: string;
  grade: string;
  station: string;
  avatarUrl: string | null;
  phone: string | null;
};

/**
 * Modifie les informations d'un profil. Renvoie :
 *  - "ok"        : enregistré ;
 *  - "taken"     : l'identifiant est déjà utilisé par un autre compte ;
 *  - "not_found" : le compte n'existe plus.
 * Le mot de passe et le rôle ne sont jamais touchés ici.
 */
export async function updateUserProfile(
  id: string,
  fields: ProfileFields
): Promise<"ok" | "taken" | "not_found"> {
  try {
    const rows = await query<{ id: string }>(
      `UPDATE users
          SET username = $2,
              first_name = $3,
              last_name = $4,
              grade = $5,
              station = $6,
              avatar_url = $7,
              phone = $8
        WHERE id = $1
          AND NOT EXISTS (
            SELECT 1 FROM users WHERE lower(username) = lower($2) AND id <> $1
          )
        RETURNING id`,
      [
        id,
        fields.username,
        fields.firstName,
        fields.lastName,
        fields.grade,
        fields.station,
        fields.avatarUrl,
        fields.phone,
      ]
    );
    if (rows.length > 0) return "ok";
  } catch (error) {
    // Filet de sécurité : deux modifications simultanées du même identifiant
    if ((error as { code?: string }).code === "23505") return "taken";
    throw error;
  }
  // Aucune ligne modifiée : soit l'identifiant est pris, soit le compte n'existe plus
  return (await getUserById(id)) ? "taken" : "not_found";
}

export async function updatePassword(id: string, passwordHash: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE users
        SET password_hash = $2, failed_attempts = 0, locked_until = NULL
      WHERE id = $1
      RETURNING id`,
    [id, passwordHash]
  );
  return rows.length > 0;
}

/** Refuse (renvoie false) si c'est le dernier modérateur : on ne se verrouille jamais dehors. */
export async function deleteUser(id: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `DELETE FROM users
      WHERE id = $1
        AND (is_admin = false OR (SELECT count(*) FROM users WHERE is_admin) > 1)
      RETURNING id`,
    [id]
  );
  return rows.length > 0;
}

/** Même protection : impossible de retirer le dernier modérateur. */
export async function setAdmin(id: string, isAdmin: boolean): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE users
        SET is_admin = $2
      WHERE id = $1
        AND ($2 = true OR is_admin = false OR (SELECT count(*) FROM users WHERE is_admin) > 1)
      RETURNING id`,
    [id, isAdmin]
  );
  return rows.length > 0;
}

export async function countAdmins(): Promise<number> {
  const rows = await query<{ count: number }>(
    `SELECT count(*)::int AS count FROM users WHERE is_admin`
  );
  return rows[0]?.count ?? 0;
}
