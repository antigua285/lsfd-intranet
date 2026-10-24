"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { createUser, deleteUser, setAdmin, updatePassword } from "@/lib/users";
import { UUID_PATTERN, checkPassword, parseNewUser } from "@/lib/validation";

export type ActionState = { error?: string; success?: string };

// Chaque action revérifie que l'appelant est modérateur : un formulaire peut
// être appelé sans passer par la page, la page seule ne protège donc pas.

function targetId(formData: FormData): string | null {
  const id = String(formData.get("userId") ?? "");
  return UUID_PATTERN.test(id) ? id : null;
}

export async function createUserAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await assertAdmin();

  const parsed = parseNewUser(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { password, ...rest } = parsed.value;
  const id = await createUser({ ...rest, passwordHash: await hashPassword(password) });
  if (!id) return { error: `L'identifiant « ${rest.username} » existe déjà.` };

  revalidatePath("/admin");
  return { success: `Compte « ${rest.username} » créé.` };
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
