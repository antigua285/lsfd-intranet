"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormPaper } from "@/components/FormPaper";
import { FIELD_META, FIELD_TYPES, newId, type FieldType, type FormAction, type FormField, type FormRecord } from "@/lib/forms-types";
import { LIMITS } from "@/lib/forms-validation";
import { DETAIL_FIELDS, FEATURE_KINDS, FEATURE_META, type FeatureKind } from "@/lib/map-types";
import { saveFormAction } from "./actions";

type Props = {
  formId: string | null;
  initial: Omit<FormRecord, "id" | "createdAt" | "updatedAt">;
  allFlags: { code: string; name: string }[];
};

const INPUT = "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#0d2644]";
const SMALL_BTN = "border border-slate-300 text-slate-700 text-[12px] rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30";

export function FormBuilder({ formId, initial, allFlags }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [headerLines, setHeaderLines] = useState<string[]>(initial.headerLines);
  const [footer, setFooter] = useState(initial.footer);
  const [published, setPublished] = useState(initial.published);
  const [flags, setFlags] = useState<string[]>(initial.flags);
  const [fields, setFields] = useState<FormField[]>(initial.definition.fields);
  const [actions, setActions] = useState<FormAction[]>(initial.definition.actions);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const featureFields = fields.filter((f) => f.type === "feature");

  function patchField(id: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function move(index: number, delta: number) {
    setFields((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    // Une règle qui pointait vers ce champ n'a plus de sens.
    setActions((prev) =>
      prev.filter((a) => a.featureField !== id && !(a.source.kind === "field" && a.source.field === id))
    );
  }
  function addField(type: FieldType) {
    const field: FormField = { id: newId("f"), type, label: FIELD_META[type].label };
    if (type === "select") {
      field.options = [
        { id: newId("o"), label: "Option 1" },
        { id: newId("o"), label: "Option 2" },
      ];
    }
    if (type === "checkbox") {
      field.options = [
        { id: newId("o"), label: "Option 1" },
        { id: newId("o"), label: "Option 2" },
        { id: newId("o"), label: "Option 3" },
      ];
      field.multiple = true;
      field.columns = 2;
    }
    if (type === "feature") field.featureKind = "hydrant";
    setFields((prev) => [...prev, field]);
  }

  function patchAction(id: string, patch: Partial<FormAction>) {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }
  function addAction() {
    const target = featureFields[0];
    if (!target) return;
    const kind = (target.featureKind ?? "hydrant") as FeatureKind;
    const detail = DETAIL_FIELDS[kind][0]?.key ?? "";
    setActions((prev) => [...prev, { id: newId("a"), type: "set_detail", featureField: target.id, detail, source: { kind: "today" } }]);
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await saveFormAction(formId, {
        title, subtitle, headerLines: headerLines.filter((l) => l.trim()), footer, published, flags,
        definition: { fields, actions },
      });
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      setMessage({ ok: true, text: "Formulaire enregistré." });
      if (formId === null) router.replace(`/admin/forms/${result.id}`);
      else router.refresh();
    } catch {
      setMessage({ ok: false, text: "L'enregistrement a échoué (session expirée ?)." });
    } finally {
      setBusy(false);
    }
  }

  const previewContent = { title, subtitle, headerLines: headerLines.filter((l) => l.trim()), footer, definition: { fields, actions } };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex flex-col gap-5 min-w-0">
        <section className="border border-slate-200 rounded p-4 flex flex-col gap-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600">En-tête du papier</h2>
          <label className="text-[13px]">Titre (en gras)
            <input className={INPUT} value={title} maxLength={LIMITS.title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="text-[13px]">Sous-titre
            <input className={INPUT} value={subtitle} maxLength={LIMITS.subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </label>
          <fieldset className="text-[13px]">
            <legend>Lignes d&apos;en-tête (téléphone, site web…)</legend>
            {headerLines.map((line, i) => (
              <div key={i} className="flex gap-2 mt-1">
                <input aria-label={`Ligne d'en-tête ${i + 1}`} className={INPUT} value={line} maxLength={LIMITS.headerLine}
                  onChange={(e) => setHeaderLines((p) => p.map((l, j) => (j === i ? e.target.value : l)))} />
                <button type="button" className={SMALL_BTN} onClick={() => setHeaderLines((p) => p.filter((_, j) => j !== i))}>Retirer</button>
              </div>
            ))}
            {headerLines.length < LIMITS.headerLines && (
              <button type="button" className={`${SMALL_BTN} mt-2`} onClick={() => setHeaderLines((p) => [...p, ""])}>+ Ajouter une ligne</button>
            )}
          </fieldset>
          <label className="text-[13px]">Note de bas de page (en italique)
            <textarea className={INPUT} rows={2} value={footer} maxLength={LIMITS.footer} onChange={(e) => setFooter(e.target.value)} />
          </label>
          <label className="text-[13px] flex items-center gap-2">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Publié (visible et remplissable par les membres autorisés)
          </label>
          <fieldset className="text-[13px] border border-slate-200 rounded p-3">
            <legend className="px-1 text-[12px] font-bold uppercase tracking-wide text-slate-600">Accès par flags</legend>
            <p className="text-[12px] text-slate-500 mb-2">
              Aucun flag coché : tous les membres peuvent remplir ce formulaire. Sinon, il faut posséder au moins un des flags cochés.
              Les détenteurs de ces flags peuvent aussi lire les rapports reçus.
            </p>
            {allFlags.length === 0 ? (
              <p className="text-[12px] text-slate-500">Aucun flag n&apos;existe encore (Administration → Accès &amp; flags).</p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {allFlags.map((f) => (
                  <label key={f.code} className="flex items-center gap-1.5" title={f.name}>
                    <input type="checkbox" checked={flags.includes(f.code)}
                      onChange={(e) => setFlags((p) => (e.target.checked ? [...p, f.code] : p.filter((c) => c !== f.code)))} />
                    {f.code}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </section>

        <section className="border border-slate-200 rounded p-4 flex flex-col gap-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600">Champs ({fields.length})</h2>
          {fields.map((field, index) => (
            <div key={field.id} data-testid="builder-field" className="border border-slate-200 rounded p-3 bg-slate-50 flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase bg-slate-200 rounded px-2 py-0.5">{FIELD_META[field.type].label}</span>
                <span className="flex-1" />
                <button type="button" className={SMALL_BTN} disabled={index === 0} onClick={() => move(index, -1)} aria-label="Monter">↑</button>
                <button type="button" className={SMALL_BTN} disabled={index === fields.length - 1} onClick={() => move(index, 1)} aria-label="Descendre">↓</button>
                <button type="button" className={`${SMALL_BTN} text-red-700`} onClick={() => removeField(field.id)}>Supprimer</button>
              </div>
              <input aria-label="Intitulé du champ" className={INPUT} value={field.label} maxLength={LIMITS.long}
                onChange={(e) => patchField(field.id, { label: e.target.value })} />
              {FIELD_META[field.type].answered && (
                <div className="flex gap-4 text-[12px]">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={!!field.required} onChange={(e) => patchField(field.id, { required: e.target.checked })} /> Obligatoire</label>
                  {field.type !== "long" && field.type !== "checkbox" && field.type !== "image" && (
                    <label className="flex items-center gap-1"><input type="checkbox" checked={field.width === "half"} onChange={(e) => patchField(field.id, { width: e.target.checked ? "half" : "full" })} /> Demi-largeur (2 par ligne)</label>
                  )}
                </div>
              )}
              {field.type === "feature" && (
                <label className="text-[12px]">Type de point
                  <select className={INPUT} value={field.featureKind} onChange={(e) => {
                    const kind = e.target.value as FeatureKind;
                    patchField(field.id, { featureKind: kind });
                    // Les règles de ce champ doivent rester valides pour le nouveau type.
                    setActions((prev) => prev.filter((a) => a.featureField !== field.id));
                  }}>
                    {FEATURE_KINDS.map((k) => <option key={k} value={k}>{FEATURE_META[k].label}</option>)}
                  </select>
                </label>
              )}
              {field.type === "checkbox" && (
                <div className="flex flex-wrap items-center gap-4 text-[12px]">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={field.multiple !== false} onChange={(e) => patchField(field.id, { multiple: e.target.checked })} /> Plusieurs réponses possibles</label>
                  <label className="flex items-center gap-1">Colonnes
                    <select aria-label="Nombre de colonnes" className="border border-slate-300 rounded px-1 py-0.5" value={field.columns ?? 2} onChange={(e) => patchField(field.id, { columns: Number(e.target.value) as 1 | 2 | 3 | 4 })}>
                      {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                </div>
              )}
              {(field.type === "select" || field.type === "checkbox") && (
                <div className="flex flex-col gap-1">
                  <p className="text-[12px]">Choix proposés</p>
                  {field.options?.map((opt) => (
                    <div key={opt.id} className="flex gap-2">
                      <input aria-label="Texte du choix" className={INPUT} value={opt.label} maxLength={80}
                        onChange={(e) => patchField(field.id, { options: field.options!.map((o) => (o.id === opt.id ? { ...o, label: e.target.value } : o)) })} />
                      <button type="button" className={SMALL_BTN} disabled={(field.options?.length ?? 0) <= (field.type === "select" ? 2 : 1)}
                        onClick={() => patchField(field.id, { options: field.options!.filter((o) => o.id !== opt.id) })}>Retirer</button>
                    </div>
                  ))}
                  {(field.options?.length ?? 0) < 40 && (
                    <button type="button" className={`${SMALL_BTN} self-start`}
                      onClick={() => patchField(field.id, { options: [...(field.options ?? []), { id: newId("o"), label: `Option ${(field.options?.length ?? 0) + 1}` }] })}>+ Ajouter un choix</button>
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Ajouter un champ">
            {FIELD_TYPES.map((type) => (
              <button key={type} type="button" title={FIELD_META[type].hint} className={SMALL_BTN} onClick={() => addField(type)}>
                + {FIELD_META[type].label}
              </button>
            ))}
          </div>
        </section>

        <section className="border border-slate-200 rounded p-4 flex flex-col gap-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600">Actions sur la carte</h2>
          <p className="text-[12px] text-slate-500">
            À l&apos;envoi, le formulaire peut modifier le point choisi (ex. l&apos;état d&apos;une borne et sa date d&apos;inspection).
            Il faut au moins un champ « Point de la carte ».
          </p>
          {actions.map((action) => (
            <ActionEditor key={action.id} action={action} fields={fields}
              onChange={(patch) => patchAction(action.id, patch)}
              onRemove={() => setActions((p) => p.filter((a) => a.id !== action.id))} />
          ))}
          <button type="button" className={`${SMALL_BTN} self-start`} disabled={featureFields.length === 0} onClick={addAction}>+ Ajouter une action</button>
        </section>

        <div className="flex items-center gap-3 sticky bottom-0 bg-white/90 py-3 border-t border-slate-200">
          <button type="button" disabled={busy} onClick={save} className="bg-[#0d2644] text-white text-[13px] font-bold uppercase tracking-wide rounded px-5 py-2 hover:bg-[#143a66] disabled:opacity-50">
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
          {message && <p role={message.ok ? "status" : "alert"} className={`text-[13px] ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}
        </div>
      </div>

      <aside aria-label="Aperçu" className="min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-wide text-slate-600 mb-2">Aperçu du papier</p>
        <ScaledPaper content={previewContent} />
      </aside>
    </div>
  );
}

function ScaledPaper({ content }: { content: React.ComponentProps<typeof FormPaper>["content"] }) {
  const scale = 0.5;
  return (
    <div className="bg-slate-200 rounded p-2 overflow-hidden" style={{ height: 1056 * scale + 16 }}>
      <div style={{ width: 816 * scale, height: 1056 * scale, overflow: "hidden" }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 816 }} className="bg-white shadow">
          <FormPaper content={content} answers={{}} labels={{}} />
        </div>
      </div>
    </div>
  );
}

function ActionEditor({ action, fields, onChange, onRemove }: {
  action: FormAction; fields: FormField[]; onChange: (patch: Partial<FormAction>) => void; onRemove: () => void;
}) {
  const featureFields = fields.filter((f) => f.type === "feature");
  const target = featureFields.find((f) => f.id === action.featureField);
  const kind = (target?.featureKind ?? "hydrant") as FeatureKind;
  const details = DETAIL_FIELDS[kind];
  const detail = details.find((d) => d.key === action.detail);
  const sourceFields = fields.filter((f) => (detail?.type === "date" ? f.type === "date" : detail?.options ? f.type === "select" : false));
  const sourceField = action.source.kind === "field" ? fields.find((f) => f.id === (action.source as { field: string }).field) : undefined;

  function pickDetail(key: string) {
    const d = details.find((x) => x.key === key);
    onChange({ detail: key, mapping: undefined, source: d?.type === "date" ? { kind: "today" } : { kind: "field", field: "" } });
  }
  function pickSource(value: string) {
    if (value === "__today") return onChange({ source: { kind: "today" }, mapping: undefined });
    onChange({ source: { kind: "field", field: value }, mapping: undefined });
  }

  return (
    <div data-testid="builder-action" className="border border-slate-200 rounded p-3 bg-slate-50 flex flex-col gap-2 text-[12px]">
      <div className="flex gap-2 items-end flex-wrap">
        <label className="flex-1 min-w-[140px]">Point à modifier
          <select className={INPUT} value={action.featureField} onChange={(e) => {
            const f = featureFields.find((x) => x.id === e.target.value);
            const k = (f?.featureKind ?? "hydrant") as FeatureKind;
            onChange({ featureField: e.target.value, detail: DETAIL_FIELDS[k][0]?.key ?? "", mapping: undefined, source: { kind: "today" } });
          }}>
            {featureFields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        <label className="flex-1 min-w-[140px]">Information
          <select className={INPUT} value={action.detail} onChange={(e) => pickDetail(e.target.value)}>
            {details.filter((d) => d.type === "date" || d.options).map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </label>
        <label className="flex-1 min-w-[140px]">Valeur prise depuis
          <select className={INPUT} value={action.source.kind === "today" ? "__today" : action.source.field} onChange={(e) => pickSource(e.target.value)}>
            {detail?.type === "date" && <option value="__today">Date du jour de l&apos;envoi</option>}
            {action.source.kind === "field" && !action.source.field && <option value="">— choisir un champ —</option>}
            {sourceFields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        <button type="button" className={`${SMALL_BTN} text-red-700`} onClick={onRemove}>Supprimer</button>
      </div>
      {detail?.options && sourceField?.type === "select" && (
        <div className="flex flex-col gap-1">
          <p>Correspondance des choix :</p>
          {sourceField.options?.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2">
              <span className="w-1/2 truncate">{opt.label} →</span>
              <select className={INPUT} value={action.mapping?.[opt.id] ?? ""}
                onChange={(e) => {
                  const next = { ...(action.mapping ?? {}) };
                  if (e.target.value) next[opt.id] = e.target.value; else delete next[opt.id];
                  onChange({ mapping: next });
                }}>
                <option value="">(ne rien changer)</option>
                {detail.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
