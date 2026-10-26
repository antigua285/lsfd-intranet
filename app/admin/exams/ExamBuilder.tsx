"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExamQuestionHead } from "@/components/ExamQuestionHead";
import { shrinkImage } from "@/lib/client-image";
import { EXAM_LIMITS, QUESTION_TYPES, QUESTION_TYPE_LABEL, formatPoints, isChoice, totalPoints, type ExamQuestion, type QuestionType } from "@/lib/exams-types";
import { newId } from "@/lib/forms-types";
import { saveExamAction } from "./actions";

type Initial = {
  title: string;
  description: string;
  durationMinutes: number | null;
  thresholdPercent: number | null;
  maxAttempts: number;
  published: boolean;
  hasKey: boolean;
  /** Clé actuelle lisible (absente pour un ancien examen dont la clé n'est stockée que chiffrée). */
  currentKey?: string | null;
  questions: ExamQuestion[];
};

const INPUT = "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#0d2644]";
const SMALL = "border border-slate-300 text-slate-700 text-[12px] rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30";

export function ExamBuilder({ examId, initial }: { examId: string | null; initial: Initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [duration, setDuration] = useState(initial.durationMinutes?.toString() ?? "");
  const [threshold, setThreshold] = useState(initial.thresholdPercent?.toString() ?? "");
  const [maxAttempts, setMaxAttempts] = useState(String(initial.maxAttempts));
  const [published, setPublished] = useState(initial.published);
  const [newKey, setNewKey] = useState("");
  const [questions, setQuestions] = useState<ExamQuestion[]>(initial.questions);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const patch = (id: string, p: Partial<ExamQuestion>) => setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...p } : q)));
  const move = (i: number, d: number) =>
    setQuestions((prev) => { const n = [...prev]; const t = i + d; if (t < 0 || t >= n.length) return prev; [n[i], n[t]] = [n[t], n[i]]; return n; });

  function changeType(q: ExamQuestion, type: QuestionType) {
    if (isChoice(type)) {
      const options = q.options?.length ? q.options : [
        { id: newId("o"), label: "Choix 1", correct: true },
        { id: newId("o"), label: "Choix 2", correct: false },
      ];
      // choix unique : une seule bonne réponse
      const fixed = type === "single" ? options.map((o, i) => ({ ...o, correct: i === Math.max(0, options.findIndex((x) => x.correct)) })) : options;
      patch(q.id, { type, options: fixed });
    } else {
      patch(q.id, { type, options: undefined });
    }
  }

  async function uploadImage(q: ExamQuestion, file: File) {
    setMessage(null);
    try {
      const small = await shrinkImage(file);
      const body = new FormData();
      body.append("file", small);
      const res = await fetch("/api/exam-images", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) return setMessage({ ok: false, text: data.error ?? "Envoi de l'image impossible." });
      patch(q.id, { imageId: data.id });
    } catch {
      setMessage({ ok: false, text: "Image illisible ou envoi impossible." });
    }
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await saveExamAction(examId, {
        title, description, durationMinutes: duration, thresholdPercent: threshold, maxAttempts, published, newKey, questions,
      });
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      setMessage({ ok: true, text: "Examen enregistré." });
      setNewKey("");
      if (examId === null) router.replace(`/admin/exams/${result.id}`);
      else router.refresh();
    } catch {
      setMessage({ ok: false, text: "L'enregistrement a échoué (session expirée ?)." });
    } finally {
      setBusy(false);
    }
  }

  const total = totalPoints(questions);
  return (
    <div className="flex flex-col gap-5">
      <section className="border border-slate-200 rounded p-4 flex flex-col gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600">Examen</h2>
        <label className="text-[13px]">Nom de l&apos;examen
          <input className={INPUT} value={title} maxLength={EXAM_LIMITS.title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="text-[13px]">Consignes (affichées avant le début)
          <textarea className={INPUT} rows={3} value={description} maxLength={EXAM_LIMITS.description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-[13px]">Durée (minutes, vide = sans chronomètre)
            <input className={INPUT} type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </label>
          <label className="text-[13px]">Seuil de réussite indicatif (%)
            <input className={INPUT} type="number" min={1} max={100} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </label>
          <label className="text-[13px]">Tentatives autorisées
            <input className={INPUT} type="number" min={1} max={20} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
          </label>
        </div>
        <p className="text-[12px] text-slate-500">
          Le seuil n&apos;est qu&apos;un repère pour l&apos;examinateur : c&apos;est lui qui décide « réussi » ou « non réussi ».
          Total de l&apos;examen : <strong data-testid="exam-total">{formatPoints(total)} point{total > 1 ? "s" : ""}</strong>.
        </p>
        <label className="text-[13px]">Clé d&apos;accès {initial.currentKey ? <span className="text-green-700">(actuelle : <strong data-testid="current-key">{initial.currentKey}</strong> — saisis-en une autre pour la remplacer)</span> : initial.hasKey ? <span className="text-green-700">(définie ✓ ancienne clé illisible — saisis-en une nouvelle pour la remplacer)</span> : <span className="text-amber-700">(à définir)</span>}
          <input className={INPUT} type="text" autoComplete="off" placeholder={initial.hasKey ? "Nouvelle clé (laisser vide pour garder l'actuelle)" : "Clé à donner aux candidats"} value={newKey} maxLength={EXAM_LIMITS.key} onChange={(e) => setNewKey(e.target.value)} />
        </label>
        <p className="text-[12px] text-slate-500">La clé est visible par les modérateurs et la Training Division (page « Clés et assignation »).</p>
        <label className="text-[13px] flex items-center gap-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publié (les membres peuvent le passer avec la clé)
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600">Questions ({questions.length})</h2>
        {questions.map((q, index) => (
          <div key={q.id} data-testid="exam-question" className="border border-slate-200 rounded p-3 bg-slate-50 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-bold">Question {index + 1}</span>
              <select aria-label="Type de réponse" className="border border-slate-300 rounded px-2 py-1 text-[12px]" value={q.type} onChange={(e) => changeType(q, e.target.value as QuestionType)}>
                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>)}
              </select>
              <label className="text-[12px] flex items-center gap-1">Points
                <input aria-label="Points de la question" type="number" min={0} max={EXAM_LIMITS.maxPoints} step={0.25} className="w-20 border border-slate-300 rounded px-2 py-1 text-[12px]" value={q.points} onChange={(e) => patch(q.id, { points: e.target.value === "" ? 0 : Number(e.target.value) })} />
              </label>
              <span className="flex-1" />
              <button type="button" className={SMALL} disabled={index === 0} onClick={() => move(index, -1)} aria-label="Monter">↑</button>
              <button type="button" className={SMALL} disabled={index === questions.length - 1} onClick={() => move(index, 1)} aria-label="Descendre">↓</button>
              <button type="button" className={`${SMALL} text-red-700`} onClick={() => setQuestions((p) => p.filter((x) => x.id !== q.id))}>Supprimer</button>
            </div>
            <label className="text-[12px] text-slate-600">Mise en situation (facultatif)
              <textarea className={INPUT} rows={2} maxLength={EXAM_LIMITS.situation} value={q.situation} onChange={(e) => patch(q.id, { situation: e.target.value })} />
            </label>
            <div className="text-[12px] text-slate-600">
              Image (facultatif)
              <div className="flex items-center gap-3 mt-1">
                <input type="file" aria-label="Image de la question" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(q, f); e.target.value = ""; }} />
                {q.imageId && <button type="button" className={SMALL} onClick={() => patch(q.id, { imageId: null })}>Retirer l&apos;image</button>}
              </div>
              {q.imageId && <ExamQuestionHead question={{ situation: "", imageId: q.imageId, prompt: "", points: 0 }} index={-1} showPoints={false} />}
            </div>
            <label className="text-[12px] text-slate-600">Question
              <textarea className={INPUT} rows={2} maxLength={EXAM_LIMITS.prompt} value={q.prompt} onChange={(e) => patch(q.id, { prompt: e.target.value })} />
            </label>
            {isChoice(q.type) && (
              <div className="flex flex-col gap-1">
                <p className="text-[12px] text-slate-600">Choix — coche {q.type === "single" ? "la bonne réponse" : "les bonnes réponses"} :</p>
                {q.options?.map((o) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <input type={q.type === "single" ? "radio" : "checkbox"} name={`correct-${q.id}`} aria-label="Bonne réponse" checked={!!o.correct}
                      onChange={(e) => patch(q.id, { options: q.options!.map((x) => (q.type === "single" ? { ...x, correct: x.id === o.id } : x.id === o.id ? { ...x, correct: e.target.checked } : x)) })} />
                    <input aria-label="Texte du choix" className={INPUT} value={o.label} maxLength={EXAM_LIMITS.option} onChange={(e) => patch(q.id, { options: q.options!.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })} />
                    <button type="button" className={SMALL} disabled={(q.options?.length ?? 0) <= 2} onClick={() => patch(q.id, { options: q.options!.filter((x) => x.id !== o.id) })}>Retirer</button>
                  </div>
                ))}
                {(q.options?.length ?? 0) < EXAM_LIMITS.options && (
                  <button type="button" className={`${SMALL} self-start`} onClick={() => patch(q.id, { options: [...(q.options ?? []), { id: newId("o"), label: `Choix ${(q.options?.length ?? 0) + 1}`, correct: false }] })}>+ Ajouter un choix</button>
                )}
              </div>
            )}
            {!isChoice(q.type) && <p className="text-[12px] text-slate-500">Réponse libre : corrigée à la main par l&apos;examinateur.</p>}
          </div>
        ))}
        <button type="button" className={`${SMALL} self-start`} onClick={() => setQuestions((p) => [...p, { id: newId("q"), type: "single", prompt: "", situation: "", imageId: null, points: 1, options: [{ id: newId("o"), label: "Choix 1", correct: true }, { id: newId("o"), label: "Choix 2", correct: false }] }])}>
          + Ajouter une question
        </button>
      </section>

      <div className="flex items-center gap-3 sticky bottom-0 bg-white/90 py-3 border-t border-slate-200">
        <button type="button" disabled={busy} onClick={save} className="bg-[#0d2644] text-white text-[13px] font-bold uppercase tracking-wide rounded px-5 py-2 hover:bg-[#143a66] disabled:opacity-50">
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {message && <p role={message.ok ? "status" : "alert"} className={`text-[13px] ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}
      </div>
    </div>
  );
}
