"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExamQuestionHead } from "@/components/ExamQuestionHead";
import { EXAM_LIMITS, answerLines, formatPoints, isChoice, totalPoints, type Attempt, type Grade, type Verdict } from "@/lib/exams-types";
import { autoScore } from "@/lib/exams-validation";
import { deletePracticalDraftAction, reopenResultAction, saveGradingAction, sendResultAction } from "./review/actions";

const INPUT = "border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#0d2644]";

/** Panneau de correction : note et commentaire par réponse, résultat « réussi / non réussi », envoi au candidat. */
export function ExamGrader({ attempt }: { attempt: Attempt }) {
  const router = useRouter();
  const { snapshot } = attempt;
  const locked = attempt.status === "sent";
  const practical = snapshot.kind === "practical";

  // Valeurs de départ : la note déjà enregistrée, sinon la suggestion automatique (choix) ou rien (texte).
  const [grades, setGrades] = useState<Record<string, { points: string; comment: string; suggested: boolean }>>(() => {
    const out: Record<string, { points: string; comment: string; suggested: boolean }> = {};
    for (const q of snapshot.questions) {
      const saved: Grade | undefined = attempt.grades[q.id];
      if (saved && saved.points !== null) out[q.id] = { points: String(saved.points), comment: saved.comment, suggested: false };
      else {
        const auto = autoScore(q, attempt.answers[q.id]);
        out[q.id] = { points: auto === null ? "" : String(auto), comment: saved?.comment ?? "", suggested: auto !== null };
      }
    }
    return out;
  });
  const [verdict, setVerdict] = useState<Verdict | null>(attempt.verdict);
  const [comment, setComment] = useState(attempt.comment);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const max = totalPoints(snapshot.questions);
  const got = Math.round(snapshot.questions.reduce((n, q) => n + (Number(grades[q.id].points) || 0), 0) * 100) / 100;
  // Critères éliminatoires non validés en totalité : l'examen ne peut pas être « réussi ».
  const failedEliminatory = snapshot.questions.filter((q) => q.eliminatory && (Number(grades[q.id].points) || 0) < q.points);
  const percent = max ? Math.round((got / max) * 100) : 0;
  const thresholdPoints = snapshot.thresholdPercent ? Math.round(((max * snapshot.thresholdPercent) / 100) * 100) / 100 : null;

  const payload = () => ({
    grades: Object.fromEntries(Object.entries(grades).map(([id, g]) => [id, { points: g.points === "" ? null : Number(g.points), comment: g.comment }])),
    verdict,
    comment,
  });

  async function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await work();
      setMessage(result.ok ? { ok: true, text: success } : { ok: false, text: result.error });
      if (result.ok) router.refresh();
    } catch {
      setMessage({ ok: false, text: "L'action a échoué (session expirée ?)." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <h1 className="text-xl font-bold text-slate-800 uppercase">{attempt.examTitle}</h1>
      <section aria-label="Candidat" className="mt-3 border border-slate-300 rounded p-3 text-[13px] grid sm:grid-cols-4 gap-2">
        <p><span className="text-slate-500">Candidat : </span><strong>{attempt.candidate.name}</strong></p>
        <p><span className="text-slate-500">Grade : </span>{attempt.candidate.grade}</p>
        <p><span className="text-slate-500">Station : </span>{attempt.candidate.station}</p>
        <p><span className="text-slate-500">{practical ? "Évaluation ouverte : " : "Rendu : "}</span>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"}</p>
      </section>

      <div className="sticky top-0 z-10 mt-3 bg-white/95 border border-slate-200 rounded px-3 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px]">
        <span>Total : <strong data-testid="grade-total">{formatPoints(got)} / {formatPoints(max)}</strong> ({percent} %)</span>
        {thresholdPoints !== null && <span className="text-slate-500">Seuil indicatif : {snapshot.thresholdPercent} % ({formatPoints(thresholdPoints)} pts)</span>}
        {practical && <span className="text-[11px] font-bold uppercase bg-slate-100 text-slate-700 rounded px-2 py-0.5">Examen pratique</span>}
        {failedEliminatory.length > 0 && <span data-testid="eliminatory-warning" className="text-[12px] font-bold text-red-700">Critère éliminatoire non validé : résultat « réussi » impossible</span>}
        <fieldset className="flex items-center gap-3" disabled={locked}>
          <legend className="sr-only">Résultat</legend>
          <label className="flex items-center gap-1"><input type="radio" name="verdict" checked={verdict === "pass"} onChange={() => setVerdict("pass")} /> Réussi</label>
          <label className="flex items-center gap-1"><input type="radio" name="verdict" checked={verdict === "fail"} onChange={() => setVerdict("fail")} /> Non réussi</label>
        </fieldset>
      </div>

      <ol className="mt-5 flex flex-col gap-5">
        {snapshot.questions.map((q, index) => {
          const answer = attempt.answers[q.id];
          const picked = Array.isArray(answer) ? answer : answer ? [answer as string] : [];
          const g = grades[q.id];
          return (
            <li key={q.id} data-testid="grade-question" className="border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
              <ExamQuestionHead question={q} index={index} />
              {q.eliminatory && <span className="self-start text-[11px] font-bold uppercase bg-red-50 text-red-700 border border-red-200 rounded px-2 py-0.5">Critère éliminatoire — à valider en totalité</span>}
              {practical ? null : isChoice(q.type) ? (
                <ul className="flex flex-col gap-1 text-[13px]">
                  {q.options?.map((o) => {
                    const chosen = picked.includes(o.id);
                    return (
                      <li key={o.id} className={`flex items-center gap-2 rounded px-2 py-1 ${o.correct ? "bg-green-50" : ""} ${chosen && !o.correct ? "bg-red-50" : ""}`}>
                        <span aria-hidden className="w-4">{chosen ? "●" : "○"}</span>
                        <span className="flex-1">{o.label}</span>
                        {o.correct && <span className="text-[11px] font-bold text-green-700">Bonne réponse</span>}
                        {chosen && <span className="sr-only">(choisi par le candidat)</span>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="border border-slate-300 rounded bg-slate-50 px-3 py-2 text-[14px] whitespace-pre-wrap min-h-10">
                  {answerLines(q, answer)[0] ?? <span className="text-slate-400">(pas de réponse)</span>}
                </div>
              )}
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-[12px] text-slate-600">Points
                  <span className="flex items-center gap-1">
                    <input aria-label={`Points question ${index + 1}`} type="number" min={0} max={q.points} step={0.25} disabled={locked} className={`${INPUT} w-24`} value={g.points}
                      onChange={(e) => setGrades((p) => ({ ...p, [q.id]: { ...p[q.id], points: e.target.value, suggested: false } }))} />
                    <span>/ {formatPoints(q.points)}</span>
                  </span>
                </label>
                {g.suggested && <span className="text-[11px] text-amber-700 pb-2">Suggestion automatique — à confirmer</span>}
                <label className="text-[12px] text-slate-600 flex-1 min-w-[220px]">{practical ? "Remarque pour le membre" : "Commentaire pour le candidat"}
                  <textarea aria-label={`Commentaire question ${index + 1}`} rows={2} disabled={locked} maxLength={EXAM_LIMITS.comment} className={`${INPUT} w-full`} value={g.comment}
                    onChange={(e) => setGrades((p) => ({ ...p, [q.id]: { ...p[q.id], comment: e.target.value } }))} />
                </label>
              </div>
            </li>
          );
        })}
      </ol>

      <label className="block mt-5 text-[13px] text-slate-700">Commentaire général (visible par le candidat)
        <textarea rows={3} disabled={locked} maxLength={EXAM_LIMITS.comment} className={`${INPUT} w-full mt-1`} value={comment} onChange={(e) => setComment(e.target.value)} />
      </label>

      <div className="mt-5 mb-10 flex flex-wrap items-center gap-3">
        {locked ? (
          <>
            <p className="text-[13px] text-green-700 font-bold">Résultat envoyé à {attempt.candidate.name}.</p>
            <button type="button" disabled={busy} onClick={() => run(() => reopenResultAction(attempt.id), "Correction rouverte.")} className="border border-slate-300 text-[12px] font-bold rounded px-3 py-1.5 hover:bg-slate-100">Rouvrir la correction</button>
          </>
        ) : (
          <>
            {practical && (
              <button type="button" disabled={busy} onClick={() => window.confirm("Supprimer cette évaluation ? Rien ne sera envoyé.") && void (async () => { setBusy(true); try { const r = await deletePracticalDraftAction(attempt.id); if (r.ok) router.push("/training/exams/practical"); else setMessage({ ok: false, text: r.error }); } finally { setBusy(false); } })()} className="text-[12px] text-red-700 hover:underline">Supprimer l&apos;évaluation</button>
            )}
            <button type="button" disabled={busy} onClick={() => run(() => saveGradingAction(attempt.id, payload()), "Correction enregistrée.")} className="border border-slate-300 text-[12px] font-bold uppercase tracking-wide rounded px-4 py-2 hover:bg-slate-100">Enregistrer le brouillon</button>
            <button type="button" disabled={busy} onClick={() => window.confirm("Envoyer le résultat au candidat ?") && run(() => sendResultAction(attempt.id, payload()), "Résultat envoyé.")} className="bg-[#0d2644] text-white text-[12px] font-bold uppercase tracking-wide rounded px-5 py-2 hover:bg-[#143a66] disabled:opacity-50">Envoyer le résultat</button>
          </>
        )}
        {message && <p role={message.ok ? "status" : "alert"} className={`text-[13px] ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}
      </div>
    </div>
  );
}
