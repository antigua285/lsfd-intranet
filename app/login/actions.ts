"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";
import { verifyPassword, verifyAgainstDummy } from "@/lib/password";
import {
  findLoginRecord,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/lib/users";
import { normalizeUsername, safeNextPath } from "@/lib/validation";

export type LoginState = { error?: string };

// Même message dans tous les cas d'échec : on ne révèle pas si l'identifiant existe.
const GENERIC_ERROR =
  "Identifiant ou mot de passe incorrect (ou compte temporairement verrouillé).";

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!username || !password || username.length > 64 || password.length > 128) {
    return { error: GENERIC_ERROR };
  }

  const record = await findLoginRecord(username);

  if (!record || record.locked) {
    await verifyAgainstDummy(password); // même durée de réponse que pour un vrai compte
    return { error: GENERIC_ERROR };
  }

  if (!(await verifyPassword(password, record.passwordHash))) {
    await recordFailedLogin(record.id);
    return { error: GENERIC_ERROR };
  }

  await recordSuccessfulLogin(record.id);
  await createSession(record.id);
  redirect(next);
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
