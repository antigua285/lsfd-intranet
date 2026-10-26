import { Suspense } from "react";
import Link from "next/link";
import { getAccessContext } from "@/lib/access";
import { countAssignedPending } from "@/lib/exams";

export const metadata = { title: "Formation | LSFD Intranet" };

const SECTIONS = [
  { href: "/training/cards", title: "Cartes de révision", desc: "Révise la documentation question par question." },
  { href: "/training/exams", title: "Examens", desc: "Passe un examen avec ta clé d'accès et consulte tes résultats." },
  { href: "/training/probation", title: "Probation", desc: "Carnet de probation : compétences validées, commentaires et passage en phase deux." },
];

async function PendingBadge() {
  const ctx = await getAccessContext();
  if (!ctx) return null;
  let n = 0;
  try {
    n = await countAssignedPending(ctx.user.id);
  } catch {
    return null; // base pas encore à jour : pas de pastille
  }
  if (n === 0) return null;
  return <span data-testid="pending-exams" className="ml-2 text-[11px] font-bold rounded-full bg-[#c00d0d] text-white px-2 py-0.5">{n} à passer</span>;
}

export default function TrainingPage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <h1 className="text-xl font-bold text-slate-800 uppercase">Formation</h1>
      <p className="text-sm text-slate-500 mb-6">Révisions, examens et suivi de probation.</p>
      <Suspense fallback={null}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="block border border-slate-200 rounded-lg p-4 hover:border-[#0d2644] hover:bg-slate-50 transition-colors">
                <p className="text-[15px] font-bold text-slate-800">{s.title}{s.href === "/training/exams" && <Suspense fallback={null}><PendingBadge /></Suspense>}</p>
                <p className="text-[13px] text-slate-500">{s.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Suspense>
    </div>
  );
}
