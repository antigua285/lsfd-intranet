"use client";

import { useState } from "react";
import {
  DETAIL_FIELDS,
  FEATURE_KINDS,
  FEATURE_META,
  ZONE_COLORS,
  ZONE_KINDS,
  ZONE_META,
  sortByName,
  type FeatureKind,
  type MapFeature,
  type MapZone,
  type ZoneKind,
} from "@/lib/map-types";
import { weatherLines } from "./leaflet-helpers";
import type { WeatherState } from "./useWeather";

const INPUT =
  "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#0d2644]";
const BTN_PRIMARY =
  "bg-[#0d2644] text-white text-[12px] font-bold uppercase tracking-wide rounded px-3 py-1.5 hover:bg-[#143a66] disabled:opacity-50 transition-colors";
const BTN_SECONDARY =
  "border border-slate-300 text-slate-700 text-[12px] font-bold uppercase tracking-wide rounded px-3 py-1.5 hover:bg-slate-100 disabled:opacity-50 transition-colors";
const BTN_DANGER =
  "border border-red-300 text-red-700 text-[12px] font-bold uppercase tracking-wide rounded px-3 py-1.5 hover:bg-red-50 disabled:opacity-50 transition-colors";

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-slate-200 rounded bg-white">
      <h2 className="text-[12px] font-bold uppercase tracking-wide text-slate-600 bg-slate-50 border-b border-slate-200 px-3 py-2">
        {title}
      </h2>
      <div className="p-3 text-[13px] text-slate-700">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ météo */

