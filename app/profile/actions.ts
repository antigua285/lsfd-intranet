"use server";

import { assertUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getPasswordHash, updatePassword } from "@/lib/users";
import { checkPassword } from "@/lib/validation";

export type PasswordState = { error?: string; success?: string };

export async function changeOwnPassword(
  _previous: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const user = await assertUser();

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");

  const storedHash = await getPasswordHash(user.id);
  if (!storedHash || !(await verifyPassword(current, storedHash))) {
    return { error: "Le mot de passe actuel est incorrect." };
  }

  const problem = checkPassword(next);
  if (problem) return { error: problem };
  if (next !== confirmation) return { error: "Les deux nouveaux mots de passe ne correspondent pas." };
  if (next === current) return { error: "Le nouveau mot de passe doit être différent de l'ancien." };

  await updatePassword(user.id, await hashPassword(next));
  return { success: "Mot de passe modifié." };
}
