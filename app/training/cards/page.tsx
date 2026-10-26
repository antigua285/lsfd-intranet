import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { isMissingFlashcardsTableError, listCards, type Flashcard } from "@/lib/flashcards";
import { StudyDeck } from "./StudyDeck";

export const metadata = { title: "Cartes de révision | LSFD Intranet" };

export default function CardsPage() {
  return (
    <div className="max-w-3xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Link href="/training" className="text-[12px] text-slate-500 hover:underline">← Formation</Link>
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
  let cards: Flashcard[] = [];
  let missing = false;
  try {
    cards = await listCards();
  } catch (error) {
    if (!isMissingFlashcardsTableError(error)) throw error;
    missing = true;
  }
  if (missing) {
    return (
      <div className="border border-slate-200 bg-slate-50 rounded p-5 text-[13px] text-slate-600">
        <p className="font-bold text-slate-700 mb-2">Base de données à mettre à jour</p>
        {ctx.user.isAdmin ? (
          <>Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC (une seule fois), puis recharge cette page.</>
        ) : (
          "Cette page n'est pas encore disponible. Un modérateur doit finir l'installation."
        )}
      </div>
    );
  }
  const canEdit = isTrainer(ctx);
  return <StudyDeck initialCards={cards} canEdit={canEdit} />;
}
