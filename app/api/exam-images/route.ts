import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveImage } from "@/lib/exams";

const MAX_BYTES = 1_500_000;

/** Type réel de l'image d'après ses premiers octets (le type annoncé par le navigateur n'est pas fiable). */
function sniff(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

/** Ajout d'une image de question (modérateurs uniquement). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Envoi invalide." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image trop lourde (1,5 Mo max)." }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime) return NextResponse.json({ error: "Format non accepté (JPEG, PNG ou WebP)." }, { status: 415 });
  try {
    const id = await saveImage(mime, Buffer.from(bytes).toString("base64"));
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "Enregistrement impossible (base à jour ?)." }, { status: 500 });
  }
}
