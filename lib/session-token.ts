import { SignJWT, jwtVerify } from "jose";

/**
 * Jeton de session signé (JWT) stocké dans un cookie.
 * Ce fichier n'utilise que `jose` : il peut donc être importé par proxy.ts.
 *
 * Durée de la session : modifie SESSION_HOURS si tu veux plus court/long.
 * Astuce d'urgence : changer AUTH_SECRET déconnecte immédiatement tout le monde.
 */
export const SESSION_COOKIE = "lsfd_session";
export const SESSION_HOURS = 24;
export const SESSION_MAX_AGE_SECONDS = SESSION_HOURS * 60 * 60;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET est manquant ou trop court (32 caractères minimum). " +
        "Génère-en un avec : node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\""
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());
}

/** Renvoie l'id de l'utilisateur si le jeton est valide, sinon null. */
export async function verifySessionToken(
  token: string | undefined
): Promise<{ userId: string } | null> {
  const key = secretKey(); // lève une erreur claire si la config est mauvaise
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? { userId: payload.sub } : null;
  } catch {
    return null; // signature invalide, jeton expiré ou falsifié
  }
}
