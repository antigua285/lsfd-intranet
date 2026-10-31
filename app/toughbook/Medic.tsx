"use client";

import { useMemo, useState } from "react";
import { PROTOCOLS, isAls, measure, onlyBls, protocolOf, protocolsByCategory, stepLevel, stripAls, type Level } from "@/lib/medic";

type Phase = "home" | "questions" | "guide";

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex justify-between gap-2 border-b border-slate-200 py-1">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`font-semibold text-right ${warn ? "text-red-700" : "text-slate-900"}`}>{v}</dd>
    </div>
  );
}

const BLS_BG = "#f0e1ad";
const ALS_BG = "#add7f0";
const LEVEL_UI: Record<Level, { label: string; bg: string }> = {
  BLS: { label: "BLS", bg: BLS_BG },
  ALS: { label: "ALS", bg: ALS_BG },
  MIX: { label: "BLS + ALS", bg: `linear-gradient(90deg, ${BLS_BG} 50%, ${ALS_BG} 50%)` },
};

/** RAPID LS County Medic : guide pas à pas, constantes typiques OOC. Aide RP, à valider par vos medics. */
export function Medic() {
  const [phase, setPhase] = useState<Phase>("home");
  const [sit, setSit] = useState<string>(PROTOCOLS[0].key);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState(0);
  const [blsOnly, setBlsOnly] = useState(false);

  const proto = protocolOf(sit);
  const allSteps = useMemo(() => proto.build(answers, extra), [proto, answers, extra]);
  const steps = useMemo(() => (blsOnly ? onlyBls(allSteps) : allSteps), [allSteps, blsOnly]);
  const stages = useMemo(() => (typeof proto.stages === "function" ? proto.stages(answers) : proto.stages), [proto, answers]);
  const vit = useMemo(() => (stages.length ? measure(stages[Math.min(stage, stages.length - 1)]) : null), [stages, stage]);
  const [q, setQ] = useState("");
  const questions = proto.questions;
  const ready = questions.every((q) => answers[q.id]);

  function start(key: string) {
    setSit(key); setAnswers({}); setExtra({}); setIdx(0);
    setStage(0);
    setPhase(protocolOf(key).questions.length === 0 ? "guide" : "questions");
  }
  function begin() {
    setIdx(0);
    setStage(proto.startStage(answers));
    setPhase("guide");
  }
  function switchToArrest(trauma: boolean) {
    setSit("arret"); setAnswers({ cause: trauma ? "trauma" : "med", wit: "oui" }); setExtra({}); setIdx(0); setStage(0);
  }
  const step = steps[Math.min(idx, steps.length - 1)];
  const needChoice = step.choice && !extra[step.choice.key];
  const better = proto.better;
  const canBetter = stage + better >= 0 && stage + better < stages.length;
  const canWorse = stage - better >= 0 && stage - better < stages.length;

  const header = (
    <div className="flex items-center justify-between bg-red-700 text-white px-3 py-1.5 text-[13px]">
      <strong className="tracking-wide">RAPID LS County Medic</strong>
      {phase !== "home" && <button type="button" className="underline text-[12px]" onClick={() => setPhase("home")}>Nouvelle situation</button>}
    </div>
  );

  if (phase === "home") {
    return (
      <div className="h-full flex flex-col bg-white text-slate-900">
        {header}
        <div className="flex-1 overflow-auto p-4">
          <h2 className="text-[15px] font-bold mb-3">Quelle situation ?</h2>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un protocole…" aria-label="Rechercher un protocole" data-testid="medic-search" className="w-full mb-3 rounded border border-slate-300 px-3 py-1.5 text-[14px]" />
          {protocolsByCategory(q).map((g) => (
            <section key={g.category} className="mb-4" aria-label={g.category}>
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">{g.category}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {g.items.map((p) => (
                  <button key={p.key} type="button" onClick={() => start(p.key)} className="text-left rounded border-2 border-red-700 bg-red-50 hover:bg-red-100 p-3">
                    <span className="block text-[15px] font-bold text-red-800">{p.title}</span>
                    <span className="block text-[12px] text-slate-600 mt-1">{p.desc}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "questions") {
    return (
      <div className="h-full flex flex-col bg-white text-slate-900">
        {header}
        <div className="flex-1 overflow-auto p-4">
          <h2 className="text-[15px] font-bold mb-3">{proto.title} : état du patient</h2>
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
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white text-slate-900">
      {header}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <section className={`${vit ? "md:w-3/5 border-b md:border-b-0 md:border-r" : "flex-1"} min-h-0 flex flex-col border-slate-300`} aria-label="Étapes">
          <div className="flex-1 overflow-auto p-3">
            <div className="flex items-center gap-0.5 mb-2" aria-label="Progression" data-testid="medic-progress">
              {steps.map((st, i) => (
                <span key={st.id} title={st.title} style={{ background: LEVEL_UI[stepLevel(st)].bg }} className={`h-2 flex-1 rounded-full border border-slate-400/60 ${i === Math.min(idx, steps.length - 1) ? "ring-2 ring-offset-1 ring-slate-800" : i < idx ? "opacity-40" : ""}`} />
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Étape {Math.min(idx, steps.length - 1) + 1} / {steps.length}{step.tag ? ` · ${step.tag}` : ""}</p>
              <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[11px]" role="group" aria-label="Niveau affiché">
                <button type="button" aria-pressed={!blsOnly} data-testid="medic-all" onClick={() => { setBlsOnly(false); setIdx(0); }} className={`px-2 py-0.5 ${!blsOnly ? "bg-slate-800 text-white" : "bg-white"}`}>BLS + ALS</button>
                <button type="button" aria-pressed={blsOnly} data-testid="medic-bls" onClick={() => { setBlsOnly(true); setIdx(0); }} className={`px-2 py-0.5 ${blsOnly ? "bg-slate-800 text-white" : "bg-white"}`}>BLS seul</button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 mb-2">
              <h2 className="text-[16px] font-bold" data-testid="medic-step-title">{step.title}</h2>
              <span style={{ background: LEVEL_UI[stepLevel(step)].bg }} className="text-[11px] font-bold text-slate-900 rounded border border-slate-500/50 px-2 py-0.5 whitespace-nowrap" data-testid="medic-level">{LEVEL_UI[stepLevel(step)].label}</span>
            </div>
            <ol className="space-y-1.5 text-[14px]">
              {step.lines.map((l, i) => (
                <li key={i} style={{ background: isAls(l) ? ALS_BG : BLS_BG }} className="pl-2 pr-2 py-1 rounded text-slate-900">
                  {isAls(l) && <span className="mr-1.5 text-[10px] font-bold text-slate-900 bg-white/70 border border-slate-500/50 rounded px-1 align-middle">ALS</span>}
                  {stripAls(l)}
                </li>
              ))}
            </ol>
            {step.doses && step.doses.length > 0 && (
              <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-2 text-[13px]">
                <p className="font-semibold text-amber-900">Posologies / réglages</p>
                <ul className="list-disc pl-5">{step.doses.map((d, i) => <li key={i}>{isAls(d) && <span style={{ background: ALS_BG }} className="mr-1 text-[10px] font-bold text-slate-900 border border-slate-500/50 rounded px-1">ALS</span>}{stripAls(d)}</li>)}</ul>
              </div>
            )}
            {step.detail && (
              <div className="mt-3 rounded bg-slate-100 border border-slate-200 p-2 text-[12.5px] text-slate-700" data-testid="medic-detail">
                <p className="font-semibold text-slate-800 mb-0.5">Précisions d&apos;exécution</p>
                <ul className="list-disc pl-5 space-y-0.5">{step.detail.map((d, i) => <li key={i}>{d}</li>)}</ul>
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
        {vit && (
        <section className="md:w-2/5 min-h-0 overflow-auto p-3 text-[13px]" aria-label="Constantes">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-[14px]">Constantes typiques (plages)</h3>
            <span className="text-[11px] rounded bg-slate-200 px-2 py-0.5" data-testid="medic-stage">{vit.label}</span>
          </div>
          <dl>
            <Row k="Fréquence cardiaque" v={vit.fc === "—" ? "Pouls absent (arrêt)" : `${vit.fc} /min`} />
            <Row k="Tension" v={vit.ta === "Imprenable" ? vit.ta : `${vit.ta} mmHg`} warn={vit.ta !== "Imprenable" && vit.tasHi < 90} />
            <Row k="SpO2" v={vit.spo2 === "Non mesurable" ? vit.spo2 : `${vit.spo2} %`} warn={vit.spo2 !== "Non mesurable" && vit.spo2Hi < 94} />
            <Row k="Fréquence respiratoire" v={`${vit.fr} /min`} />
            {vit.etco2 && <Row k="EtCO2" v={`${vit.etco2} mmHg`} warn={(vit.etco2Hi ?? 99) < 10} />}
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
            <button type="button" disabled={!canBetter} onClick={() => { setStage((s) => s + better); }} className="px-2 py-1 rounded border border-green-700 text-green-800 bg-green-50 disabled:opacity-40">{proto.betterLabel}</button>
            <button type="button" disabled={!canWorse} onClick={() => { setStage((s) => s - better); }} className="px-2 py-1 rounded border border-red-700 text-red-800 bg-red-50 disabled:opacity-40">{proto.worseLabel}</button>
            {proto.arrestAt && stage === proto.arrestAt.stage && (
              <button type="button" onClick={() => switchToArrest(proto.arrestAt!.trauma)} className="px-2 py-1 rounded bg-red-700 text-white">{proto.arrestAt.trauma ? "Arrêt cardiaque traumatique" : "Arrêt cardiaque"}</button>
            )}
          </div>
        </section>
        )}
      </div>
    </div>
  );
}
