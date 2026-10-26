import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPathAllowed } from "@/lib/module-gate";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Verrou d'entrée : toute requête sans session valide est renvoyée vers /login.
 * Le contrôle de session est léger (signature du cookie uniquement) ; les pages sensibles
 * (profil, admin) et les actions revérifient en base.
 * En plus, les adresses d'une catégorie réservée à certains flags (config/navigation.ts)
 * sont vérifiées en base : sans le bon flag, la page est « introuvable ».
 */
export async function proxy(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) {
    if (await isPathAllowed(session.userId, request.nextUrl.pathname)) return NextResponse.next();
    // Réécriture vers une adresse qui n'existe pas : page 404 du site, code HTTP 404.
    return NextResponse.rewrite(new URL("/introuvable", request.url), { status: 404 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";

  const wanted = request.nextUrl.pathname + request.nextUrl.search;
  if (request.method === "GET" && wanted !== "/") {
    loginUrl.searchParams.set("next", wanted);
  }
  return NextResponse.redirect(loginUrl, 303);
}

export const config = {
  // Tout est protégé (pages, PDF, images) SAUF la page de connexion et les
  // fichiers internes de Next.js nécessaires pour l'afficher.
  matcher: ["/((?!login(?:/|$)|_next/static|_next/image|favicon\\.ico$).*)"],
};
