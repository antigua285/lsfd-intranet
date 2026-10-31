import { readdir } from "node:fs/promises";
import path from "node:path";

const EXT = /\.(mp3|ogg|wav|m4a|aac|webm)$/i;

/** Sons présents dans public/sound, triés par nom. Liste vide si le dossier n'existe pas. */
export async function listSounds(): Promise<string[]> {
  try {
    const names = await readdir(path.join(process.cwd(), "public", "sound"));
    return names.filter((n) => EXT.test(n)).sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
  } catch {
    return [];
  }
}
