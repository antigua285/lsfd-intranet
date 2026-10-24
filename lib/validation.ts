/** Règles de saisie, partagées par le script d'installation et les formulaires. */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function checkUsername(username: string): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return "Identifiant invalide : 3 à 32 caractères, lettres, chiffres, point, tiret ou underscore.";
  }
  return null;
}

export function checkPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Le mot de passe doit faire au moins ${PASSWORD_MIN} caractères.`;
  }
  if (password.length > PASSWORD_MAX) {
    return `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX} caractères.`;
  }
  return null;
}

/** Texte court (prénom, nom, grade, station) : nettoyé et limité en taille. */
export function parseShortText(raw: string, label: string, max = 60): Result<string> {
  const value = raw.replace(/\s+/g, " ").trim();
  if (!value) return { ok: false, error: `${label} est obligatoire.` };
  if (value.length > max) return { ok: false, error: `${label} est trop long (${max} caractères max).` };
  if (/[\u0000-\u001f\u007f]/.test(value)) return { ok: false, error: `${label} contient des caractères invalides.` };
  return { ok: true, value };
}

/** URL de photo : facultative, doit être en http(s). */
export function parseAvatarUrl(raw: string): Result<string | null> {
  const value = raw.trim();
  if (!value) return { ok: true, value: null };
  if (value.length > 500) return { ok: false, error: "L'URL de la photo est trop longue (500 caractères max)." };
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, error: "L'URL de la photo doit commencer par https://" };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: "L'URL de la photo n'est pas valide." };
  }
}

export type NewUserInput = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  grade: string;
  station: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export function parseNewUser(formData: FormData): Result<NewUserInput> {
  const get = (name: string) => String(formData.get(name) ?? "");

  const username = normalizeUsername(get("username"));
  const usernameError = checkUsername(username);
  if (usernameError) return { ok: false, error: usernameError };

  const password = get("password");
  const passwordError = checkPassword(password);
  if (passwordError) return { ok: false, error: passwordError };

  const firstName = parseShortText(get("firstName"), "Le prénom");
  if (!firstName.ok) return firstName;
  const lastName = parseShortText(get("lastName"), "Le nom");
  if (!lastName.ok) return lastName;
  const grade = parseShortText(get("grade"), "Le grade");
  if (!grade.ok) return grade;
  const station = parseShortText(get("station"), "La station");
  if (!station.ok) return station;
  const avatarUrl = parseAvatarUrl(get("avatarUrl"));
  if (!avatarUrl.ok) return avatarUrl;

  return {
    ok: true,
    value: {
      username,
      password,
      firstName: firstName.value,
      lastName: lastName.value,
      grade: grade.value,
      station: station.value,
      avatarUrl: avatarUrl.value,
      isAdmin: get("isAdmin") === "on",
    },
  };
}

export type ProfileInput = Omit<NewUserInput, "password" | "isAdmin">;

/** Modification d'un profil existant (mêmes règles qu'à la création, sans mot de passe ni rôle). */
export function parseProfileUpdate(formData: FormData): Result<ProfileInput> {
  const get = (name: string) => String(formData.get(name) ?? "");

  const username = normalizeUsername(get("username"));
  const usernameError = checkUsername(username);
  if (usernameError) return { ok: false, error: usernameError };

  const firstName = parseShortText(get("firstName"), "Le prénom");
  if (!firstName.ok) return firstName;
  const lastName = parseShortText(get("lastName"), "Le nom");
  if (!lastName.ok) return lastName;
  const grade = parseShortText(get("grade"), "Le grade");
  if (!grade.ok) return grade;
  const station = parseShortText(get("station"), "La station");
  if (!station.ok) return station;
  const avatarUrl = parseAvatarUrl(get("avatarUrl"));
  if (!avatarUrl.ok) return avatarUrl;

  return {
    ok: true,
    value: {
      username,
      firstName: firstName.value,
      lastName: lastName.value,
      grade: grade.value,
      station: station.value,
      avatarUrl: avatarUrl.value,
    },
  };
}

/**
 * Page de retour après connexion. On n'accepte qu'un chemin interne du site :
 * sinon un lien piégé pourrait renvoyer l'utilisateur vers un site malveillant.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  if (raw === "/login" || raw.startsWith("/login?") || raw.startsWith("/login/")) return "/";
  return raw;
}