export function WeatherCard({ weather }: { weather: WeatherState }) {
  return (
    <Card title="Météo · Los Santos">
      {weather.status === "loading" && <p className="text-slate-500">Chargement…</p>}
      {weather.status === "error" && (
        <p className="text-slate-500">Météo indisponible pour le moment.</p>
      )}
      {weather.status === "ok" && (
        <div data-testid="weather-card">
          <p className="font-bold text-[15px] text-[#0d2644]">{weather.data.summary}</p>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            {weatherLines(weather.data).map((line) => (
              <div key={line.label} className="contents">
                <dt className="text-slate-500">{line.label}</dt>
                <dd>{line.value}</dd>
              </div>
            ))}
          </dl>
          {weather.data.redFlag && (
            <p className="mt-2 bg-red-100 text-red-800 font-bold rounded px-2 py-1">
              Vent fort + air très sec : conditions critiques
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- filtres */

export type HiddenSet = Set<string>;
export const kindKey = (kind: FeatureKind) => `k:${kind}`;
export const zoneKindKey = (kind: ZoneKind) => `z:${kind}`;

type FilterProps = {
  features: MapFeature[];
  zones: MapZone[];
  hidden: HiddenSet;
  selectedId: string | null;
  onToggle: (key: string) => void;
  onFocusFeature: (id: string) => void;
  onFocusZone: (id: string) => void;
};

export function FiltersCard({
  features,
  zones,
  hidden,
  selectedId,
  onToggle,
  onFocusFeature,
  onFocusZone,
}: FilterProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const needle = search.trim().toLowerCase();

  function toggleOpen(key: string) {
    setOpen((previous) => {
      const next = new Set(previous);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  type Group = {
    key: string;
    label: string;
    swatch: string;
    items: { id: string; name: string; type: "feature" | "zone" }[];
  };

  const groups: Group[] = [
    ...ZONE_KINDS.map((kind) => ({
      key: zoneKindKey(kind),
      label: ZONE_META[kind].plural,
      swatch: ZONE_META[kind].defaultColor,
      items: sortByName(zones.filter((z) => z.kind === kind)).map((z) => ({
        id: z.id,
        name: z.name,
        type: "zone" as const,
      })),
    })),
    ...FEATURE_KINDS.map((kind) => ({
      key: kindKey(kind),
      label: FEATURE_META[kind].plural,
      swatch: FEATURE_META[kind].color,
      items: sortByName(features.filter((f) => f.kind === kind)).map((f) => ({
        id: f.id,
        name: f.name,
        type: "feature" as const,
      })),
    })),
  ];

  return (
    <Card title="Filtres">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un nom…"
        aria-label="Rechercher dans la carte"
        className={`${INPUT} mb-2`}
      />
      <ul className="flex flex-col gap-1">
        {groups.map((group) => {
          const items = needle
            ? group.items.filter((i) => i.name.toLowerCase().includes(needle))
            : group.items;
          if (needle && items.length === 0) return null;
          const expanded = open.has(group.key) || needle.length > 0;
          return (
            <li key={group.key} data-group={group.key}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!hidden.has(group.key)}
                  onChange={() => onToggle(group.key)}
                  aria-label={`Afficher : ${group.label}`}
                  className="h-4 w-4 accent-[#0d2644]"
                />
                <span
                  className="inline-block h-3 w-3 rounded-full shrink-0"
                  style={{ background: group.swatch }}
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => toggleOpen(group.key)}
                  aria-expanded={expanded}
                  className="flex-1 text-left font-bold text-slate-700 hover:text-[#0d2644]"
                >
                  {group.label}{" "}
                  <span className="font-normal text-slate-500">({group.items.length})</span>
                </button>
                <span className="text-slate-400 text-[11px]" aria-hidden>
                  {expanded ? "▾" : "▸"}
                </span>
              </div>
              {expanded && (
                <ul className="ml-6 mt-1 mb-1 flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                  {items.length === 0 && <li className="text-slate-400 text-[12px]">Aucun élément</li>}
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hidden.has(item.id)}
                        onChange={() => onToggle(item.id)}
                        aria-label={`Afficher : ${item.name}`}
                        className="h-3.5 w-3.5 accent-[#0d2644]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          item.type === "feature" ? onFocusFeature(item.id) : onFocusZone(item.id)
                        }
                        className={`text-left truncate hover:underline ${
                          item.id === selectedId ? "font-bold text-[#0d2644]" : ""
                        } ${hidden.has(item.id) || hidden.has(group.key) ? "text-slate-400" : ""}`}
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-slate-400">
        Les filtres ne concernent que ton affichage.
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ outils */

export type Tool =
  | { type: "point"; kind: FeatureKind }
  | { type: "zone"; kind: ZoneKind }
  | null;

export function ToolsCard({
  tool,
  draftCount,
  onChoose,
  onFinishDraft,
  onUndoDraft,
  onCancelDraft,
  onCreateAssembly,
  busy,
}: {
  tool: Tool;
  draftCount: number;
  onChoose: (tool: Tool) => void;
  onFinishDraft: () => void;
  onUndoDraft: () => void;
  onCancelDraft: () => void;
  onCreateAssembly: () => void;
  busy: boolean;
}) {
  const same = (a: Tool, b: Tool) => a?.type === b?.type && a?.kind === b?.kind;
  const button = (label: string, value: Tool) => (
    <button
      key={label}
      type="button"
      aria-pressed={same(tool, value)}
      onClick={() => onChoose(same(tool, value) ? null : value)}
      className={`text-left text-[12px] rounded border px-2 py-1.5 transition-colors ${
        same(tool, value)
          ? "bg-[#0d2644] text-white border-[#0d2644]"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Card title="Outils d'édition">
      <div className="grid grid-cols-2 gap-1.5">
        {FEATURE_KINDS.map((kind) => button(`+ ${FEATURE_META[kind].label}`, { type: "point", kind }))}
        {ZONE_KINDS.map((kind) => button(`+ Zone : ${ZONE_META[kind].label}`, { type: "zone", kind }))}
        <button
          type="button"
          disabled={busy}
          onClick={onCreateAssembly}
          className="col-span-2 text-left text-[12px] rounded border border-slate-300 bg-white text-slate-700 px-2 py-1.5 hover:bg-slate-100 disabled:opacity-50 transition-colors"
        >
          + Bureau : assemblage de bataillons
        </button>
      </div>

      <p className="mt-2 text-[12px] text-slate-500" data-testid="tool-hint">
        {tool?.type === "point" &&
          `Clique sur la carte pour placer : ${FEATURE_META[tool.kind].label}. Échap pour arrêter.`}
        {tool?.type === "zone" &&
          `Clique sur la carte pour poser les sommets de la zone (${draftCount} posé${draftCount > 1 ? "s" : ""}). Entrée = terminer.`}
        {!tool &&
          "Clique un point ou une zone pour la modifier. Glisse un point pour le déplacer. Choisis un outil pour en ajouter."}
      </p>

      {tool?.type === "zone" && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" className={BTN_PRIMARY} disabled={draftCount < 3 || busy} onClick={onFinishDraft}>
            Terminer la zone
          </button>
          <button type="button" className={BTN_SECONDARY} disabled={draftCount === 0} onClick={onUndoDraft}>
            Retirer le dernier
          </button>
          <button type="button" className={BTN_SECONDARY} onClick={onCancelDraft}>
            Annuler
          </button>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------- formulaires */

export function FeatureForm({
  feature,
  busy,
  message,
  onSave,
  onDelete,
}: {
  feature: MapFeature;
  busy: boolean;
  message: string | null;
  onSave: (name: string, details: Record<string, string>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(feature.name);
  const [details, setDetails] = useState<Record<string, string>>(feature.details);
  const set = (key: string, value: string) => setDetails((prev) => ({ ...prev, [key]: value }));

  return (
    <Card title={`Modifier : ${FEATURE_META[feature.kind].label}`}>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name, details);
        }}
      >
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] text-slate-500">Nom</span>
          <input
            className={INPUT}
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        {DETAIL_FIELDS[feature.kind].map((field) => (
          <label key={field.key} className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-500">{field.label}</span>
            {field.options ? (
              <select
                className={INPUT}
                value={details[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
              >
                <option value="">Non renseigné</option>
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : field.type === "date" ? (
              <input
                type="date"
                className={INPUT}
                value={details[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
              />
            ) : field.multiline ? (
              <textarea
                className={INPUT}
                rows={2}
                maxLength={field.max}
                value={details[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
              />
            ) : (
              <input
                className={INPUT}
                maxLength={field.max}
                value={details[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
              />
            )}
          </label>
        ))}
        <FormFooter busy={busy} message={message} onDelete={onDelete} />
      </form>
    </Card>
  );
}

export function ZoneForm({
  zone,
  battalions,
  busy,
  message,
  onSave,
  onDelete,
}: {
  zone: MapZone;
  /** Tous les bataillons existants (pour composer un bureau). */
  battalions: MapZone[];
  busy: boolean;
  message: string | null;
  onSave: (fields: { name: string; kind: ZoneKind; color: string; members: string[] | null }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(zone.name);
  const [kind, setKind] = useState<ZoneKind>(zone.kind);
  const [color, setColor] = useState(zone.color);
  const [members, setMembers] = useState<string[]>(
    (zone.members ?? []).filter((id) => battalions.some((b) => b.id === id))
  );
  const toggleMember = (id: string) =>
    setMembers((previous) => (previous.includes(id) ? previous.filter((m) => m !== id) : [...previous, id]));
  const hasOwnShape = zone.points.length >= 3;

  return (
    <Card title={`Modifier : ${ZONE_META[zone.kind].label}`}>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, kind, color, members: kind === "bureau" ? members : null });
        }}
      >
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] text-slate-500">Nom</span>
          <input className={INPUT} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] text-slate-500">Type de zone</span>
          <select className={INPUT} value={kind} onChange={(e) => setKind(e.target.value as ZoneKind)}>
            {ZONE_KINDS.map((k) => (
              <option key={k} value={k}>
                {ZONE_META[k].label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-500">Couleur</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {ZONE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Couleur ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-[#0d2644]" : "border-white shadow"}`}
                style={{ background: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Couleur personnalisée"
              className="h-7 w-9 p-0 border border-slate-300 rounded bg-white"
            />
          </div>
        </div>
        {kind === "bureau" && (
          <fieldset className="border border-slate-200 rounded p-2">
            <legend className="px-1 text-[11px] text-slate-500">Assembler des bataillons</legend>
            {battalions.length === 0 ? (
              <p className="text-[12px] text-slate-500">Aucun bataillon n&apos;est encore tracé.</p>
            ) : (
              <ul className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                {sortByName(battalions).map((b) => (
                  <li key={b.id}>
                    <label className="flex items-center gap-2 text-[13px]">
                      <input
                        type="checkbox"
                        checked={members.includes(b.id)}
                        onChange={() => toggleMember(b.id)}
                        className="h-4 w-4 accent-[#0d2644]"
                      />
                      {b.name}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-[11px] text-slate-500">
              {members.length > 0
                ? "La forme du bureau est la réunion des bataillons cochés : elle suit leurs modifications."
                : hasOwnShape
                  ? "Aucun bataillon coché : le bureau garde son propre tracé."
                  : "Coche au moins un bataillon pour que ce bureau apparaisse sur la carte."}
            </p>
          </fieldset>
        )}
        {!(kind === "bureau" && members.length > 0) && (
          <p className="text-[11px] text-slate-500">
            Forme : glisse les ronds blancs pour déformer la zone, clique un petit rond foncé pour ajouter
            un sommet, clic droit sur un rond blanc pour le supprimer.
          </p>
        )}
        <FormFooter busy={busy} message={message} onDelete={onDelete} />
      </form>
    </Card>
  );
}

function FormFooter({
  busy,
  message,
  onDelete,
}: {
  busy: boolean;
  message: string | null;
  onDelete: () => void;
}) {
  return (
    <>
      {message && (
        <p role="status" className="text-[12px] text-slate-600">
          {message}
        </p>
      )}
      <div className="flex gap-1.5 pt-1">
        <button type="submit" className={BTN_PRIMARY} disabled={busy}>
          Enregistrer
        </button>
        <button type="button" className={BTN_DANGER} disabled={busy} onClick={onDelete}>
          Supprimer
        </button>
      </div>
    </>
  );
}
