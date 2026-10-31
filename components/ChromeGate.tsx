"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Masque son contenu (bandeau officiel…) sur le Toughbook LSFD MDC, qui s'affiche en plein écran sans l'habillage du site. */
export function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/toughbook" || pathname.startsWith("/toughbook/")) return null;
  return <>{children}</>;
}
