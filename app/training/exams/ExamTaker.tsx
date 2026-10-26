"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExamQuestionHead } from "@/components/ExamQuestionHead";
import { EXAM_LIMITS, type AnswerValue, type Candidate, type PublicQuestion } from "@/lib/exams-types";
import { saveDraftAction, submitAttemptAction } from "./actions";

function fmt(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(r).padStart(2, "0")}`;
}

type Props = {
  attemptId: string;
  title: string;
  candidate: Candidate;
  questions: PublicQuestion[];
  initialAnswers: Record<string, AnswerValue>;
  deadlineMs: number | null;
  serverNowMs: number;
};

export function ExamTaker({ attemptId, title, candidate, questions, initialAnswers, deadlineMs, serverNowMs }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skew] = useState(() => serverNowMs - Date.now()); // écart d'horloge navigateur / serveur
  const submitted = useRef(false);
  const latest = useRef(answers);
  useEffect(() => {
    latest.current = answers;
  }, [answers]);
  const dirty = useRef(false);

  const finish = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setBusy(true);
    try {
      await submitAttemptAction(attemptId, latest.current);
    } catch {
      // la page d'attente relit l'état réel : le temps écoulé est de toute façon géré côté serveur
    }
    router.push(`/training/exams/attempt/${attemptId}`);
  }, [attemptId, router]);

  // Chronomètre : le serveur reste juge, ceci n'est que l'affichage et le rendu automatique.
  useEffect(() => {
    if (deadlineMs === null) return;
    const tick = () => {
      const left = deadlineMs - (Date.now() + skew);
      setRemaining(left);
      if (left <= 0) void finish();
    };
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [deadlineMs, finish, skew]);

  // Annonce vocale aux seuils de 5 minutes puis 1 minute (le texte ne change qu'à ces deux moments).
  const secondsLeft = remaining === null ? null : Math.ceil(remaining / 1000);
  const announce = secondsLeft === null || secondsLeft > 300 ? "" : secondsLeft > 60 ? "Il reste 5 minutes." : "Il reste 1 minute.";

  // Sauvegarde automatique après chaque modification.
  useEffect(() => {
    if (!dirty.current) return;
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const result = await saveDraftAction(attemptId, latest.current);
        if (!result.ok && result.expired) return void finish();
        setSaveState(result.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [answers, attemptId, finish]);

  function set(id: string, value: AnswerValue) {
    dirty.current = true;
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  const unanswered = useMemo(() => questions.filter((q) => {
    const a = answers[q.id];
    return a === undefined || a === "" || (Array.isArray(a) && a.length === 0) || (typeof a === "string" && !a.trim());
  }).length, [questions, answers]);

  async function submit() {
    const msg = unanswered ? `${unanswered} question(s) sans réponse. Rendre l'examen quand même ? Tu ne pourras plus le modifier.` : "Rendre l'examen ? Tu ne pourras plus le modifier.";
    if (!window.confirm(msg)) return;
    setError(null);
    await finish();
  }

  const urgent = remaining !== null && remaining <= 300_000;
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-white/95 border-b border-slate-200 flex items-center gap-4">
        <h1 className="text-[15px] font-bold text-slate-800 uppercase flex-1 truncate">{title}</h1>
        {remaining !== null && (
          <span data-testid="exam-timer" className={`font-mono text-[15px] font-bold tabular-nums ${urgent ? "text-red-700" : "text-slate-700"}`}>
            {fmt(remaining)}
          </span>
        )}
        <span className="text-[11px] text-slate-500 w-24 text-right" aria-live="off">
          {saveState === "saving" ? "Enregistrement…" : saveState === "saved" ? "Brouillon enregistré" : saveState === "error" ? "Échec de sauvegarde" : ""}
        </span>
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>

      <section aria-label="En-tête du candidat" className="mt-4 border border-slate-300 rounded p-3 text-[13px] grid sm:grid-cols-3 gap-2">
        <p><span className="text-slate-500">Nom : </span><strong>{candidate.name}</strong></p>
        <p><span className="text-slate-500">Grade : </span>{candidate.grade}</p>
        <p><span className="text-slate-500">Station : </span>{candidate.station}</p>
      </section>

      <ol className="mt-6 flex flex-col gap-8">
        {questions.map((q, index) => (
          <li key={q.id} data-testid="take-question" className="flex flex-col gap-3">
            <ExamQuestionHead question={q} index={index} />
            {q.type === "single" && (
              <div role="radiogroup" aria-label={q.prompt} className="flex flex-col gap-1.5">
                {q.options?.map((o) => (
                  <label key={o.id} className="flex items-start gap-2 text-[14px] cursor-pointer">
                    <input type="radio" name={q.id} className="mt-1" checked={answers[q.id] === o.id} onChange={() => set(q.id, o.id)} />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
            {q.type === "multiple" && (
              <div role="group" aria-label={q.prompt} className="flex flex-col gap-1.5">
                <p className="text-[12px] text-slate-500">Plusieurs réponses possibles.</p>
                {q.options?.map((o) => {
                  const current = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                  return (
                    <label key={o.id} className="flex items-start gap-2 text-[14px] cursor-pointer">
                      <input type="checkbox" className="mt-1" checked={current.includes(o.id)}
                        onChange={(e) => set(q.id, e.target.checked ? [...current, o.id] : current.filter((x) => x !== o.id))} />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            )}
            {q.type === "short" && (
              <input aria-label={q.prompt} className="w-full border-0 border-b border-slate-500 bg-transparent px-1 py-1 text-[14px] focus:outline-none focus:border-[#0d2644] focus:bg-[#f4f8fc]"
                maxLength={EXAM_LIMITS.shortAnswer} value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""} onChange={(e) => set(q.id, e.target.value)} />
            )}
            {q.type === "long" && (
              <textarea aria-label={q.prompt} rows={6} className="w-full border border-slate-500 px-2 py-1.5 text-[14px] focus:outline-none focus:border-[#0d2644] focus:bg-[#f4f8fc]"
                maxLength={EXAM_LIMITS.longAnswer} value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""} onChange={(e) => set(q.id, e.target.value)} />
            )}
          </li>
        ))}
      </ol>

      {error && <p role="alert" className="text-[13px] text-red-700 mt-4">{error}</p>}
      <div className="mt-8 mb-10 flex items-center gap-3">
        <button type="button" disabled={busy} onClick={submit} className="bg-[#0d2644] text-white text-[13px] font-bold uppercase tracking-wide rounded px-6 py-2.5 hover:bg-[#143a66] disabled:opacity-50">
          {busy ? "Envoi…" : "Rendre l'examen"}
        </button>
        <span className="text-[12px] text-slate-500">{questions.length - unanswered} / {questions.length} réponses</span>
      </div>
    </div>
  );
}
