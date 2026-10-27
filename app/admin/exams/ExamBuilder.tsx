"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExamQuestionHead } from "@/components/ExamQuestionHead";
import { shrinkImage } from "@/lib/client-image";
import { EXAM_KIND_LABEL, EXAM_LIMITS, QUESTION_TYPE_LABEL, formatPoints, isLayout, typesForKind, type ExamKind, isChoice, totalPoints, type ExamQuestion, type QuestionType } from "@/lib/exams-types";
import { newId } from "@/lib/forms-types";
import { saveExamAction } from "./actions";

type Initial = {
  title: string;
  description: string;
  durationMinutes: number | null;
  thresholdPercent: number | null;
  maxAttempts: number;
  published: boolean;
  kind?: ExamKind;
  manageFlags: string[];
  hasKey: boolean;
  questionsCount?: number;
  /** Clé actuelle lisible (absente pour un ancien examen dont la clé n'est stockée que chiffrée). */
  currentKey?: string | null;
  questions: ExamQuestion[];
};

const INPUT = "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#0d2644]";
const SMALL = "border border-slate-300 text-slate-700 text-[12px] rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30";

export function ExamBuilder({ examId, initial, allFlags = [] }: { examId: string | null; initial: Initial; allFlags?: { code: string; name: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [duration, setDuration] = useState(initial.durationMinutes?.toString() ?? "");
  const [threshold, setThreshold] = useState(initial.thresholdPercent?.toString() ?? "");
  const [maxAttempts, setMaxAttempts] = useState(String(initial.maxAttempts));
  const [published, setPublished] = useState(initial.published);
  const [kind, setKind] = useState<ExamKind>(initial.kind ?? "written");
  const practical = kind === "practical";
  const [newKey, setNewKey] = useState("");
  const [manageFlags, setManageFlags] = useState<string[]>(initial.manageFlags ?? []);
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
        title, description, durationMinutes: duration, thresholdPercent: threshold, maxAttempts, published, kind, manageFlags, newKey, questions,
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
        <fieldset className="text-[13px] flex flex-wrap items-center gap-4" data-testid="exam-kind">
          <legend className="sr-only">Type d&apos;examen</legend>
          <span className="font-bold">Type :</span>
          {(["written", "practical"] as const).map((k) => (
            <label key={k} className="flex items-center gap-1.5">
              <input type="radio" name="exam-kind" checked={kind === k} disabled={(initial.questionsCount ?? 0) > 0 && kind !== k}
                onChange={() => { setKind(k); setQuestions([]); }} />
              {EXAM_KIND_LABEL[k]}{k === "practical" ? " (rempli par l'instructeur)" : " (passé par le candidat avec une clé)"}
            </label>
          ))}
        </fieldset>
        <label className="text-[13px]">Nom de l&apos;examen
          <input className={INPUT} value={title} maxLength={EXAM_LIMITS.title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="text-[13px]">Consignes (affichées avant le début)
          <textarea className={INPUT} rows={3} value={description} maxLength={EXAM_LIMITS.description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className={`grid gap-3 ${practical ? "sm:grid-cols-1" : "sm:grid-cols-3"}`}>
          {!practical && <label className="text-[13px]">Durée (minutes, vide = sans chronomètre)
            <input className={INPUT} type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </label>}
          <label className="text-[13px]">Seuil de réussite indicatif (%)
            <input className={INPUT} type="number" min={1} max={100} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </label>
          {!practical && <label className="text-[13px]">Tentatives autorisées
            <input className={INPUT} type="number" min={1} max={20} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
          </label>}
        </div>
        <p className="text-[12px] text-slate-500">
          Le seuil n&apos;est qu&apos;un repère pour l&apos;examinateur : c&apos;est lui qui décide « réussi » ou « non réussi ».
          Total de l&apos;examen : <strong data-testid="exam-total">{formatPoints(total)} point{total > 1 ? "s" : ""}</strong>.
        </p>
        {!practical && <label className="text-[13px]">Clé d&apos;accès {initial.currentKey ? <span className="text-green-700">(actuelle : <strong data-testid="current-key">{initial.currentKey}</strong> — saisis-en une autre pour la remplacer)</span> : initial.hasKey ? <span className="text-green-700">(définie ✓ ancienne clé illisible — saisis-en une nouvelle pour la remplacer)</span> : <span className="text-amber-700">(à définir)</span>}
          <input className={INPUT} type="text" autoComplete="off" placeholder={initial.hasKey ? "Nouvelle clé (laisser vide pour garder l'actuelle)" : "Clé à donner aux candidats"} value={newKey} maxLength={EXAM_LIMITS.key} onChange={(e) => setNewKey(e.target.value)} />
        </label>}
        {!practical && <p className="text-[12px] text-slate-500">La clé est visible par les modérateurs et la Training Division (page « Clés et assignation »).</p>}
        {practical && <p className="text-[12px] text-slate-500">Examen pratique : pas de clé ni de chronomètre. Chaque critère est noté par l&apos;instructeur depuis Formation → Espace TD → Examens pratiques, ou depuis le carnet de probation du membre.</p>}
        <fieldset className="text-[13px] border border-slate-200 rounded p-3" data-testid="exam-manage-flags">
          <legend className="px-1 text-[12px] font-bold uppercase tracking-wide text-slate-600">Gérée par (flags)</legend>
          <p className="text-[12px] text-slate-500 mb-2">
            Aucun flag coché : tous les TD gèrent et corrigent cet examen. Sinon, seuls les TD qui possèdent au moins un des flags cochés
            (ex. OFFICER pour les examens de capitaine) y ont accès. Un TD qui prépare ce grade ne le voit donc pas.
          </p>
          {allFlags.length === 0 ? (
            <p className="text-[12px] text-slate-500">Aucun flag n&apos;existe encore (Administration → Accès &amp; flags).</p>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {allFlags.map((f) => (
                <label key={f.code} className="flex items-center gap-1.5" title={f.name}>
                  <input type="checkbox" checked={manageFlags.includes(f.code)}
                    onChange={(e) => setManageFlags((p) => (e.target.checked ? [...p, f.code] : p.filter((c) => c !== f.code)))} />
                  {f.code}
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <label className="text-[13px] flex items-center gap-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> {practical ? "Publié (les instructeurs peuvent l'ouvrir pour un membre)" : "Publié (les membres peuvent le passer avec la clé)"}
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600">{practical ? "Critères" : "Questions"} ({questions.length})</h2>
        {questions.map((q, index) => (
          <div key={q.id} data-testid="exam-question" className="border border-slate-200 rounded p-3 bg-slate-50 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-bold">{q.type === "heading" ? "Catégorie" : q.type === "note" ? "Texte" : practical ? `Critère ${questions.slice(0, index + 1).filter((x) => !isLayout(x.type)).length}` : `Question ${index + 1}`}</span>
              <select aria-label="Type de réponse" className="border border-slate-300 rounded px-2 py-1 text-[12px]" value={q.type} onChange={(e) => changeType(q, e.target.value as QuestionType)}>
                {typesForKind(kind).map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>)}
              </select>
              {!isLayout(q.type) && <label className="text-[12px] flex items-center gap-1">Points
                <input aria-label="Points de la question" type="number" min={0} max={EXAM_LIMITS.maxPoints} step={0.25} className="w-20 border border-slate-300 rounded px-2 py-1 text-[12px]" value={q.points} onChange={(e) => patch(q.id, { points: e.target.value === "" ? 0 : Number(e.target.value) })} />
              </label>}
              <span className="flex-1" />
              <button type="button" className={SMALL} disabled={index === 0} onClick={() => move(index, -1)} aria-label="Monter">↑</button>
              <button type="button" className={SMALL} disabled={index === questions.length - 1} onClick={() => move(index, 1)} aria-label="Descendre">↓</button>
              <button type="button" className={`${SMALL} text-red-700`} onClick={() => setQuestions((p) => p.filter((x) => x.id !== q.id))}>Supprimer</button>
            </div>
            {!isLayout(q.type) && <label className="text-[12px] text-slate-600">Mise en situation (facultatif)
              <textarea className={INPUT} rows={2} maxLength={EXAM_LIMITS.situation} value={q.situation} onChange={(e) => patch(q.id, { situation: e.target.value })} />
            </label>}
            {!isLayout(q.type) && <div className="text-[12px] text-slate-600">
              Image (facultatif)
              <div className="flex items-center gap-3 mt-1">
                <input type="file" aria-label="Image de la question" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(q, f); e.target.value = ""; }} />
                {q.imageId && <button type="button" className={SMALL} onClick={() => patch(q.id, { imageId: null })}>Retirer l&apos;image</button>}
              </div>
              {q.imageId && <ExamQuestionHead question={{ situation: "", imageId: q.imageId, prompt: "", points: 0 }} index={-1} showPoints={false} />}
            </div>}
            <label className="text-[12px] text-slate-600">{q.type === "heading" ? "Nom de la catégorie" : q.type === "note" ? "Texte explicatif" : q.type === "criterion" ? "Critère (la compétence évaluée)" : "Question"}
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
            {q.type === "criterion" && (
              <div className="flex flex-col gap-2" data-testid="criterion-extras">
                <label className="text-[12px] flex items-center gap-1.5">
                  <input type="checkbox" checked={q.eliminatory === true} onChange={(e) => patch(q.id, { eliminatory: e.target.checked })} />
                  Critère éliminatoire (doit être validé en totalité, sinon l&apos;examen ne peut pas être « réussi »)
                </label>
                <div className="border border-slate-200 bg-white rounded p-2 flex flex-col gap-1.5">
                  <p className="text-[12px] font-bold text-slate-600">Checklist (facultatif)</p>
                  <p className="text-[11px] text-slate-500">Ce qu&apos;on attend concrètement. Le critère est validé d&apos;office (points complets) quand tout est coché ; l&apos;examinateur peut toujours corriger la note à la main.</p>
                  {(q.checklist ?? []).map((item, i) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span aria-hidden className="text-slate-400">☐</span>
                      <input aria-label={`Point de checklist ${i + 1}`} className={INPUT} value={item.label} maxLength={EXAM_LIMITS.checklistLabel}
                        onChange={(e) => patch(q.id, { checklist: (q.checklist ?? []).map((x) => (x.id === item.id ? { ...x, label: e.target.value } : x)) })} />
                      <button type="button" className={SMALL} onClick={() => patch(q.id, { checklist: (q.checklist ?? []).filter((x) => x.id !== item.id) })}>Retirer</button>
                    </div>
                  ))}
                  {(q.checklist?.length ?? 0) < EXAM_LIMITS.checklistItems && (
                    <button type="button" className={`${SMALL} self-start`} onClick={() => patch(q.id, { checklist: [...(q.checklist ?? []), { id: newId("c"), label: "" }] })}>+ Ajouter un point</button>
                  )}
                </div>
              </div>
            )}
            {q.type !== "criterion" && !isLayout(q.type) && !isChoice(q.type) && <p className="text-[12px] text-slate-500">Réponse libre : corrigée à la main par l&apos;examinateur.</p>}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={SMALL} onClick={() => setQuestions((p) => [...p, practical ? { id: newId("q"), type: "criterion", prompt: "", situation: "", imageId: null, points: 1 } : { id: newId("q"), type: "single", prompt: "", situation: "", imageId: null, points: 1, options: [{ id: newId("o"), label: "Choix 1", correct: true }, { id: newId("o"), label: "Choix 2", correct: false }] }])}>
            {practical ? "+ Ajouter un critère" : "+ Ajouter une question"}
          </button>
          {practical && (
            <>
              <button type="button" className={SMALL} onClick={() => setQuestions((p) => [...p, { id: newId("q"), type: "heading", prompt: "", situation: "", imageId: null, points: 0 }])}>+ Nom de catégorie</button>
              <button type="button" className={SMALL} onClick={() => setQuestions((p) => [...p, { id: newId("q"), type: "note", prompt: "", situation: "", imageId: null, points: 0 }])}>+ Texte explicatif</button>
            </>
          )}
        </div>
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
