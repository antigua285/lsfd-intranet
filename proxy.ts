import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Verrou d'entrée : toute requête sans session valide est renvoyée vers /login.
 * Ce contrôle est volontairement léger (signature du cookie uniquement).
 * Les pages sensibles (profil, admin) et les actions revérifient en base.
 */
export async function proxy(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

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
