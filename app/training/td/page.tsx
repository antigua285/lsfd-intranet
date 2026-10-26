import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { closeExpiredAttempts, listAttempts, listExams } from "@/lib/exams";
import { listCards } from "@/lib/flashcards";
import { computeProgress, getTemplate, listNotebooks, syncNotebooks } from "@/lib/probation";

export const metadata = { title: "Espace TD | LSFD Intranet" };

export default function TdPage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Link href="/training" className="text-[12px] text-slate-500 hover:underline">← Formation</Link>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Espace TD</h1>
      <p className="text-sm text-slate-500 mb-6">Tout ce dont la Training Division a besoin, au même endroit.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

/** Une section dont la table n'existe pas encore (db:setup non lancé) s'affiche sans compteur, sans casser la page. */
async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

type Link_ = { href: string; label: string };

function Block({ title, desc, count, countLabel, testId, links }: { title: string; desc: string; count: number | null; countLabel: string; testId: string; links: Link_[] }) {
  return (
    <section data-testid={testId} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-[15px] font-bold text-slate-800">{title}</h2>
          <p className="text-[13px] text-slate-500">{desc}</p>
        </div>
        {count !== null && (
          <div className="text-right">
            <p data-testid={`${testId}-count`} className={`text-2xl font-bold leading-none ${count > 0 && testId === "td-review" ? "text-[#c00d0d]" : "text-slate-800"}`}>{count}</p>
            <p className="text-[11px] text-slate-500">{countLabel}</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-[13px] font-bold border border-slate-300 rounded px-3 py-1.5 hover:bg-slate-50">{l.label}</Link>
        ))}
      </div>
    </section>
  );
}

async function Content() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  if (!isTrainer(ctx)) notFound();

  const [toGrade, exams, notebooks, cards] = await Promise.all([
    safe(async () => {
      await closeExpiredAttempts();
      return (await listAttempts({ status: "submitted" })).length;
    }),
    safe(() => listExams()),
    safe(async () => {
      await syncNotebooks();
      const [list, template] = await Promise.all([listNotebooks(false), getTemplate()]);
      return { total: list.length, eligible: list.filter((n) => computeProgress(template, n.checked).eligible).length };
    }),
    safe(() => listCards()),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Block
        testId="td-review"
        title="Correction des examens"
        desc="Passages rendus par les candidats, à noter et à renvoyer."
        count={toGrade}
        countLabel="à corriger"
        links={[{ href: "/training/exams/review", label: "Corriger" }, { href: "/training/exams/review?status=sent", label: "Résultats envoyés" }]}
      />
      <Block
        testId="td-exams"
        title="Clés et assignation"
        desc="Retrouve la clé de chaque examen et assigne-le à un membre."
        count={exams ? exams.length : null}
        countLabel="examens"
        links={[{ href: "/training/exams/manage", label: "Clés et assignation" }, ...(ctx.user.isAdmin ? [{ href: "/admin/exams", label: "Créer / modifier les examens" }] : [])]}
      />
      <Block
        testId="td-probation"
        title="Probation"
        desc={notebooks ? `${notebooks.eligible} carnet(s) éligible(s) à la phase deux.` : "Carnets de probation des pompiers."}
        count={notebooks ? notebooks.total : null}
        countLabel="carnets actifs"
        links={[{ href: "/training/probation", label: "Carnets" }, { href: "/training/probation/template", label: "Modèle" }, { href: "/training/probation/archives", label: "Archives" }]}
      />
      <Block
        testId="td-cards"
        title="Cartes de révision"
        desc="Ajoute ou modifie les questions et réponses."
        count={cards ? cards.length : null}
        countLabel="cartes"
        links={[{ href: "/training/cards/manage", label: "Gérer les cartes" }, { href: "/training/cards", label: "Réviser" }]}
      />
    </div>
  );
}
