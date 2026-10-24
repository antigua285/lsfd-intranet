import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import type { ScryptOptions } from "node:crypto";

/**
 * Hachage des mots de passe avec scrypt (intégré à Node, aucune dépendance).
 * Le mot de passe n'est JAMAIS stocké : on stocke une empreinte irréversible.
 * Format stocké : scrypt$N$r$p$sel$empreinte (les paramètres sont inclus pour
 * pouvoir les renforcer plus tard sans casser les anciens comptes).
 */
const N = 65536; // coût CPU/mémoire (~64 Mo)
const R = 8;
const P = 2;
const KEY_LENGTH = 64;
const MAX_MEMORY = 256 * 1024 * 1024;
const MAX_INPUT_LENGTH = 1024;

function derive(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password.normalize("NFKC"), salt, keyLength, options, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, KEY_LENGTH, {
    N,
    r: R,
    p: P,
    maxmem: MAX_MEMORY,
  });
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (password.length > MAX_INPUT_LENGTH) return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![n, r, p].every((v) => Number.isInteger(v) && v > 0)) return false;

  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  if (salt.length === 0 || expected.length === 0) return false;

  const key = await derive(password, salt, expected.length, {
    N: n,
    r,
    p,
    maxmem: MAX_MEMORY,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

let dummyHash: Promise<string> | null = null;

/**
 * Fait un calcul de hachage "pour rien" quand l'identifiant n'existe pas, afin
 * que la réponse prenne le même temps que pour un vrai compte (on ne révèle
 * pas quels identifiants existent).
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword("mot-de-passe-factice-pour-egaliser-le-temps");
  await verifyPassword(password, await dummyHash);
  return false;
}
