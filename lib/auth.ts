import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session";
import { getUserById, type PublicUser } from "./users";

/**
 * Utilisateur connecté, relu en base à chaque requête : si un compte est
 * supprimé, il perd immédiatement l'accès aux pages dynamiques (profil, admin).
 */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const session = await readSession();
  if (!session) return null;
  return getUserById(session.userId);
});

/** Pour les pages : renvoie vers /login si personne n'est connecté. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Pour les pages admin : renvoie vers l'accueil si l'utilisateur n'est pas modérateur. */
export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  return user;
}

/**
 * Pour les actions de formulaire (qui peuvent être appelées directement,
 * sans passer par la page) : on revérifie TOUJOURS les droits côté serveur.
 */
export async function assertAdmin(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) throw new Error("Accès refusé.");
  return user;
}

export async function assertUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Session expirée, reconnecte-toi.");
  return user;
}
