import Link from "next/link";
import { getAccessContext, isRecruitOnly } from "@/lib/access";

/** Icône « tablette » du header : mène au Toughbook. Absente pour les comptes qui n'y ont pas accès. */
export async function ToughbookLink() {
  const ctx = await getAccessContext();
  if (!ctx || isRecruitOnly(ctx.user.isAdmin, ctx.flags)) return null;
  const message = "(( Vous accédez au MDC LSFD à travers le Panoramic Toughbook CF-33 uniquement disponible dans les unités. ))";
  return (
    <div className="relative group flex items-center mr-1">
      <Link
        href="/toughbook"
        aria-label="Ouvrir le MDC LSFD (Toughbook)"
        aria-describedby="toughbook-tip"
        data-testid="toughbook-link"
        className="text-slate-500 hover:text-[#0d2644] transition-colors p-1 rounded hover:bg-slate-100 block"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <path strokeLinecap="round" d="M11 17h2" />
        </svg>
      </Link>
      <p
        id="toughbook-tip"
        role="tooltip"
        data-testid="toughbook-tip"
        className="pointer-events-none absolute right-0 top-full mt-2 w-72 rounded border border-slate-200 bg-white/95 px-3 py-2 text-[11px] italic leading-snug text-slate-500 shadow-md opacity-0 translate-y-[-2px] transition duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 z-50"
      >
        {message}
      </p>
    </div>
  );
}
