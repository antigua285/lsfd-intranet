import Link from "next/link";
import type { ReactNode } from "react";

const BASE = "inline-flex items-center justify-center rounded px-4 py-2 text-[13px] font-bold transition-colors";
const VARIANTS = {
  primary: "bg-[#0d2644] text-white hover:bg-[#143a66]",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
} as const;

/** Un lien qui a l'allure d'un vrai bouton (pas de « Mot → »). */
export function LinkButton({ href, variant = "secondary", children, testId }: { href: string; variant?: keyof typeof VARIANTS; children: ReactNode; testId?: string }) {
  return (
    <Link href={href} data-testid={testId} className={`${BASE} ${VARIANTS[variant]}`}>
      {children}
    </Link>
  );
}
