import { NextResponse } from "next/server";
import { getImage } from "@/lib/exams";
import { UUID_PATTERN } from "@/lib/validation";

/** Image d'une question (réservé aux connectés : le proxy verrouille déjà toutes les routes). */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_PATTERN.test(id)) return new NextResponse(null, { status: 404 });
  let image;
  try {
    image = await getImage(id);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
  if (!image) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(image.data, "base64"), {
    headers: { "Content-Type": image.mime, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" },
  });
}
