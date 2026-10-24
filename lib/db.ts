import { neon } from "@neondatabase/serverless";

/**
 * Accès à la base Neon (Postgres) via HTTP : adapté à Vercel (serverless),
 * pas de connexion qui reste ouverte.
 *
 * L'intégration Vercel <-> Neon injecte DATABASE_URL (et POSTGRES_URL).
 * En local, `vercel env pull .env.local` les récupère.
 */
function connectionString(): string {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL est introuvable. Connecte la base Neon au projet Vercel, " +
        "puis lance `vercel env pull .env.local`."
    );
  }
  return url;
}

/**
 * Exécute une requête SQL paramétrée ($1, $2...). Les valeurs ne sont JAMAIS
 * collées dans le texte SQL : c'est ce qui empêche les injections SQL.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const sql = neon(connectionString());
  const rows = await sql.query(text, params);
  return rows as T[];
}
