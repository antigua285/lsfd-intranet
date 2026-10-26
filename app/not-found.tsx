import Link from "next/link";

export const metadata = { title: "Page introuvable | LSFD Intranet" };

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto mt-10 text-center font-['Calibri','Arial',sans-serif]">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="text-lg font-bold text-slate-800 uppercase mt-2">Page introuvable</h1>
      <p className="text-sm text-slate-500 mt-1">
        Cette page n&apos;existe pas, ou ton compte n&apos;y a pas accès.
      </p>
      <Link href="/" className="inline-block mt-4 text-[13px] font-bold text-[#0d2644] hover:underline">
        ← Retour à l&apos;accueil
      </Link>
    </div>
  );
}
