"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { createUser, deleteUser, setAdmin, updatePassword, updateUserProfile } from "@/lib/users";
import { UUID_PATTERN, checkPassword, parseNewUser, parseProfileUpdate } from "@/lib/validation";

export type ActionState = {
  error?: string;
  success?: string;
  /**
   * Valeurs saisies, renvoyées en cas d'erreur : sans ça, React vide le
   * formulaire après chaque envoi et il faudrait tout retaper.
   * Le mot de passe n'est jamais renvoyé.
   */
  values?: Record<string, string>;
};

// Chaque action revérifie que l'appelant est modérateur : un formulaire peut
// être appelé sans passer par la page, la page seule ne protège donc pas.

function targetId(formData: FormData): string | null {
  const id = String(formData.get("userId") ?? "");
  return UUID_PATTERN.test(id) ? id : null;
}

function echo(formData: FormData, names: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const name of names) values[name] = String(formData.get(name) ?? "");
  return values;
}

const CREATE_FIELDS = [
  "firstName",
  "lastName",
  "grade",
  "station",
  "username",
  "avatarUrl",
  "phone",
  "isAdmin",
];
const PROFILE_FIELDS = ["firstName", "lastName", "grade", "station", "username", "avatarUrl", "phone"];

export async function createUserAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await assertAdmin();

  const values = echo(formData, CREATE_FIELDS);
  const parsed = parseNewUser(formData);
  if (!parsed.ok) return { error: parsed.error, values };

  const { password, ...rest } = parsed.value;
  const id = await createUser({ ...rest, passwordHash: await hashPassword(password) });
  if (!id) return { error: `L'identifiant « ${rest.username} » existe déjà.`, values };

  revalidatePath("/admin");
  return { success: `Compte « ${rest.username} » créé.` };
}

export async function updateProfileAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await assertAdmin();

  const id = targetId(formData);
  if (!id) return { error: "Utilisateur invalide." };

  const values = echo(formData, PROFILE_FIELDS);
  const parsed = parseProfileUpdate(formData);
  if (!parsed.ok) return { error: parsed.error, values };

  const result = await updateUserProfile(id, parsed.value);
  if (result === "taken") {
    return { error: `L'identifiant « ${parsed.value.username} » est déjà utilisé.`, values };
  }
  if (result === "not_found") return { error: "Utilisateur introuvable.", values };

  revalidatePath("/admin");
  return { success: "Profil mis à jour." };
}

export async function resetPasswordAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await assertAdmin();

  const id = targetId(formData);
  if (!id) return { error: "Utilisateur invalide." };

  const password = String(formData.get("password") ?? "");
  const problem = checkPassword(password);
  if (problem) return { error: problem };

  const updated = await updatePassword(id, await hashPassword(password));
  if (!updated) return { error: "Utilisateur introuvable." };
  return { success: "Mot de passe modifié." };
}

export async function toggleAdminAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await assertAdmin();

  const id = targetId(formData);
  if (!id) return { error: "Utilisateur invalide." };
  if (id === me.id) return { error: "Tu ne peux pas modifier ton propre rôle." };

  const makeAdmin = formData.get("makeAdmin") === "1";
  const done = await setAdmin(id, makeAdmin);
  if (!done) return { error: "Impossible : il doit rester au moins un modérateur." };

  revalidatePath("/admin");
  return { success: makeAdmin ? "Promu modérateur." : "Rôle modérateur retiré." };
}

export async function deleteUserAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const me = await assertAdmin();

  const id = targetId(formData);
  if (!id) return { error: "Utilisateur invalide." };
  if (id === me.id) return { error: "Tu ne peux pas supprimer ton propre compte." };

  const done = await deleteUser(id);
  if (!done) return { error: "Impossible : utilisateur introuvable ou dernier modérateur." };

  revalidatePath("/admin");
  return { success: "Compte supprimé." };
}
