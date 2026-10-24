/**
 * Installation de la base : crée les tables, puis le compte administrateur
 * central s'il n'en existe pas encore. Sans danger si relancé.
 *
 *   npm run db:setup
 *
 * Les questions sont posées dans le terminal. Le mot de passe n'est ni affiché
 * ni enregistré en clair : seule son empreinte va dans la base.
 */
import { createInterface } from "node:readline/promises";
import { query } from "../lib/db";
import { SCHEMA_STATEMENTS } from "../lib/schema";
import { hashPassword } from "../lib/password";
import { countAdmins, createUser } from "../lib/users";
import {
  checkPassword,
  checkUsername,
  normalizeUsername,
  parseAvatarUrl,
  parseShortText,
} from "../lib/validation";

async function ask(label: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(label)).trim();
  } finally {
    rl.close();
  }
}

/** Saisie masquée (rien ne s'affiche pendant la frappe). */
function askHidden(label: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(label);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") process.exit(1); // Ctrl+C
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };
    stdin.on("data", onData);
  });
}

function fail(message: string): never {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

async function main() {
  console.log("→ Création des tables…");
  for (const statement of SCHEMA_STATEMENTS) {
    await query(statement);
  }
  console.log("✔ Tables prêtes.");

  if ((await countAdmins()) > 0) {
    console.log("✔ Un administrateur existe déjà : rien d'autre à faire.");
    return;
  }

  console.log("\nAucun administrateur. Créons le compte administrateur central.\n");

  // Mode non interactif (facultatif) : variables ADMIN_* déjà définies.
  const env = process.env;
  const interactive = !env.ADMIN_USERNAME || !env.ADMIN_PASSWORD;

  const usernameRaw = env.ADMIN_USERNAME ?? (await ask("Identifiant de connexion : "));
  const firstNameRaw = env.ADMIN_FIRST_NAME ?? (await ask("Prénom : "));
  const lastNameRaw = env.ADMIN_LAST_NAME ?? (await ask("Nom : "));
  const gradeRaw = env.ADMIN_GRADE ?? (await ask("Grade : "));
  const stationRaw = env.ADMIN_STATION ?? (await ask("Station d'affectation : "));
  const avatarRaw = env.ADMIN_AVATAR_URL ?? (interactive ? await ask("URL de la photo (facultatif) : ") : "");

  let password = env.ADMIN_PASSWORD ?? "";
  if (interactive) {
    password = await askHidden("Mot de passe (8 caractères min.) : ");
    const confirmation = await askHidden("Confirme le mot de passe : ");
    if (password !== confirmation) fail("Les deux mots de passe ne correspondent pas.");
  }

  const username = normalizeUsername(usernameRaw);
  const usernameError = checkUsername(username);
  if (usernameError) fail(usernameError);
  const passwordError = checkPassword(password);
  if (passwordError) fail(passwordError);

  const firstName = parseShortText(firstNameRaw, "Le prénom");
  if (!firstName.ok) fail(firstName.error);
  const lastName = parseShortText(lastNameRaw, "Le nom");
  if (!lastName.ok) fail(lastName.error);
  const grade = parseShortText(gradeRaw, "Le grade");
  if (!grade.ok) fail(grade.error);
  const station = parseShortText(stationRaw, "La station");
  if (!station.ok) fail(station.error);
  const avatarUrl = parseAvatarUrl(avatarRaw);
  if (!avatarUrl.ok) fail(avatarUrl.error);

  const id = await createUser({
    username,
    passwordHash: await hashPassword(password),
    firstName: firstName.value,
    lastName: lastName.value,
    grade: grade.value,
    station: station.value,
    avatarUrl: avatarUrl.value,
    isAdmin: true,
  });
  if (!id) fail("Cet identifiant existe déjà.");

  console.log(`\n✔ Administrateur « ${username} » créé. Tu peux te connecter sur le site.`);
}

main().catch((error: unknown) => {
  console.error("\n✖ Échec :", error instanceof Error ? error.message : error);
  process.exit(1);
});
