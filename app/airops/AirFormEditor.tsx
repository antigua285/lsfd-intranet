"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fratResult, type AirFormDef, type AirField } from "@/lib/airops-shared";
import { deleteAirFormAction, saveAirFormAction, signAirFormAction } from "./actions";

const SPAN: Record<number, string> = { 3: "col-span-6 sm:col-span-3", 4: "col-span-12 sm:col-span-4", 6: "col-span-12 sm:col-span-6", 8: "col-span-12 sm:col-span-8", 12: "col-span-12" };
const ctl = "w-full bg-transparent border-0 border-b border-slate-300 px-0.5 py-1 text-[14px] text-slate-900 focus:outline-none focus:border-[#0d2644] disabled:text-slate-900";
const TONE = { go: "bg-emerald-600", mitigate: "bg-amber-500", nogo: "bg-red-600" } as const;

/** Formulaire de vol électronique : cases numérotées comme sur les imprimés officiels. */
export function AirFormEditor({ def, formId, initial, canEdit, isCmd, signedBy, signedAt, authorName, createdAt }: {
  def: AirFormDef; formId: string | null; initial: Record<string, string>; canEdit: boolean; isCmd: boolean;
  signedBy: string | null; signedAt: string | null; authorName: string | null; createdAt: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [data, setData] = useState<Record<string, string>>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (id: string, v: string) => setData((d) => ({ ...d, [id]: v }));
  const frat = def.kind === "frat" ? fratResult(data) : null;

  const save = () => start(async () => {
    const r = await saveAirFormAction(def.kind, formId, data);
    if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
    setMsg({ ok: true, text: r.message });
    if (!formId && r.id) router.replace(`/airops/forms/${r.id}`);
    else router.refresh();
  });
  const remove = () => start(async () => {
    if (!formId || !window.confirm("Supprimer définitivement ce formulaire ?")) return;
    const r = await deleteAirFormAction(formId);
    if (r.ok) router.replace("/airops/forms"); else setMsg({ ok: false, text: r.error });
  });
  const sign = (s: boolean) => start(async () => {
    if (!formId) return;
    const r = await signAirFormAction(formId, s);
    setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
    router.refresh();
  });

  return (
    <div data-testid={`airform-${def.kind}`}>
      <article className="bg-white border-2 border-slate-800 shadow-sm max-w-4xl">
        <header className="flex items-start justify-between gap-3 border-b-2 border-slate-800 px-4 py-3 bg-slate-50">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Los Santos Fire Department · Air Operations Section</p>
            <h2 className="text-[18px] font-extrabold text-slate-900 uppercase leading-tight">{def.title}</h2>
            <p className="text-[11.5px] text-slate-500">{def.subtitle}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-[13px] font-bold text-slate-800 border border-slate-800 px-2 py-0.5">{def.code}</p>
            {authorName && <p className="text-[10.5px] text-slate-500 mt-1">Saisi par {authorName}</p>}
            {createdAt && <p className="text-[10.5px] text-slate-500">{new Date(createdAt).toLocaleDateString("fr-FR")}</p>}
          </div>
        </header>

        {def.sections.map((section) => (
          <section key={section.title} className="border-b border-slate-300 last:border-b-0">
            <h3 className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1">{section.title}</h3>
            <div className="grid grid-cols-12 gap-x-4 gap-y-3 px-4 py-3">
              {section.fields.map((f) => (
                <Cell key={f.id} f={f} value={data[f.id] ?? ""} disabled={!canEdit} onChange={(v) => set(f.id, v)} />
              ))}
            </div>
          </section>
        ))}

        {frat && (
          <footer className={`${TONE[frat.level]} text-white px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1`} data-testid="frat-result" data-level={frat.level}>
            <p className="text-[26px] font-extrabold leading-none">{frat.points} <span className="text-[12px] font-bold">pts</span></p>
            <div>
              <p className="text-[16px] font-extrabold uppercase">{frat.label}</p>
              <p className="text-[12px]">{frat.text}</p>
            </div>
          </footer>
        )}

        {(signedBy || formId) && (
          <div className="px-4 py-2 border-t border-slate-300 text-[12px] flex flex-wrap items-center gap-3">
            {signedBy ? (
              <p className="text-emerald-800 font-bold" data-testid="air-signed">✔ Contresigné par {signedBy}{signedAt ? ` le ${new Date(signedAt).toLocaleDateString("fr-FR")}` : ""}</p>
            ) : (
              <p className="text-slate-500">Non contresigné.</p>
            )}
          </div>
        )}
      </article>

      <div className="mt-3 flex flex-wrap items-center gap-2 max-w-4xl">
        {canEdit && <button type="button" onClick={save} disabled={pending} data-testid="airform-save" className="min-h-10 px-4 rounded bg-[#0d2644] text-white text-[13px] font-bold disabled:opacity-50">{formId ? "Enregistrer les modifications" : "Enregistrer le formulaire"}</button>}
        {formId && isCmd && !signedBy && <button type="button" onClick={() => sign(true)} disabled={pending} data-testid="airform-sign" className="min-h-10 px-4 rounded border border-emerald-700 text-emerald-800 text-[13px] font-bold">Contresigner</button>}
        {formId && isCmd && signedBy && <button type="button" onClick={() => sign(false)} disabled={pending} className="min-h-10 px-4 rounded border border-slate-300 text-[13px]">Retirer la contresignature</button>}
        {formId && (canEdit || isCmd) && <button type="button" onClick={remove} disabled={pending} className="min-h-10 px-4 rounded border border-red-300 text-red-700 text-[13px] ml-auto">Supprimer</button>}
        {!canEdit && formId && <p className="text-[12px] text-slate-500">Lecture seule : seul l&apos;auteur (avant contresignature) ou le commandement peut modifier.</p>}
      </div>
      {msg && <p role="status" data-testid="airform-msg" className={`mt-2 text-[13px] ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}
    </div>
  );
}

function Cell({ f, value, disabled, onChange }: { f: AirField; value: string; disabled: boolean; onChange: (v: string) => void }) {
  const id = `af-${f.id}`;
  const label = (
    <label htmlFor={id} className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-600 leading-tight">
      {f.box && <span className="inline-grid place-items-center min-w-5 h-5 px-1 border border-slate-700 text-[10px] font-mono text-slate-800">{f.box}</span>}
      <span>{f.label}{f.required ? " *" : ""}</span>
    </label>
  );
  const wrap = (children: React.ReactNode) => <div className={SPAN[f.span ?? 12]}>{label}{children}</div>;
  switch (f.type) {
    case "long":
      return wrap(<textarea id={id} rows={3} value={value} maxLength={f.max} placeholder={f.hint} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`${ctl} border border-slate-300 rounded px-2 mt-1 resize-y`} />);
    case "select":
      return wrap(
        <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={ctl}>
          <option value="">—</option>
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "yn":
    case "check":
      return (
        <div className={SPAN[f.span ?? 12]}>
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-600 leading-tight">{f.box && <span className="mr-1 inline-grid place-items-center min-w-5 h-5 px-1 border border-slate-700 text-[10px] font-mono">{f.box}</span>}{f.label}{f.required ? " *" : ""}</p>
          <div role="radiogroup" aria-label={f.label} className="mt-1 inline-flex rounded border border-slate-300 overflow-hidden">
            {f.options?.map((o) => (
              <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={disabled} onClick={() => onChange(value === o.value ? "" : o.value)}
                data-testid={`af-${f.id}-${o.value}`}
                className={`min-h-9 px-3 text-[12.5px] font-semibold border-l first:border-l-0 border-slate-300 ${value === o.value ? (o.value === "dis" || o.value === "no" ? "bg-red-600 text-white" : "bg-[#0d2644] text-white") : "bg-white text-slate-700"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      );
    case "score":
      return (
        <div className="col-span-12">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-600">{f.label}</p>
          <div role="radiogroup" aria-label={f.label} className="mt-1 grid gap-1 sm:grid-cols-3">
            {f.options?.map((o) => (
              <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={disabled} onClick={() => onChange(value === o.value ? "" : o.value)}
                data-testid={`af-${f.id}-${o.value}`}
                className={`text-left rounded border px-2.5 py-1.5 text-[12.5px] leading-snug min-h-11 ${value === o.value ? "border-[#0d2644] bg-[#0d2644] text-white" : "border-slate-300 bg-white text-slate-800"}`}>
                {o.label} <span className={`font-mono text-[11px] ${value === o.value ? "text-white/80" : "text-slate-500"}`}>({o.points} pt{(o.points ?? 0) > 1 ? "s" : ""})</span>
              </button>
            ))}
          </div>
        </div>
      );
    default:
      return wrap(
        <input id={id} type={f.type === "date" ? "date" : f.type === "time" ? "time" : f.type === "number" ? "number" : "text"} min={f.type === "number" ? 0 : undefined} max={f.type === "number" ? f.max : undefined}
          value={value} maxLength={f.type === "text" ? f.max : undefined} placeholder={f.hint} disabled={disabled} inputMode={f.type === "number" ? "numeric" : undefined}
          onChange={(e) => onChange(e.target.value)} className={ctl} />
      );
  }
}
