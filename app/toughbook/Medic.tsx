"use client";

import { useMemo, useState } from "react";
import { MedicToolPanel } from "./MedicTools";
import { TOOLS, type ToolKey } from "@/lib/medic-tools";
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

/** Découpe les précisions : lignes libres, puis volets (intertitres « ## »). */
function splitDetail(detail: string[]) {
  const intro: string[] = [];
  const groups: { title: string; items: string[] }[] = [];
  for (const d of detail) {
    if (d.startsWith("## ")) groups.push({ title: d.slice(3), items: [] });
    else if (groups.length) groups[groups.length - 1].items.push(d);
    else intro.push(d);
  }
  return { intro, groups: groups.filter((g) => g.items.length > 0) };
}

function Detail({ stepId, detail }: { stepId: string; detail: string[] }) {
  const { intro, groups } = splitDetail(detail);
  const [all, setAll] = useState<boolean | null>(null);
  return (
    <div className="mt-3 text-[12.5px] text-slate-700" data-testid="medic-detail">
      {intro.length > 0 && (
        <div className="rounded bg-slate-100 border border-slate-200 p-2">
          <p className="font-semibold text-slate-800 mb-0.5">Précisions d&apos;exécution</p>
          <ul className="list-disc pl-5 space-y-0.5">{intro.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
      )}
      {groups.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-800">Gestes et techniques <span className="font-normal text-slate-500">({groups.length})</span></p>
            <button type="button" data-testid="medic-toggle-all" onClick={() => setAll((a) => (a ? false : true))} className="min-h-8 px-2 rounded border border-slate-300 bg-white text-[12px]">{all ? "Tout replier" : "Tout déplier"}</button>
          </div>
          <div className="space-y-1">
            {groups.map((g, i) => (
              <details key={`${stepId}-${i}-${all}`} open={all ?? g.title === "Marche à suivre"} className="group rounded border border-slate-300 bg-white" data-testid="medic-gesture">
                <summary className="flex items-center gap-2 min-h-10 px-2 py-1 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
                  <span aria-hidden="true" className="text-slate-500 transition-transform group-open:rotate-90">▸</span>
                  <span className="flex-1 min-w-0 font-semibold text-slate-800 leading-tight">{g.title}</span>
                  <span className="text-[11px] text-slate-500">{g.items.length}</span>
                </summary>
                <ul className="list-disc pl-7 pr-2 pb-2 space-y-0.5">{g.items.map((d, j) => <li key={j}>{d}</li>)}</ul>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** RAPID LS County Medic : guide pas à pas, constantes typiques OOC. Aide RP, à valider par vos medics. */
export function Medic({ onOpenApp }: { onOpenApp?: (key: string, preset?: { zone?: string }) => void } = {}) {
  const [phase, setPhase] = useState<Phase>("home");
  const [sit, setSit] = useState<string>(PROTOCOLS[0].key);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState(0);
  const [blsOnly, setBlsOnly] = useState(false);
  const [tool, setTool] = useState<ToolKey | null>(null);
  const [seen, setSeen] = useState<ToolKey[]>([]);
  const openTool = (k: ToolKey) => { setSeen((s) => (s.includes(k) ? s : [...s, k])); setTool(k); };
  const [tab, setTab] = useState<"steps" | "vitals">("steps");

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
    setTab("steps");
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
    <>
      <div className="shrink-0 flex items-center gap-1.5 bg-red-700 text-white px-2 py-1 text-[13px]">
        <strong className="tracking-wide truncate flex-1 min-w-0">RAPID LS County Medic</strong>
        {phase !== "home" && (
          <button type="button" aria-label="Nouvelle situation" onClick={() => setPhase("home")} className="min-h-9 px-2.5 rounded border border-white/50 text-[12px]">
            <span className="hidden sm:inline">Nouvelle situation</span><span className="sm:hidden">Accueil</span>
          </button>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-1.5 bg-slate-100 border-b border-slate-300 px-2 py-1 overflow-x-auto" role="toolbar" aria-label="Outils">
        <span className="text-[11px] uppercase tracking-wide text-slate-500 shrink-0">Outils</span>
        {TOOLS.map((t) => (
          <button key={t.key} type="button" data-testid={`tool-${t.key}`} onClick={() => openTool(t.key)} className="shrink-0 min-h-9 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-[12.5px] font-semibold">{t.label}</button>
        ))}
        {onOpenApp && (
          <button type="button" data-testid="open-drugs" onClick={() => onOpenApp("drugs", sit === "arret-pediatrique" && answers.poids ? { zone: answers.poids } : undefined)} className="shrink-0 min-h-9 px-3 rounded-md border border-[#0f5b63] bg-[#0f5b63] text-white text-[12.5px] font-semibold">Doses ↗</button>
        )}
      </div>
    </>
  );
  const wrap = (children: React.ReactNode) => (
    <div className="relative h-full flex flex-col bg-white text-slate-900">
      {header}
      {children}
      {TOOLS.filter((t) => seen.includes(t.key)).map((t) => (
        <MedicToolPanel key={t.key} tool={t.key} visible={tool === t.key} onClose={() => setTool(null)} />
      ))}
    </div>
  );

  if (phase === "home") {
    return wrap(
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="sticky top-0 z-[1] bg-white/95 backdrop-blur px-2 pt-1.5 pb-1.5 border-b border-slate-200">
          <h2 className="text-[13px] font-bold mb-1">Quelle situation ?</h2>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un protocole…" aria-label="Rechercher un protocole" data-testid="medic-search" className="w-full min-h-10 rounded-md border border-slate-300 px-3 text-[14px]" />
        </div>
        <div className="px-2 pb-3">
          {protocolsByCategory(q).map((g) => (
            <section key={g.category} className="mt-2.5" aria-label={g.category}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 px-0.5">{g.category}</h3>
              <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                {g.items.map((p) => (
                  <button key={p.key} type="button" onClick={() => start(p.key)} className="text-left min-h-11 rounded-md border border-slate-200 border-l-[3px] border-l-red-700 bg-white hover:bg-red-50 active:bg-red-100 px-2.5 py-1.5">
                    <span className="block text-[13.5px] font-semibold text-slate-900 leading-tight">{p.title}</span>
                    <span className="block text-[11.5px] text-slate-500 leading-tight line-clamp-1">{p.desc}</span>
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
    return wrap(
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <h2 className="text-[14px] font-bold mb-2">{proto.title} : état du patient</h2>
        <div className="space-y-3">
          {questions.map((q) => (
            <fieldset key={q.id}>
              <legend className="text-[12.5px] font-semibold mb-1">{q.label}</legend>
              <div className="flex flex-wrap gap-1.5">
                {q.options.map((o) => (
                  <button key={o.id} type="button" aria-pressed={answers[q.id] === o.id} onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))} className={`min-h-10 px-3 rounded-md border text-[13px] ${answers[q.id] === o.id ? "bg-red-700 text-white border-red-700" : "bg-white border-slate-300 hover:bg-slate-100"}`}>{o.label}</button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <button type="button" disabled={!ready} onClick={begin} className="mt-4 w-full sm:w-auto min-h-11 px-5 rounded-md bg-red-700 text-white font-semibold text-[14px] disabled:opacity-40">Démarrer le guide</button>
      </div>
    );
  }

  const si = Math.min(idx, steps.length - 1);
  return wrap(
    <>
      {vit && (
        <div className="md:hidden shrink-0 grid grid-cols-2 border-b border-slate-300 text-[13px]" role="tablist" aria-label="Affichage">
          <button type="button" role="tab" aria-selected={tab === "steps"} onClick={() => setTab("steps")} className={`min-h-10 font-semibold ${tab === "steps" ? "bg-slate-800 text-white" : "bg-slate-100"}`}>Étapes</button>
          <button type="button" role="tab" aria-selected={tab === "vitals"} onClick={() => setTab("vitals")} className={`min-h-10 font-semibold ${tab === "vitals" ? "bg-slate-800 text-white" : "bg-slate-100"}`}>Constantes</button>
        </div>
      )}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <section className={`${vit ? "md:w-3/5 md:border-r" : "flex-1"} ${tab === "steps" || !vit ? "flex" : "hidden md:flex"} min-h-0 flex-col border-slate-300`} aria-label="Étapes">
          <div className="flex-1 overflow-auto p-2.5">
            <div className="flex items-center gap-0.5 mb-1.5" aria-label="Progression" data-testid="medic-progress">
              {steps.map((st, i) => (
                <span key={st.id} title={st.title} style={{ background: LEVEL_UI[stepLevel(st)].bg }} className={`h-1.5 flex-1 rounded-full border border-slate-400/60 ${i === si ? "ring-2 ring-offset-1 ring-slate-800" : i < idx ? "opacity-40" : ""}`} />
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Étape {si + 1} / {steps.length}{step.tag ? ` · ${step.tag}` : ""}</p>
              <div className="inline-flex rounded-md border border-slate-300 overflow-hidden text-[11.5px]" role="group" aria-label="Niveau affiché">
                <button type="button" aria-pressed={!blsOnly} data-testid="medic-all" onClick={() => { setBlsOnly(false); setIdx(0); }} className={`min-h-8 px-2 ${!blsOnly ? "bg-slate-800 text-white" : "bg-white"}`}>BLS + ALS</button>
                <button type="button" aria-pressed={blsOnly} data-testid="medic-bls" onClick={() => { setBlsOnly(true); setIdx(0); }} className={`min-h-8 px-2 ${blsOnly ? "bg-slate-800 text-white" : "bg-white"}`}>BLS seul</button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 mb-1.5">
              <h2 className="text-[15px] font-bold leading-tight flex-1 min-w-0" data-testid="medic-step-title">{step.title}</h2>
              <span style={{ background: LEVEL_UI[stepLevel(step)].bg }} className="text-[10.5px] font-bold text-slate-900 rounded border border-slate-500/50 px-1.5 py-0.5 whitespace-nowrap" data-testid="medic-level">{LEVEL_UI[stepLevel(step)].label}</span>
            </div>
            <ol className="space-y-1 text-[13.5px] leading-snug">
              {step.lines.map((l, i) => (
                <li key={i} style={{ background: isAls(l) ? ALS_BG : BLS_BG }} className="px-2 py-1 rounded text-slate-900">
                  {isAls(l) && <span className="mr-1.5 text-[10px] font-bold text-slate-900 bg-white/70 border border-slate-500/50 rounded px-1 align-middle">ALS</span>}
                  {stripAls(l)}
                </li>
              ))}
            </ol>
            {step.doses && step.doses.length > 0 && (
              <div className="mt-2.5 rounded border border-amber-300 bg-amber-50 p-2 text-[12.5px]">
                <p className="font-semibold text-amber-900">Posologies / réglages</p>
                <ul className="list-disc pl-5">{step.doses.map((d, i) => <li key={i}>{isAls(d) && <span style={{ background: ALS_BG }} className="mr-1 text-[10px] font-bold text-slate-900 border border-slate-500/50 rounded px-1">ALS</span>}{stripAls(d)}</li>)}</ul>
              </div>
            )}
            {step.detail && <Detail key={`${proto.key}-${step.id}`} stepId={step.id} detail={step.detail} />}
            {step.choice && (
              <div className="mt-3">
                <p className="text-[12.5px] font-semibold mb-1">Rythme observé sur le scope :</p>
                <div className="flex flex-wrap gap-1.5">
                  {step.choice.options.map((o) => (
                    <button key={o.id} type="button" aria-pressed={extra[step.choice!.key] === o.id} onClick={() => setExtra((e) => ({ ...e, [step.choice!.key]: o.id }))} className={`min-h-10 px-3 rounded-md border text-[13px] ${extra[step.choice!.key] === o.id ? "bg-red-700 text-white border-red-700" : "bg-white border-slate-300 hover:bg-slate-100"}`}>{o.label}{o.hint ? ` (${o.hint})` : ""}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0 grid grid-cols-[1fr_1.4fr] gap-2 p-2 border-t border-slate-200 bg-slate-50">
            <button type="button" aria-label="Étape précédente" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))} className="min-h-11 rounded-md border border-slate-300 bg-white text-[13.5px] disabled:opacity-40">‹ Précédent</button>
            <button type="button" aria-label="Étape suivante" disabled={idx >= steps.length - 1 || !!needChoice} onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))} className="min-h-11 rounded-md bg-red-700 text-white font-semibold text-[13.5px] disabled:opacity-40">{needChoice ? "Choisir le rythme" : "Suivant ›"}</button>
          </div>
        </section>
        {vit && (
        <section className={`md:w-2/5 ${tab === "vitals" ? "block" : "hidden md:block"} min-h-0 flex-1 md:flex-none overflow-auto p-2.5 text-[13px]`} aria-label="Constantes">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-[13.5px]">Constantes typiques (plages)</h3>
            <span className="text-[11px] rounded bg-slate-200 px-2 py-0.5" data-testid="medic-stage">{vit.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <button type="button" disabled={!canBetter} onClick={() => { setStage((s) => s + better); }} className="min-h-10 px-2 rounded-md border border-green-700 text-green-800 bg-green-50 text-[12.5px] disabled:opacity-40">{proto.betterLabel}</button>
            <button type="button" disabled={!canWorse} onClick={() => { setStage((s) => s - better); }} className="min-h-10 px-2 rounded-md border border-red-700 text-red-800 bg-red-50 text-[12.5px] disabled:opacity-40">{proto.worseLabel}</button>
            {proto.arrestAt && stage === proto.arrestAt.stage && (
              <button type="button" onClick={() => switchToArrest(proto.arrestAt!.trauma)} className="col-span-2 min-h-10 px-2 rounded-md bg-red-700 text-white text-[12.5px]">{proto.arrestAt.trauma ? "Arrêt cardiaque traumatique" : "Arrêt cardiaque"}</button>
            )}
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
        </section>
        )}
      </div>
    </>
  );
}
