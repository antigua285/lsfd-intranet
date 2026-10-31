"use client";

import { useMemo, useState } from "react";
import { ARREST_STAGES, HEMO_STAGES, QUESTIONS, SITUATIONS, buildSteps, hemoStartStage, measure, oocAnnounce, type SituationKey } from "@/lib/medic";

type Phase = "home" | "questions" | "guide";

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex justify-between gap-2 border-b border-slate-200 py-1">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`font-semibold text-right ${warn ? "text-red-700" : "text-slate-900"}`}>{v}</dd>
    </div>
  );
}

/** RAPID LS County Medic : guide pas à pas, constantes typiques OOC. Aide RP, à valider par vos medics. */
export function Medic() {
  const [phase, setPhase] = useState<Phase>("home");
  const [sit, setSit] = useState<SituationKey>("arret");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState(0);
  const [n, setN] = useState(0);
  const [seed, setSeed] = useState(1);
  const [copied, setCopied] = useState(false);

  const steps = useMemo(() => buildSteps(sit, answers, extra), [sit, answers, extra]);
  const stages = sit === "arret" ? ARREST_STAGES : HEMO_STAGES;
  const vit = useMemo(() => measure(stages[Math.min(stage, stages.length - 1)], seed, n), [stages, stage, seed, n]);
  const questions = QUESTIONS[sit];
  const ready = questions.every((q) => answers[q.id]);

  function start(s: SituationKey) {
    setSit(s); setAnswers({}); setExtra({}); setIdx(0); setN(0); setCopied(false);
    setSeed((v) => v * 31 + 7);
    setStage(0);
    setPhase("questions");
  }
  function begin() {
    setIdx(0); setN(0);
    setStage(sit === "hemorragie" ? hemoStartStage(answers) : 0);
    setPhase("guide");
  }
  function switchToArrest(trauma: boolean) {
    setSit("arret"); setAnswers({ cause: trauma ? "trauma" : "med", wit: "oui" }); setExtra({}); setIdx(0); setStage(0); setN((v) => v + 1); setCopied(false);
  }
  const step = steps[Math.min(idx, steps.length - 1)];
  const needChoice = step.choice && !extra[step.choice.key];
  const better = sit === "arret" ? 1 : -1;
  const canBetter = stage + better >= 0 && stage + better < stages.length;
  const canWorse = stage - better >= 0 && stage - better < stages.length;
  const announce = oocAnnounce(vit);

  async function copy() {
    try { await navigator.clipboard.writeText(announce); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* presse-papiers refusé */ }
  }

  const header = (
    <div className="flex items-center justify-between bg-red-700 text-white px-3 py-1.5 text-[13px]">
      <strong className="tracking-wide">RAPID LS County Medic</strong>
      {phase !== "home" && <button type="button" className="underline text-[12px]" onClick={() => setPhase("home")}>Nouvelle situation</button>}
    </div>
  );
  const notice = <p className="text-[11px] text-slate-500 px-3 py-1 border-t border-slate-200 bg-slate-50">Aide RP : à valider par vos medics. Les constantes sont indicatives et à annoncer en OOC.</p>;

  if (phase === "home") {
    return (
      <div className="h-full flex flex-col bg-white text-slate-900">
        {header}
        <div className="flex-1 overflow-auto p-4">
          <h2 className="text-[15px] font-bold mb-3">Quelle situation ?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SITUATIONS.map((s) => (
              <button key={s.key} type="button" onClick={() => start(s.key)} className="text-left rounded border-2 border-red-700 bg-red-50 hover:bg-red-100 p-4">
                <span className="block text-[15px] font-bold text-red-800">{s.title}</span>
                <span className="block text-[12px] text-slate-600 mt-1">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>
        {notice}
      </div>
    );
  }

  if (phase === "questions") {
    return (
      <div className="h-full flex flex-col bg-white text-slate-900">
        {header}
        <div className="flex-1 overflow-auto p-4">
          <h2 className="text-[15px] font-bold mb-3">{SITUATIONS.find((s) => s.key === sit)!.title} : état du patient</h2>
          <div className="space-y-4">
            {questions.map((q) => (
              <fieldset key={q.id}>
                <legend className="text-[13px] font-semibold mb-1">{q.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((o) => (
                    <button key={o.id} type="button" aria-pressed={answers[q.id] === o.id} onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))} className={`px-3 py-1.5 rounded border text-[13px] ${answers[q.id] === o.id ? "bg-red-700 text-white border-red-700" : "bg-white border-slate-300 hover:bg-slate-100"}`}>{o.label}</button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <button type="button" disabled={!ready} onClick={begin} className="mt-5 px-4 py-2 rounded bg-red-700 text-white font-semibold disabled:opacity-40">Démarrer le guide</button>
        </div>
        {notice}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white text-slate-900">
      {header}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <section className="md:w-3/5 min-h-0 flex flex-col border-b md:border-b-0 md:border-r border-slate-300" aria-label="Étapes">
          <div className="flex-1 overflow-auto p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Étape {Math.min(idx, steps.length - 1) + 1} / {steps.length}{step.tag ? ` · ${step.tag}` : ""}</p>
            <h2 className="text-[16px] font-bold mt-0.5 mb-2" data-testid="medic-step-title">{step.title}</h2>
            <ol className="list-decimal pl-5 space-y-1.5 text-[14px]">
              {step.lines.map((l, i) => <li key={i}>{l}</li>)}
            </ol>
            {step.doses && (
              <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-2 text-[13px]">
                <p className="font-semibold text-amber-900">Posologies / réglages</p>
                <ul className="list-disc pl-5">{step.doses.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </div>
            )}
            {step.choice && (
              <div className="mt-3">
                <p className="text-[13px] font-semibold mb-1">Rythme observé sur le scope :</p>
                <div className="flex flex-wrap gap-2">
                  {step.choice.options.map((o) => (
                    <button key={o.id} type="button" aria-pressed={extra[step.choice!.key] === o.id} onClick={() => setExtra((e) => ({ ...e, [step.choice!.key]: o.id }))} className={`px-3 py-1.5 rounded border text-[13px] ${extra[step.choice!.key] === o.id ? "bg-red-700 text-white border-red-700" : "bg-white border-slate-300 hover:bg-slate-100"}`}>{o.label}{o.hint ? ` (${o.hint})` : ""}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 p-2 border-t border-slate-200 bg-slate-50">
            <button type="button" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))} className="px-3 py-1.5 rounded border border-slate-300 bg-white disabled:opacity-40">Étape précédente</button>
            <button type="button" disabled={idx >= steps.length - 1 || !!needChoice} onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))} className="px-3 py-1.5 rounded bg-red-700 text-white font-semibold disabled:opacity-40">Étape suivante</button>
            {needChoice && <span className="self-center text-[12px] text-slate-500">Choisir le rythme pour continuer</span>}
          </div>
        </section>
        <section className="md:w-2/5 min-h-0 overflow-auto p-3 text-[13px]" aria-label="Constantes">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-[14px]">Constantes typiques</h3>
            <span className="text-[11px] rounded bg-slate-200 px-2 py-0.5" data-testid="medic-stage">{vit.label}</span>
          </div>
          <dl>
            <Row k="Fréquence cardiaque" v={vit.fc === "—" ? "Pouls absent" : `${vit.fc} /min`} />
            <Row k="Tension" v={vit.ta === "Imprenable" ? vit.ta : `${vit.ta} mmHg`} warn={vit.ta !== "Imprenable" && Number(vit.ta.split("/")[0]) < 90} />
            <Row k="SpO2" v={vit.spo2 === "Non mesurable" ? vit.spo2 : `${vit.spo2} %`} warn={vit.spo2 !== "Non mesurable" && Number(vit.spo2) < 94} />
            <Row k="Fréquence respiratoire" v={`${vit.fr} /min`} />
            {vit.etco2 && <Row k="EtCO2" v={`${vit.etco2} mmHg`} warn={Number(vit.etco2) < 10} />}
            <Row k="Glycémie" v={`${vit.gly} g/L`} />
            <Row k="Température" v={`${vit.temp} °C`} />
            <Row k="Glasgow" v={vit.gcs} warn={Number(vit.gcs) <= 8} />
            <Row k="Recoloration" v={vit.trc} />
            <Row k="Pupilles" v={vit.pupilles} />
            <Row k="Peau" v={vit.peau} />
            <Row k="Pouls" v={vit.pouls} />
            <Row k="Respiration" v={vit.resp} />
          </dl>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" onClick={() => setN((v) => v + 1)} className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100">Nouvelle mesure</button>
            <button type="button" disabled={!canBetter} onClick={() => { setStage((s) => s + better); setN((v) => v + 1); }} className="px-2 py-1 rounded border border-green-700 text-green-800 bg-green-50 disabled:opacity-40">{sit === "arret" ? "Retour à la circulation" : "Amélioration"}</button>
            <button type="button" disabled={!canWorse} onClick={() => { setStage((s) => s - better); setN((v) => v + 1); }} className="px-2 py-1 rounded border border-red-700 text-red-800 bg-red-50 disabled:opacity-40">{sit === "arret" ? "Re-arrêt" : "Aggravation"}</button>
            {sit === "hemorragie" && stage === HEMO_STAGES.length - 1 && (
              <button type="button" onClick={() => switchToArrest(true)} className="px-2 py-1 rounded bg-red-700 text-white">Arrêt cardiaque traumatique</button>
            )}
          </div>
          <div className="mt-3 rounded border border-slate-300 bg-slate-50 p-2">
            <p className="font-semibold mb-1">Annonce OOC prête</p>
            <p className="text-[12px] text-slate-800" data-testid="medic-announce">{announce}</p>
            <button type="button" onClick={copy} className="mt-1 px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-[12px]">{copied ? "Copié" : "Copier"}</button>
          </div>
        </section>
      </div>
      {notice}
    </div>
  );
}
