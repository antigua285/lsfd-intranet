"use client";

import { useState } from "react";
import {
  GCS_CATEGORIES, SMR_A, SMR_B, SMR_C, START_ADULT, START_CHILD, TOOLS, TRI_UI, gcsResult, isTri, smrResult,
  type GcsSelection, type StartNode, type ToolKey, type Tri, type YesNo,
} from "@/lib/medic-tools";

const TONE: Record<string, string> = {
  none: "bg-slate-100 text-slate-600 border-slate-300",
  ok: "bg-green-100 text-green-900 border-green-400",
  light: "bg-yellow-100 text-yellow-900 border-yellow-400",
  mid: "bg-orange-100 text-orange-900 border-orange-400",
  bad: "bg-red-100 text-red-900 border-red-500",
};

function Glasgow() {
  const [sel, setSel] = useState<GcsSelection>({});
  const res = gcsResult(sel);
  return (
    <div className="h-full flex flex-col" data-testid="view-gcs">
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="grid gap-3 md:grid-cols-3">
          {GCS_CATEGORIES.map((c) => (
            <fieldset key={c.key} className="min-w-0">
              <legend className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">{c.title}</legend>
              <div className="flex flex-col gap-1">
                {c.options.map((o) => {
                  const on = sel[c.key] === o.score;
                  return (
                    <button key={o.score} type="button" aria-pressed={on} data-testid={`gcs-${c.key}${o.score}`} onClick={() => setSel((s) => ({ ...s, [c.key]: o.score }))}
                      className={`flex items-center gap-2 min-h-10 rounded border px-2 py-1 text-left ${on ? "border-red-700 bg-red-50 ring-1 ring-red-700" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
                      <span className={`shrink-0 w-6 h-6 rounded text-[13px] font-bold flex items-center justify-center ${on ? "bg-red-700 text-white" : "bg-slate-200 text-slate-700"}`}>{o.score}</span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-tight">{o.label}</span>
                        {o.hint && <span className="block text-[11px] text-slate-500 leading-tight">{o.hint}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
      <div className={`shrink-0 border-t p-2 flex items-center gap-3 ${TONE[res.tone]}`} aria-live="polite" data-testid="gcs-result">
        <div className="text-center leading-none">
          <div className="text-[26px] font-bold tabular-nums" data-testid="gcs-total">{res.total ?? "—"}</div>
          <div className="text-[10px] uppercase">/ 15</div>
        </div>
        <div className="flex-1 min-w-0 text-[12.5px]">
          <p className="font-semibold">{res.total !== null ? `${res.text} · ${res.severity}` : res.severity}</p>
          {res.advice && <p className="leading-snug">{res.advice}</p>}
        </div>
        <button type="button" onClick={() => setSel({})} className="shrink-0 min-h-9 px-3 rounded border border-slate-400 bg-white/80 text-[13px]">Effacer</button>
      </div>
    </div>
  );
}

/* ───────────── SMR ───────────── */
function YesNoRow({ label, value, onChange, id }: { label: string; value: YesNo; onChange: (v: boolean) => void; id: string }) {
  return (
    <div className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1">
      <p className="flex-1 min-w-0 text-[12.5px] leading-snug">{label}</p>
      <div className="shrink-0 inline-flex rounded-md border border-slate-300 overflow-hidden text-[12.5px]" role="group" aria-label={label}>
        <button type="button" data-testid={`${id}-oui`} aria-pressed={value === true} onClick={() => onChange(true)} className={`min-h-10 w-12 ${value === true ? "bg-red-700 text-white" : "bg-white"}`}>Oui</button>
        <button type="button" data-testid={`${id}-non`} aria-pressed={value === false} onClick={() => onChange(false)} className={`min-h-10 w-12 border-l border-slate-300 ${value === false ? "bg-slate-700 text-white" : "bg-white"}`}>Non</button>
      </div>
    </div>
  );
}

const SMR_TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#e2e8f0", fg: "#334155" },
  smr: { bg: "#7f1d1d", fg: "#fff" },
  strong: { bg: "#c2410c", fg: "#fff" },
  judgement: { bg: "#b08a2a", fg: "#fff" },
  none: { bg: "#3a8044", fg: "#fff" },
};

function Smr() {
  const [a, setA] = useState<YesNo[]>([undefined, undefined, undefined]);
  const [b, setB] = useState<YesNo[]>([undefined, undefined, undefined]);
  const [c, setC] = useState<YesNo[]>([undefined, undefined, undefined]);
  const set = (arr: YesNo[], setter: (v: YesNo[]) => void, i: number, v: boolean) => setter(arr.map((x, j) => (j === i ? v : x)));
  const res = smrResult(a, b, c);
  const tone = SMR_TONE[res.kind];
  return (
    <div className="h-full flex flex-col" data-testid="view-smr">
      <div className="flex-1 min-h-0 overflow-auto p-3 space-y-3">
        <section>
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">1 · Patient à haut risque <span className="normal-case font-normal">(un « oui » : envisager fortement une SMR)</span></h3>
          <div className="space-y-1">{SMR_A.map((l, i) => <YesNoRow key={i} id={`smr-a${i}`} label={l} value={a[i]} onChange={(v) => set(a, setA, i, v)} />)}</div>
        </section>
        <section>
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">2 · Évaluation complète, tous les patients <span className="normal-case font-normal">(un « oui » : SMR)</span></h3>
          <div className="space-y-1">{SMR_B.map((l, i) => <YesNoRow key={i} id={`smr-b${i}`} label={l} value={b[i]} onChange={(v) => set(b, setB, i, v)} />)}</div>
        </section>
        <section>
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500 mb-1">3 · Faible risque <span className="normal-case font-normal">(si tout est « non » à l&apos;étape 2 : tout « oui » = pas de SMR, sinon selon jugement)</span></h3>
          <div className="space-y-1">{SMR_C.map((l, i) => <YesNoRow key={i} id={`smr-c${i}`} label={l} value={c[i]} onChange={(v) => set(c, setC, i, v)} />)}</div>
        </section>
        <details className="rounded border border-slate-300 bg-white group">
          <summary className="min-h-10 px-2 py-1 flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[12.5px] font-semibold">
            <span aria-hidden="true" className="text-slate-500 transition-transform group-open:rotate-90">▸</span>Quel dispositif pour quel usage ?
          </summary>
          <ul className="list-disc pl-7 pr-2 pb-2 text-[12px] space-y-0.5 text-slate-700">
            <li><b>Collier cervical</b> : maintien du cou, toujours associé à un autre dispositif (seul, ce n&apos;est pas une SMR).</li>
            <li><b>Planche dorsale</b> : extraction et dégagement (véhicule, escalier, terrain difficile). Transférer ensuite sur le matelas ou le brancard ; jamais sur un patient ambulatoire.</li>
            <li><b>Brancard cuillère</b> : relevage et transfert sans faire rouler le patient (bassin, hanche, polytraumatisé) ; retiré une fois le patient installé.</li>
            <li><b>Combi (cuillère et planche)</b> : relevage et déplacements courts, patient installé ensuite sur le matelas.</li>
            <li><b>Matelas à dépression (MID)</b> : dispositif de référence pendant le transport, avec collier et blocs de tête.</li>
          </ul>
        </details>
      </div>
      <div className="shrink-0 border-t p-2 flex items-center gap-3" style={{ background: tone.bg, color: tone.fg }} aria-live="polite" data-testid="smr-result">
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold leading-tight" data-testid="smr-title">{res.title}</p>
          <p className="text-[12px] leading-snug">{res.text}</p>
        </div>
        <button type="button" onClick={() => { setA([undefined, undefined, undefined]); setB([undefined, undefined, undefined]); setC([undefined, undefined, undefined]); }} className="shrink-0 min-h-9 px-3 rounded border border-white/60 bg-white/20 text-[13px]">Effacer</button>
      </div>
    </div>
  );
}

/* ───────────── START / JumpSTART ───────────── */
type Tally = Record<Tri, number>;
const ZERO: Tally = { R: 0, J: 0, V: 0, N: 0 };

function Start() {
  const [child, setChild] = useState(false);
  const [node, setNode] = useState("walk");
  const [stack, setStack] = useState<string[]>([]);
  const [result, setResult] = useState<Tri | null>(null);
  const [tally, setTally] = useState<Tally>(ZERO);
  const graph: Record<string, StartNode> = child ? START_CHILD : START_ADULT;
  const cur = graph[node];
  const restart = () => { setNode("walk"); setStack([]); setResult(null); };
  const answer = (yes: boolean) => {
    const next = yes ? cur.yes : cur.no;
    if (isTri(next)) setResult(next);
    else { setStack((s) => [...s, node]); setNode(next); }
  };
  const back = () => {
    if (result) { setResult(null); return; }
    setStack((s) => { const n = [...s]; const prev = n.pop(); if (prev) setNode(prev); return n; });
  };
  const bump = (t: Tri, d: number) => setTally((x) => ({ ...x, [t]: Math.max(0, x[t] + d) }));
  const total = tally.R + tally.J + tally.V + tally.N;
  return (
    <div className="h-full flex flex-col" data-testid="view-start">
      <div className="flex-1 min-h-0 overflow-auto p-3 space-y-3">
        <p className="text-[12px] text-slate-600 leading-snug">Moins de 30 secondes par patient. Gestes autorisés pendant le tri : contrôler une hémorragie massive, ouvrir les voies aériennes, position latérale. Envisager la déclaration d&apos;un MCI et demander des renforts.</p>
        <div className="inline-flex rounded-md border border-slate-300 overflow-hidden text-[13px]" role="group" aria-label="Type de patient">
          <button type="button" data-testid="start-adult" aria-pressed={!child} onClick={() => { setChild(false); restart(); }} className={`min-h-10 px-4 ${!child ? "bg-slate-800 text-white" : "bg-white"}`}>Adulte (START)</button>
          <button type="button" data-testid="start-child" aria-pressed={child} onClick={() => { setChild(true); restart(); }} className={`min-h-10 px-4 border-l border-slate-300 ${child ? "bg-slate-800 text-white" : "bg-white"}`}>Enfant 1–8 ans (JumpSTART)</button>
        </div>

        {result ? (
          <div className="rounded-lg p-4 text-center" style={{ background: TRI_UI[result].bg, color: TRI_UI[result].fg }} data-testid="start-result" aria-live="polite">
            <p className="text-[26px] font-extrabold leading-none">{TRI_UI[result].label}</p>
            <p className="text-[14px] mt-1">{TRI_UI[result].sub}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-300 bg-white p-3" data-testid="start-question">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Question {stack.length + 1}</p>
            <p className="text-[16px] font-bold leading-snug">{cur.q}</p>
            {cur.hint && <p className="text-[12px] text-slate-500 mt-0.5">{cur.hint}</p>}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button type="button" data-testid="start-oui" onClick={() => answer(true)} className="min-h-12 rounded-md bg-slate-800 text-white font-semibold text-[15px]">Oui</button>
              <button type="button" data-testid="start-non" onClick={() => answer(false)} className="min-h-12 rounded-md border-2 border-slate-800 text-slate-900 font-semibold text-[15px]">Non</button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" data-testid="start-back" disabled={!result && stack.length === 0} onClick={back} className="min-h-10 px-3 rounded-md border border-slate-300 bg-white text-[13px] disabled:opacity-40">‹ Retour</button>
          {result && (
            <button type="button" data-testid="start-save" onClick={() => { bump(result, 1); restart(); }} className="flex-1 min-h-10 px-3 rounded-md bg-red-700 text-white font-semibold text-[13.5px]">Compter ce patient · patient suivant</button>
          )}
          {!result && stack.length > 0 && <button type="button" onClick={restart} className="min-h-10 px-3 rounded-md border border-slate-300 bg-white text-[13px]">Recommencer</button>}
        </div>

        <section aria-label="Bilan du tri">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Bilan : <span data-testid="start-total">{total}</span> patient{total > 1 ? "s" : ""}</h3>
            <button type="button" onClick={() => setTally(ZERO)} className="min-h-8 px-2 rounded border border-slate-300 bg-white text-[12px]">Remettre à zéro</button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(TRI_UI) as Tri[]).map((t) => (
              <div key={t} className="rounded-md overflow-hidden border border-slate-300" data-testid={`tally-${t}`}>
                <div className="text-center py-1" style={{ background: TRI_UI[t].bg, color: TRI_UI[t].fg }}>
                  <p className="text-[10px] font-bold leading-none">{TRI_UI[t].label}</p>
                  <p className="text-[22px] font-bold leading-tight tabular-nums" data-testid={`tally-${t}-n`}>{tally[t]}</p>
                </div>
                <div className="grid grid-cols-2 bg-white">
                  <button type="button" aria-label={`Retirer un patient ${TRI_UI[t].label}`} onClick={() => bump(t, -1)} className="min-h-9 text-[16px] border-r border-slate-200">−</button>
                  <button type="button" aria-label={`Ajouter un patient ${TRI_UI[t].label}`} onClick={() => bump(t, 1)} className="min-h-9 text-[16px]">+</button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <p className="text-[11px] text-slate-500">Algorithme START / JumpSTART standard, non détaillé dans les manuels du service : à valider par vos medics.</p>
      </div>
    </div>
  );
}

/** Panneau d'un outil, superposé à l'application ; reste monté une fois ouvert pour garder son état. */
export function MedicToolPanel({ tool, visible, onClose }: { tool: ToolKey; visible: boolean; onClose: () => void }) {
  const def = TOOLS.find((t) => t.key === tool)!;
  return (
    <div className={`absolute inset-0 z-10 bg-white text-slate-900 flex-col ${visible ? "flex" : "hidden"}`} role="dialog" aria-label={def.title} aria-hidden={!visible} data-testid={`panel-${tool}`}>
      <div className="shrink-0 flex items-center gap-2 bg-slate-800 text-white px-2 py-1">
        <strong className="flex-1 truncate text-[13px]">{def.title}</strong>
        <button type="button" onClick={onClose} className="min-h-9 px-3 rounded bg-white/15 text-[13px]" data-testid="tool-close">Fermer</button>
      </div>
      <div className="flex-1 min-h-0">{tool === "gcs" ? <Glasgow /> : tool === "smr" ? <Smr /> : <Start />}</div>
    </div>
  );
}
