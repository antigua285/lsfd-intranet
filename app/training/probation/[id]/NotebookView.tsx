"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { computeProgress, ELIGIBLE_PERCENT, type Checked, type Comment, type TemplateCategory } from "@/lib/probation-shared";
import { addCommentAction, archiveAction, deleteCommentAction, toggleTickAction } from "../actions";

type Props = {
  notebook: { id: string; ownerName: string; checked: Checked; createdAt: string; archivedAt: string | null; archivedBy: string };
  categories: TemplateCategory[];
  comments: Comment[];
  trainer: boolean;
  canTick: boolean;
  selfNotebook: boolean;
  currentUserId: string;
  isAdmin: boolean;
};

const fmt = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });

export function NotebookView({ notebook, categories, comments: initialComments, trainer, canTick, selfNotebook, currentUserId, isAdmin }: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState<Checked>(notebook.checked);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const archived = !!notebook.archivedAt;
  const progress = computeProgress(categories, checked);

  function toggle(itemId: string, value: boolean) {
    setError("");
    const previous = checked[itemId];
    // Affichage immédiat ; en cas de refus, on ne restaure QUE cette case (d'autres clics peuvent être en cours).
    setChecked((c) => {
      const next = { ...c };
      if (value) next[itemId] = { by: "…", at: new Date().toISOString() };
      else delete next[itemId];
      return next;
    });
    startTransition(async () => {
      const r = await toggleTickAction(notebook.id, itemId, value);
      setChecked((c) => {
        const next = { ...c };
        if (!r.ok) {
          if (previous) next[itemId] = previous;
          else delete next[itemId];
        } else if (value && next[itemId]) {
          next[itemId] = { by: r.by, at: r.at }; // une case décochée entre-temps n'est pas rétablie
        }
        return next;
      });
      if (!r.ok) setError(r.error);
    });
  }

  function send() {
    setError("");
    startTransition(async () => {
      const r = await addCommentAction(notebook.id, draft);
      if (!r.ok) return setError(r.error);
      setComments((list) => [...list, r.comment]);
      setDraft("");
    });
  }

  function removeComment(id: string) {
    startTransition(async () => {
      const r = await deleteCommentAction(notebook.id, id);
      if (!r.ok) return setError(r.error);
      setComments((list) => list.filter((c) => c.id !== id));
    });
  }

  function archive() {
    if (!window.confirm(`Archiver le carnet de ${notebook.ownerName} ? Il reste consultable dans les archives et peut être restauré.`)) return;
    startTransition(async () => {
      const r = await archiveAction(notebook.id);
      if (!r.ok) return setError(r.error);
      router.push("/training/probation/archives");
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mt-1">
        <h1 className="text-xl font-bold text-slate-800 uppercase flex-1">Carnet — {notebook.ownerName}</h1>
        {archived && <span className="text-[11px] font-bold rounded bg-slate-200 text-slate-700 px-2 py-0.5">Archivé le {fmt(notebook.archivedAt!)}{notebook.archivedBy && ` par ${notebook.archivedBy}`}</span>}
        {trainer && !archived && (
          <button type="button" onClick={archive} disabled={pending} data-testid="archive" className="text-[13px] font-bold border border-slate-300 rounded px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50">Archiver</button>
        )}
      </div>

      <div className="border border-slate-200 rounded-lg p-4 my-4" data-testid="progress">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-bold text-slate-800" data-testid="progress-text">{progress.done}/{progress.total} compétences · {Math.floor(progress.percent)} %</span>
          {progress.eligible && <span data-testid="eligible" className="text-[12px] font-bold rounded bg-green-100 text-green-800 px-2 py-0.5">Éligible à la phase deux</span>}
        </div>
        <div className="h-2 bg-slate-100 rounded mt-2 relative">
          <div className="h-full rounded bg-[#0d2644]" style={{ width: `${progress.percent}%` }} />
          <div className="absolute top-[-3px] bottom-[-3px] w-px bg-[#c00d0d]" style={{ left: `${ELIGIBLE_PERCENT}%` }} title={`Seuil : ${ELIGIBLE_PERCENT} %`} />
        </div>
        <p className="text-[12px] text-slate-500 mt-2">La phase deux est accessible dès {ELIGIBLE_PERCENT} % des compétences validées par la Training Division.</p>
      </div>

      {error && <p role="alert" className="text-[13px] text-red-700 mb-3">{error}</p>}
      {!canTick && !archived && !selfNotebook && trainer && <p className="text-[12px] text-slate-500 mb-3">Lecture seule.</p>}
      {selfNotebook && !archived && <p className="text-[12px] text-slate-500 mb-3">Seule la Training Division valide les compétences. Tu peux suivre ta progression et lire ses commentaires ici.</p>}

      {categories.length === 0 ? (
        <p className="text-[13px] text-slate-500 border border-slate-200 rounded p-4">Le modèle de probation est vide.{trainer && " Ajoute des catégories dans « Modèle »."}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((cat) => {
            const done = cat.items.filter((i) => checked[i.id]).length;
            return (
              <section key={cat.id} data-testid="category" className="border border-slate-200 rounded-lg overflow-hidden">
                <h2 className="bg-slate-50 px-4 py-2 text-[14px] font-bold text-slate-800 flex justify-between"><span>{cat.title}</span><span className="text-slate-500 font-normal">{done}/{cat.items.length}</span></h2>
                <ul>
                  {cat.items.map((item) => {
                    const tick = checked[item.id];
                    return (
                      <li key={item.id} className="px-4 py-2 border-t border-slate-100">
                        <label className={`flex items-start gap-3 ${canTick ? "cursor-pointer" : ""}`}>
                          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#0d2644]" checked={!!tick} disabled={!canTick} onChange={(e) => toggle(item.id, e.target.checked)} data-testid="tick" />
                          <span className="flex-1 text-[14px] text-slate-800">{item.label}</span>
                          {tick && <span className="text-[11px] text-slate-500 whitespace-nowrap">{tick.by !== "…" && `${tick.by} · `}{fmt(tick.at)}</span>}
                        </label>
                      </li>
                    );
                  })}
                  {cat.items.length === 0 && <li className="px-4 py-2 text-[13px] text-slate-400 border-t border-slate-100">Aucune compétence.</li>}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-[15px] font-bold text-slate-800 uppercase mb-2">Commentaires de la Training Division</h2>
        {comments.length === 0 && <p className="text-[13px] text-slate-500 mb-3" data-testid="no-comments">Aucun commentaire.</p>}
        <ul className="flex flex-col gap-2 mb-3">
          {comments.map((c) => (
            <li key={c.id} data-testid="comment" className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-[12px] text-slate-500">
                <b className="text-slate-700">{c.authorName}</b><span>{fmt(c.createdAt)}</span>
                {trainer && (isAdmin || c.authorId === currentUserId) && (
                  <button type="button" onClick={() => removeComment(c.id)} className="ml-auto text-[12px] text-red-700 hover:underline">Supprimer</button>
                )}
              </div>
              <p className="text-[14px] text-slate-800 whitespace-pre-wrap mt-1">{c.body}</p>
            </li>
          ))}
        </ul>
        {trainer && (
          <div className="flex flex-col gap-2">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={1500} placeholder="Ajouter un commentaire (visible par le pompier et la Training Division)" aria-label="Nouveau commentaire" className="border border-slate-300 rounded px-3 py-2 text-[14px]" />
            <button type="button" onClick={send} disabled={pending || !draft.trim()} data-testid="send-comment" className="self-start bg-[#0d2644] text-white text-[13px] font-bold rounded px-4 py-1.5 disabled:opacity-50">Publier</button>
          </div>
        )}
      </section>
    </div>
  );
}
