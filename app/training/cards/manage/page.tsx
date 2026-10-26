import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccessContext, isTrainer } from "@/lib/access";
import { isMissingFlashcardsTableError, listCards, type Flashcard } from "@/lib/flashcards";
import { CardManager } from "./CardManager";

export const metadata = { title: "Gérer les cartes | LSFD Intranet" };

export default function ManageCardsPage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-['Calibri','Arial',sans-serif]">
      <Link href="/training/cards" className="text-[12px] text-slate-500 hover:underline">← Cartes de révision</Link>
      <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">Gérer les cartes</h1>
      <p className="text-sm text-slate-500 mb-6">Ajout, modification et suppression des questions et réponses. Réservé à la TD et aux modérateurs.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  if (!isTrainer(ctx)) notFound();
  let cards: Flashcard[] = [];
  try {
    cards = await listCards();
  } catch (error) {
    if (!isMissingFlashcardsTableError(error)) throw error;
    return <p className="text-[13px] text-slate-600">Lance <code className="bg-slate-100 px-1 rounded">npm run db:setup</code> depuis ton PC, puis recharge.</p>;
  }
  return <CardManager initialCards={cards} />;
}
