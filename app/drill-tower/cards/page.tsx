import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getAccessContext, isMissingAccessTableError, isTrainer, listFlags } from "@/lib/access";
import { DRILL_FLAG } from "@/lib/drill-shared";
import { cardsFor, isMissingFlashcardsTableError, listCards } from "@/lib/flashcards";
import type { Flashcard } from "@/lib/flashcards-types";
import { StudyDeck } from "../../training/cards/StudyDeck";

export const metadata = { title: "Cartes de révision | Drill Tower | LSFD Intranet" };

export default function DrillCardsPage() {
  return (
    <div className="max-w-3xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Drill Tower", href: "/drill-tower" }, { label: "Cartes de révision" }]} />
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Cartes de révision</h1>
      <p className="text-sm text-slate-500 mb-6">Une question sur la documentation : retourne la carte pour voir la réponse.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  const staff = isTrainer(ctx);
  if (!staff && !ctx.flags.includes(DRILL_FLAG)) notFound();
  let cards: Flashcard[] = [];
  try {
    cards = cardsFor(ctx, await listCards());
  } catch (error) {
    if (!isMissingFlashcardsTableError(error)) throw error;
    return <p className="text-[13px] text-slate-600">Cette page n&apos;est pas encore disponible : lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code>.</p>;
  }
  let allFlags: { code: string; name: string }[] = [];
  if (staff) {
    try {
      allFlags = (await listFlags()).map((f) => ({ code: f.code, name: f.name }));
    } catch (error) {
      if (!isMissingAccessTableError(error)) throw error;
    }
  }
  return <StudyDeck initialCards={cards} canEdit={staff} allFlags={allFlags} />;
}
