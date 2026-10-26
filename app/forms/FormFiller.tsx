"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Combobox, type ComboItem } from "@/components/Combobox";
import { FIELD_META, checkedIds, type FormField } from "@/lib/forms-types";
import { LIMITS } from "@/lib/forms-validation";
import { splitAddress, suggestPlaces } from "@/lib/locations";
import { submitFormAction } from "./actions";

export type PointOption = { id: string; label: string };

type Props = {
  formId: string;
  fields: FormField[];
  /** Points de la carte proposés, par type (uniquement ceux dont le formulaire a besoin). */
  pointOptions: Record<string, PointOption[]>;
};

const LINE =
  "w-full bg-transparent border-0 border-b border-slate-500 px-1 py-1 text-[14px] focus:outline-none focus:border-[#0d2644] focus:bg-[#f4f8fc] aria-[invalid=true]:border-red-600";

/** Formulaire en ligne : sobre, façon papier administratif (libellé suivi d'une ligne à remplir). */
export function FormFiller({ formId, fields, pointOptions }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Texte tapé dans un champ « point » avant d'avoir choisi dans la liste.
  const [pointQuery, setPointQuery] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => (prev[id] ? { ...prev, [id]: "" } : prev));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const result = await submitFormAction(formId, answers);
      if (result.ok) {
        router.push(`/reports/${result.id}`);
        return;
      }
      setFormError(result.error);
      setErrors(result.fieldErrors ?? {});
    } catch {
      setFormError("L'envoi a échoué (session expirée ou connexion perdue ?). Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="font-['Arial','Helvetica',sans-serif] text-[14px] text-slate-900">
      <div className="flex flex-col gap-3">
        {fields.map((field, index) => {
          if (field.type === "heading") {
            return (
              <h2 key={field.id} className={`font-bold uppercase text-[15px] ${index === 0 ? "" : "mt-5"}`}>
                {field.label}
              </h2>
            );
          }
          if (field.type === "note") {
            return (
              <p key={field.id} className="text-[12px] italic text-slate-600 whitespace-pre-wrap">
                {field.label}
              </p>
            );
          }
          const value = answers[field.id] ?? "";
          const error = errors[field.id];
          const inputId = `field-${field.id}`;
          const label = (
            <label htmlFor={inputId} className="shrink-0">
              {field.label}
              {field.required && <span className="text-red-700" aria-hidden> *</span>}
              {field.type !== "long" && ":"}
            </label>
          );
          if (field.type === "checkbox") {
            const checked = new Set(checkedIds(value));
            const toggle = (id: string) => {
              const next = new Set(field.multiple === false ? [] : checked);
              if (checked.has(id)) next.delete(id);
              else next.add(id);
              set(field.id, (field.options ?? []).filter((o) => next.has(o.id)).map((o) => o.id).join(","));
            };
            return (
              <fieldset key={field.id} data-testid="checkbox-group" aria-required={field.required} aria-invalid={!!error} className="border-0 p-0 m-0 min-w-0">
                <legend className="font-bold p-0 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-700" aria-hidden> *</span>}:
                </legend>
                <div className="grid gap-x-4 gap-y-1.5" style={{ gridTemplateColumns: `repeat(${field.columns ?? 2}, minmax(0, 1fr))` }}>
                  {(field.options ?? []).map((o) => (
                    <label key={o.id} className="flex items-start gap-2 cursor-pointer min-w-0">
                      <input type="checkbox" className="mt-[3px] h-[14px] w-[14px] shrink-0 accent-[#0d2644]" checked={checked.has(o.id)} onChange={() => toggle(o.id)} />
                      <span className="break-words min-w-0">{o.label}</span>
                    </label>
                  ))}
                </div>
                {field.multiple === false && <p className="text-[11px] text-slate-500 mt-1">Un seul choix possible.</p>}
                {error && <p role="alert" className="text-[12px] text-red-700 mt-0.5">{error}</p>}
              </fieldset>
            );
          }
          const half = field.width === "half";
          return (
            <div key={field.id} className={half ? "sm:w-[calc(50%-12px)] sm:inline-block" : ""} style={half ? { display: undefined } : undefined}>
              <div className={field.type === "long" ? "flex flex-col gap-1" : "flex items-end gap-2"}>
                {label}
                {field.type === "short" && (
                  <input id={inputId} className={LINE} value={value} maxLength={LIMITS.short} aria-invalid={!!error} aria-required={field.required}
                    onChange={(e) => set(field.id, e.target.value)} />
                )}
                {field.type === "long" && (
                  <textarea id={inputId} rows={5} maxLength={LIMITS.long} aria-invalid={!!error} aria-required={field.required}
                    className="w-full border border-slate-500 px-2 py-1.5 text-[14px] focus:outline-none focus:border-[#0d2644] focus:bg-[#f4f8fc] aria-[invalid=true]:border-red-600"
                    value={value} onChange={(e) => set(field.id, e.target.value)} />
                )}
                {field.type === "date" && (
                  <input id={inputId} type="date" className={LINE} value={value} aria-invalid={!!error} aria-required={field.required}
                    onChange={(e) => set(field.id, e.target.value)} />
                )}
                {field.type === "select" && (
                  <select id={inputId} className={LINE} value={value} aria-invalid={!!error} aria-required={field.required}
                    onChange={(e) => set(field.id, e.target.value)}>
                    <option value="">Select…</option>
                    {field.options?.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                )}
                {field.type === "location" && (
                  <Combobox
                    id={inputId}
                    ariaLabel={field.label}
                    className={LINE}
                    value={value}
                    invalid={!!error}
                    placeholder="Street or district (e.g. 1234 Vinewood Blvd)"
                    onChange={(text) => set(field.id, text)}
                    items={suggestPlaces(value).map<ComboItem>((p) => ({
                      key: `${p.kind}:${p.name}`,
                      label: p.name,
                      hint: p.kind === "district" ? "District" : p.kind === "highway" ? "Highway" : "Street",
                    }))}
                    onPick={(item) => set(field.id, splitAddress(value).prefix + item.label)}
                  />
                )}
                {field.type === "feature" && (
                  <PointPicker
                    id={inputId}
                    label={field.label}
                    invalid={!!error}
                    options={pointOptions[field.featureKind ?? ""] ?? []}
                    selectedId={value}
                    query={pointQuery[field.id] ?? ""}
                    onQuery={(q) => {
                      setPointQuery((prev) => ({ ...prev, [field.id]: q }));
                      set(field.id, ""); // retaper = choisir à nouveau
                    }}
                    onPick={(id) => set(field.id, id)}
                  />
                )}
              </div>
              {error && <p role="alert" className="text-[12px] text-red-700 mt-0.5">{error}</p>}
              {field.type === "feature" && (pointOptions[field.featureKind ?? ""] ?? []).length === 0 && (
                <p className="text-[12px] text-slate-500 mt-0.5">Aucun point de ce type n&apos;existe encore sur la carte.</p>
              )}
            </div>
          );
        })}
      </div>

      {formError && (
        <p role="alert" data-testid="form-error" className="mt-5 border border-red-300 bg-red-50 text-red-800 text-[13px] rounded px-3 py-2">
          {formError}
        </p>
      )}
      <div className="mt-6 flex items-center gap-3">
        <button type="submit" disabled={busy} className="bg-[#0d2644] text-white text-[13px] font-bold uppercase tracking-wide rounded px-5 py-2 hover:bg-[#143a66] disabled:opacity-50 transition-colors">
          {busy ? "Envoi…" : "Submit report"}
        </button>
        <span className="text-[12px] text-slate-500">
          {fields.some((f) => FIELD_META[f.type].answered && f.required) && "* required"}
        </span>
      </div>
    </form>
  );
}

function PointPicker({
  id,
  label,
  invalid,
  options,
  selectedId,
  query,
  onQuery,
  onPick,
}: {
  id: string;
  label: string;
  invalid: boolean;
  options: PointOption[];
  selectedId: string;
  query: string;
  onQuery: (q: string) => void;
  onPick: (id: string) => void;
}) {
  const selected = options.find((o) => o.id === selectedId);
  const needle = query.trim().toLowerCase();
  const items = options
    .filter((o) => !needle || o.label.toLowerCase().includes(needle))
    .slice(0, 12)
    .map<ComboItem>((o) => ({ key: o.id, label: o.label }));

  return (
    <Combobox
      id={id}
      ariaLabel={label}
      className={LINE}
      value={selected ? selected.label : query}
      invalid={invalid}
      placeholder="Search the map…"
      onChange={onQuery}
      items={items}
      onPick={(item) => onPick(item.key)}
    />
  );
}
