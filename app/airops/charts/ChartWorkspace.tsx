"use client";

import "leaflet/dist/leaflet.css";
import "./chart.css";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type * as Leaflet from "leaflet";
import {
  KIND_LABEL, MARK_COLORS, POINT_KINDS, calibrate, computeLegs, emptyPlan, feetToNm, fmtDeg, fmtMin, fmtNm, patternGeometry, pointKind, symbolSvg, uid,
  type ChartDef, type ChartPoint, type Mark, type Pattern, type PlanData, type PointKind,
} from "@/lib/airops-charts";
import type { PlanRecord } from "@/lib/airops-charts-db";
import { deletePlanAction, deletePointAction, planToFlightPlanAction, saveCalibrationAction, savePlanAction, savePointAction } from "./actions";

type Size = { w: number; h: number };
type Tool = "pan" | "route" | "pattern" | "line" | "text" | "erase" | "pt-edit" | "calibrate" | `sym:${PointKind}`;
type PointForm = { id: string | null; kind: PointKind; ident: string; name: string; freq: string; elevation: string; note: string; x: number; y: number };

const inp = "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] bg-white";
const lab = "block text-[10.5px] font-bold uppercase tracking-wide text-slate-600 mb-0.5";
const btn = "min-h-9 px-2.5 rounded border text-[12.5px] font-semibold";

function dom(html: string, cls: string, label?: string): HTMLElement {
  const el = document.createElement("div");
  el.className = cls;
  el.innerHTML = html; // symboles SVG constants uniquement (jamais de texte saisi)
  if (label) { const s = document.createElement("span"); s.className = "ac-lab"; s.textContent = label; el.appendChild(s); }
  return el;
}
function textEl(cls: string, text: string): HTMLElement { const el = document.createElement("div"); el.className = cls; el.textContent = text; return el; }

export function ChartWorkspace({ chart, points: initialPoints, plans: initialPlans, scale: initialScale, isCmd, meId }: {
  chart: ChartDef; points: ChartPoint[]; plans: PlanRecord[]; scale: number | null; isCmd: boolean; meId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [size, setSize] = useState<Size | null>(null);
  const [missing, setMissing] = useState(false);
  const [mapVersion, setMapVersion] = useState(0);
  const [planning, setPlanning] = useState(false);
  const [tool, setTool] = useState<Tool>("pan");
  const [plan, setPlan] = useState<PlanData>(emptyPlan());
  const [past, setPast] = useState<PlanData[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [plans, setPlans] = useState(initialPlans);
  const [points, setPoints] = useState(initialPoints);
  const [scale, setScale] = useState(initialScale);
  const [color, setColor] = useState<string>(MARK_COLORS[0]);
  const [label, setLabel] = useState("");
  const [lineDraft, setLineDraft] = useState<[number, number][]>([]);
  const [patDraft, setPatDraft] = useState<[number, number] | null>(null);
  const [patSide, setPatSide] = useState<"L" | "R">("L");
  const [patAlt, setPatAlt] = useState(1000);
  const [patHeli, setPatHeli] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [pointForm, setPointForm] = useState<PointForm | null>(null);
  const [calib, setCalib] = useState<{ pts: [number, number][]; dist: string } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [filter, setFilter] = useState("");

  const unit: "nm" | "ft" = chart.kind === "airport" ? "ft" : "nm";
  const aspect = size ? size.h / size.w : 1;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const layers = useRef<Record<"points" | "route" | "marks" | "pattern" | "draft", Leaflet.LayerGroup | null>>({ points: null, route: null, marks: null, pattern: null, draft: null });

  const commit = (next: PlanData) => { setPast((p) => [...p.slice(-30), plan]); setPlan(next); };
  const undo = () => setPast((p) => { if (!p.length) return p; setPlan(p[p.length - 1]); return p.slice(0, -1); });

  // Les fonctions appelées par Leaflet doivent voir l'état le plus récent.
  const latest = useRef({ tool, planning, plan, points, label, color, lineDraft, patDraft, patSide, patAlt, patHeli, calib, isCmd, commit, selected });
  useEffect(() => { latest.current = { tool, planning, plan, points, label, color, lineDraft, patDraft, patSide, patAlt, patHeli, calib, isCmd, commit, selected }; });
  type Actions = { markerClick: (p: ChartPoint) => void; mapClick: (ll: Leaflet.LatLng) => void; movePoint: (p: ChartPoint, x: number, y: number) => void };
  const actions = useRef<Actions>({ markerClick: () => {}, mapClick: () => {}, movePoint: () => {} });

  /* ------------------------------------------------------------ image */
  useEffect(() => {
    const img = new Image();
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setMissing(true);
    img.src = chart.image;
  }, [chart.image]);

  const toLL = (L: typeof Leaflet, x: number, y: number) => L.latLng((1 - y) * size!.h, x * size!.w);
  const frac = (ll: { lat: number; lng: number }): [number, number] => [Math.min(1, Math.max(0, ll.lng / size!.w)), Math.min(1, Math.max(0, 1 - ll.lat / size!.h))];

  /* ------------------------------------------------------------ carte */
  useEffect(() => {
    if (!size || !containerRef.current) return;
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    let ro: ResizeObserver | null = null;
    const g = layers.current;
    (async () => {
      const mod = await import("leaflet");
      const L = ((mod as unknown as { default?: typeof Leaflet }).default ?? mod) as typeof Leaflet;
      if (cancelled || !containerRef.current) return;
      const bounds = L.latLngBounds([0, 0], [size.h, size.w]);
      map = L.map(containerRef.current, { crs: L.CRS.Simple, minZoom: -6, maxZoom: 3, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, attributionControl: false, doubleClickZoom: false, keyboard: false, maxBounds: bounds, maxBoundsViscosity: 1 });
      L.imageOverlay(chart.image, bounds).addTo(map);
      const fit = (m: Leaflet.Map) => m.setMinZoom(m.getBoundsZoom(bounds, true));
      fit(map);
      map.fitBounds(bounds, { animate: false });
      ro = new ResizeObserver(() => { if (map) { map.invalidateSize(); fit(map); } });
      ro.observe(containerRef.current);
      for (const k of ["points", "route", "marks", "pattern", "draft"] as const) g[k] = L.layerGroup().addTo(map);
      map.on("click", (e: Leaflet.LeafletMouseEvent) => actions.current.mapClick(e.latlng));
      LRef.current = L; mapRef.current = map;
      setMapVersion((v) => v + 1);
    })();
    return () => { cancelled = true; ro?.disconnect(); map?.remove(); mapRef.current = null; for (const k of Object.keys(g) as (keyof typeof g)[]) g[k] = null; };
  }, [size, chart.image]);

  /* ------------------------------------------------------------ actions de la carte */
  const markerClick = (p: ChartPoint) => {
    const s = latest.current;
    if (s.planning && s.tool === "route") { s.commit({ ...s.plan, route: [...s.plan.route, { x: p.x, y: p.y, name: p.ident || p.name, pointId: p.id }].slice(0, 40) }); return; }
    setSelected(p.id);
    if (s.isCmd && s.tool === "pt-edit") setPointForm({ id: p.id, kind: p.kind, ident: p.ident, name: p.name, freq: p.freq, elevation: p.elevation === null ? "" : String(p.elevation), note: p.note, x: p.x, y: p.y });
  };
  const movePoint = (p: ChartPoint, x: number, y: number) => {
    start(async () => {
      const r = await savePointAction(chart.key, p.id, { kind: p.kind, ident: p.ident, name: p.name, freq: p.freq, elevation: p.elevation, note: p.note, x, y });
      if (r.ok) setPoints((l) => l.map((q) => (q.id === p.id ? { ...q, x, y } : q))); else setMsg({ ok: false, text: r.error });
    });
  };
  const mapClick = (ll: Leaflet.LatLng) => {
    const s = latest.current, map = mapRef.current;
    if (!size || !map) return;
    const [x, y] = frac(ll);
    if (s.isCmd && s.tool === "pt-edit") { setPointForm({ id: null, kind: "waypoint", ident: "", name: "", freq: "", elevation: "", note: "", x, y }); return; }
    if (s.isCmd && s.tool === "calibrate") { setCalib((c) => ((c?.pts.length ?? 0) >= 2 ? { pts: [[x, y]], dist: "" } : { pts: [...(c?.pts ?? []), [x, y]], dist: c?.dist ?? "" })); return; }
    if (!s.planning) return;
    if (s.tool === "route") {
      // Aimantation sur un point de carte proche (16 px).
      const cp = map.latLngToContainerPoint(ll);
      let best: ChartPoint | null = null, bd = 16;
      for (const p of s.points) { const q = map.latLngToContainerPoint(LRef.current!.latLng((1 - p.y) * size.h, p.x * size.w)); const d = Math.hypot(q.x - cp.x, q.y - cp.y); if (d < bd) { bd = d; best = p; } }
      const name = best ? best.ident || best.name : `WP${s.plan.route.length + 1}`;
      s.commit({ ...s.plan, route: [...s.plan.route, { x: best?.x ?? x, y: best?.y ?? y, name, ...(best ? { pointId: best.id } : {}) }].slice(0, 40) });
    } else if (s.tool === "line") setLineDraft((d) => (d.length >= 400 ? d : [...d, [x, y]]));
    else if (s.tool === "text" && s.label.trim()) s.commit({ ...s.plan, marks: [...s.plan.marks, { id: uid(), t: "text", color: s.color, x, y, text: s.label.trim().slice(0, 60) } as Mark].slice(0, 150) });
    else if (s.tool.startsWith("sym:")) s.commit({ ...s.plan, marks: [...s.plan.marks, { id: uid(), t: "symbol", color: s.color, x, y, kind: s.tool.slice(4) as PointKind, text: s.label.trim().slice(0, 60) } as Mark].slice(0, 150) });
    else if (s.tool === "pattern") {
      if (!s.patDraft) setPatDraft([x, y]);
      else { s.commit({ ...s.plan, patterns: [...s.plan.patterns, { id: uid(), start: s.patDraft, end: [x, y] as [number, number], side: s.patSide, altAgl: s.patAlt, heli: s.patHeli }].slice(0, 4) }); setPatDraft(null); }
    }
  };

  useEffect(() => { actions.current = { markerClick, mapClick, movePoint }; });

  /* ------------------------------------------------------------ dessin : points de la carte */
  useEffect(() => {
    const L = LRef.current, g = layers.current.points;
    if (!L || !g || !size) return;
    g.clearLayers();
    const edit = isCmd && tool === "pt-edit";
    for (const p of points) {
      const k = pointKind(p.kind);
      const el = dom(symbolSvg(p.kind, k.color), `ac-pt${selected === p.id ? " is-sel" : ""}`, p.ident || p.name);
      const m = L.marker(toLL(L, p.x, p.y), { icon: L.divIcon({ html: el, className: "ac-wrap", iconSize: [30, 30], iconAnchor: [15, 15] }), draggable: edit, keyboard: false, zIndexOffset: 100 });
      m.on("click", (e) => { L.DomEvent.stopPropagation(e); actions.current.markerClick(p); });
      m.on("dragend", () => { const [x, y] = frac(m.getLatLng()); actions.current.movePoint(p, x, y); });
      m.addTo(g);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapVersion, points, selected, tool, isCmd, size]);

  /* ------------------------------------------------------------ dessin : route */
  const legs = computeLegs(plan.route, aspect, scale, plan.tas, plan.windDir, plan.windSpd, plan.magVar);
  useEffect(() => {
    const L = LRef.current, g = layers.current.route;
    if (!L || !g || !size) return;
    g.clearLayers();
    const route = plan.route;
    if (route.length > 1) L.polyline(route.map((p) => toLL(L, p.x, p.y)), { color: "#c026d3", weight: 4, opacity: 0.9, interactive: false }).addTo(g);
    const erase = planning && tool === "erase";
    route.forEach((p, i) => {
      const el = document.createElement("div"); el.className = "ac-wp"; el.textContent = String(i + 1);
      const name = document.createElement("span"); name.className = "ac-lab"; name.textContent = p.name; el.appendChild(name);
      const m = L.marker(toLL(L, p.x, p.y), { icon: L.divIcon({ html: el, className: "ac-wrap", iconSize: [24, 24], iconAnchor: [12, 12] }), draggable: planning && !erase, keyboard: false, zIndexOffset: 500 });
      m.on("click", (e) => { L.DomEvent.stopPropagation(e); if (erase) { const s = latest.current; s.commit({ ...s.plan, route: s.plan.route.filter((_, j) => j !== i) }); } });
      m.on("dragend", () => { const [x, y] = frac(m.getLatLng()); const s = latest.current; s.commit({ ...s.plan, route: s.plan.route.map((q, j) => (j === i ? { ...q, x, y, pointId: undefined } : q)) }); });
      m.addTo(g);
    });
    legs.forEach((l, i) => {
      const a = route[i], b = route[i + 1];
      const mid = L.latLng((toLL(L, a.x, a.y).lat + toLL(L, b.x, b.y).lat) / 2, (toLL(L, a.x, a.y).lng + toLL(L, b.x, b.y).lng) / 2);
      const el = document.createElement("div"); el.className = "ac-leg";
      const arrow = document.createElement("i"); arrow.textContent = "▲"; arrow.style.transform = `rotate(${l.tc}deg)`; el.appendChild(arrow);
      el.appendChild(document.createTextNode(`${fmtDeg(l.mc)}M${scale ? ` · ${fmtNm(l.nm, unit)}` : ""}`));
      L.marker(mid, { icon: L.divIcon({ html: el, className: "ac-wrap", iconSize: [0, 0] }), interactive: false, keyboard: false, zIndexOffset: 400 }).addTo(g);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapVersion, plan.route, plan.tas, plan.windDir, plan.windSpd, plan.magVar, scale, planning, tool, size]);

  /* ------------------------------------------------------------ dessin : annotations et circuits */
  useEffect(() => {
    const L = LRef.current, gm = layers.current.marks, gp = layers.current.pattern;
    if (!L || !gm || !gp || !size) return;
    gm.clearLayers(); gp.clearLayers();
    const erase = planning && tool === "erase";
    const del = (id: string, kind: "mark" | "pattern") => { const s = latest.current; s.commit(kind === "mark" ? { ...s.plan, marks: s.plan.marks.filter((m) => m.id !== id) } : { ...s.plan, patterns: s.plan.patterns.filter((m) => m.id !== id) }); };
    for (const m of plan.marks as Mark[]) {
      if (m.t === "line") {
        const pl = L.polyline(m.pts.map(([x, y]) => toLL(L, x, y)), { color: m.color, weight: 3, opacity: 0.9, interactive: erase }).addTo(gm);
        if (erase) pl.on("click", (e) => { L.DomEvent.stopPropagation(e); del(m.id, "mark"); });
      } else {
        const el = m.t === "text" ? textEl("ac-txt", m.text) : dom(symbolSvg(m.kind, m.color), "ac-pt", m.text || undefined);
        if (m.t === "text") el.style.color = m.color;
        const mk = L.marker(toLL(L, m.x, m.y), { icon: L.divIcon({ html: el, className: "ac-wrap", iconSize: m.t === "text" ? [0, 0] : [30, 30], iconAnchor: m.t === "text" ? [0, 0] : [15, 15] }), interactive: erase, keyboard: false, zIndexOffset: 300 }).addTo(gm);
        if (erase) mk.on("click", (e) => { L.DomEvent.stopPropagation(e); del(m.id, "mark"); });
      }
    }
    for (const p of plan.patterns) {
      const geo = patternGeometry(p, aspect, scale);
      if (!geo) continue;
      L.polyline(geo.runway.map(([x, y]) => toLL(L, x, y)), { color: "#111827", weight: 2, dashArray: "2 6", interactive: false }).addTo(gp);
      for (const leg of geo.legs) {
        const line = L.polyline(leg.pts.map(([x, y]) => toLL(L, x, y)), { color: leg.name === "FINAL" ? "#16a34a" : "#2563eb", weight: 4, opacity: 0.9, interactive: erase }).addTo(gp);
        if (erase) line.on("click", (e) => { L.DomEvent.stopPropagation(e); del(p.id, "pattern"); });
        const a = leg.pts[0], b = leg.pts[1];
        const mid = toLL(L, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        const tc = ((Math.atan2(b[0] - a[0], -(b[1] - a[1]) * aspect) * 180) / Math.PI + 360) % 360;
        const t = textEl("ac-pat", `${leg.name === "FINAL" ? "▶ " : ""}${leg.name}${leg.name === "DOWNWIND" ? ` · ${p.altAgl} ft AGL` : ""}`);
        t.style.color = leg.name === "FINAL" ? "#15803d" : "#1d4ed8"; t.title = `${Math.round(tc)}°`;
        L.marker(mid, { icon: L.divIcon({ html: t, className: "ac-wrap", iconSize: [0, 0] }), interactive: false, keyboard: false }).addTo(gp);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapVersion, plan.marks, plan.patterns, scale, planning, tool, size]);

  /* ------------------------------------------------------------ dessin : brouillons */
  useEffect(() => {
    const L = LRef.current, g = layers.current.draft;
    if (!L || !g || !size) return;
    g.clearLayers();
    const dot = (x: number, y: number) => L.marker(toLL(L, x, y), { icon: L.divIcon({ html: textEl("ac-draft", ""), className: "ac-wrap", iconSize: [12, 12], iconAnchor: [6, 6] }), interactive: false }).addTo(g);
    if (lineDraft.length) { L.polyline(lineDraft.map(([x, y]) => toLL(L, x, y)), { color, weight: 3, dashArray: "6 5", interactive: false }).addTo(g); lineDraft.forEach(([x, y]) => dot(x, y)); }
    if (patDraft) dot(patDraft[0], patDraft[1]);
    if (calib) { calib.pts.forEach(([x, y]) => dot(x, y)); if (calib.pts.length === 2) L.polyline(calib.pts.map(([x, y]) => toLL(L, x, y)), { color: "#dc2626", weight: 2, dashArray: "4 4", interactive: false }).addTo(g); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapVersion, lineDraft, patDraft, calib, color, size]);

  useEffect(() => { containerRef.current?.classList.toggle("is-tool", tool !== "pan"); }, [tool, mapVersion]);

  /* ------------------------------------------------------------ opérations */
  const pick = (t: Tool) => { setLineDraft([]); setPatDraft(null); setCalib(null); setPointForm(null); setTool(t); setMsg(null); };
  const finishLine = () => { if (lineDraft.length >= 2) commit({ ...plan, marks: [...plan.marks, { id: uid(), t: "line", color, pts: lineDraft } as Mark].slice(0, 150) }); setLineDraft([]); };
  const startPlanning = () => { setPlanning(true); pick("route"); };
  const done = (ok: boolean, text: string) => setMsg({ ok, text });

  const save = () => start(async () => {
    const r = await savePlanAction(chart.key, planId, title, plan);
    if (!r.ok) return done(false, r.error);
    done(true, r.message);
    const id = r.id ?? planId;
    setPlanId(id);
    const rec: PlanRecord = { id: id!, chartKey: chart.key, title: title.trim(), data: plan, pilotId: null, authorId: meId, authorName: "Moi", updatedAt: new Date().toISOString() };
    setPlans((l) => [rec, ...l.filter((p) => p.id !== id)]);
    router.refresh();
  });
  const load = (p: PlanRecord) => { setPlan(p.data); setPast([]); setPlanId(p.id); setTitle(p.title); setPlanning(true); pick("pan"); setPlanning(true); done(true, `« ${p.title} » chargée.`); };
  const reset = () => { setPlan(emptyPlan()); setPast([]); setPlanId(null); setTitle(""); setMsg(null); };
  const remove = () => start(async () => {
    if (!planId || !window.confirm("Supprimer cette préparation ?")) return;
    const r = await deletePlanAction(chart.key, planId);
    if (!r.ok) return done(false, r.error);
    setPlans((l) => l.filter((p) => p.id !== planId)); reset(); done(true, r.message);
  });
  const makeFlightPlan = () => start(async () => {
    if (plan.route.length < 2) return done(false, "Trace au moins deux points de route.");
    let id = planId;
    if (!id) {
      const r = await savePlanAction(chart.key, null, title || `Préparation ${chart.ident}`, plan);
      if (!r.ok) return done(false, r.error);
      id = r.id ?? null; setPlanId(id); if (!title) setTitle(`Préparation ${chart.ident}`);
    } else {
      const r = await savePlanAction(chart.key, id, title, plan);
      if (!r.ok) return done(false, r.error);
    }
    const total = legs.reduce((s, l) => s + (l.minutes ?? 0), 0);
    const r = await planToFlightPlanAction(chart.key, id!, {
      dep: plan.route[0].name, dest: plan.route[plan.route.length - 1].name, route: plan.route.map((p) => p.name).join(" → "),
      eet: total > 0 ? `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(Math.round(total % 60) % 60).padStart(2, "0")}` : "", speed: plan.tas, title: title || `Préparation ${chart.ident}`,
    });
    if (!r.ok) return done(false, r.error);
    router.push(`/airops/forms/${r.id}`);
  });
  const savePoint = () => start(async () => {
    if (!pointForm) return;
    const f = pointForm;
    const r = await savePointAction(chart.key, f.id, { kind: f.kind, ident: f.ident, name: f.name, freq: f.freq, elevation: f.elevation === "" ? null : Number(f.elevation), note: f.note, x: f.x, y: f.y });
    if (!r.ok) return done(false, r.error);
    const p: ChartPoint = { id: r.id!, chartKey: chart.key, kind: f.kind, ident: f.ident.trim().toUpperCase(), name: f.name.trim(), x: f.x, y: f.y, freq: f.freq.trim(), elevation: f.elevation === "" ? null : Math.round(Number(f.elevation)), note: f.note.trim() };
    setPoints((l) => [...l.filter((q) => q.id !== p.id), p]); setPointForm(null); done(true, r.message);
  });
  const removePoint = () => start(async () => {
    if (!pointForm?.id || !window.confirm("Supprimer ce point de la carte ?")) return;
    const r = await deletePointAction(chart.key, pointForm.id);
    if (!r.ok) return done(false, r.error);
    setPoints((l) => l.filter((q) => q.id !== pointForm.id)); setPointForm(null); done(true, r.message);
  });
  const saveCalib = () => start(async () => {
    if (!calib || calib.pts.length !== 2) return;
    const d = Number(calib.dist.replace(",", "."));
    const nm = unit === "ft" ? feetToNm(d) : d;
    const s = calibrate(calib.pts[0], calib.pts[1], aspect, nm);
    if (!s) return done(false, "Distance invalide : place deux points distincts et indique leur distance réelle.");
    const r = await saveCalibrationAction(chart.key, s);
    if (!r.ok) return done(false, r.error);
    setScale(s); setCalib(null); pick("pan"); done(true, r.message);
  });

  const total = legs.reduce((s, l) => ({ nm: s.nm + l.nm, min: s.min + (l.minutes ?? 0) }), { nm: 0, min: 0 });
  const sel = points.find((p) => p.id === selected) ?? null;
  const needle = filter.trim().toLowerCase();
  const shown = points.filter((p) => !needle || `${p.ident} ${p.name}`.toLowerCase().includes(needle));
  const toolBtn = (t: Tool, text: string, id: string) => (
    <button key={id} type="button" aria-pressed={tool === t} data-testid={`tool-${id}`} onClick={() => pick(t)} className={`${btn} ${tool === t ? "bg-[#0d2644] text-white border-[#0d2644]" : "bg-white border-slate-300 text-slate-700"}`}>{text}</button>
  );

  if (missing) return (
    <div className="border border-amber-300 bg-amber-50 rounded p-5 text-[13px] text-amber-900" data-testid="chart-missing">
      <p className="font-bold">Image de la carte introuvable</p>
      <p>Dépose le fichier dans <code className="bg-white px-1 rounded">public{chart.image}</code> puis recharge la page.</p>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]" data-testid="chart-workspace">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-[16px] font-bold text-slate-800 mr-auto">{chart.ident} · {chart.title} <span className="text-[11px] font-normal uppercase tracking-wide text-slate-500">{KIND_LABEL[chart.kind]}</span></h2>
          {!planning ? (
            <button type="button" onClick={startPlanning} data-testid="plan-start" className="min-h-10 px-4 rounded bg-[#c00d0d] text-white text-[13px] font-bold">✈ Préparer un vol</button>
          ) : (
            <button type="button" onClick={() => { setPlanning(false); pick("pan"); }} data-testid="plan-stop" className={`${btn} bg-white border-slate-300`}>Quitter la préparation</button>
          )}
        </div>
        {planning && (
          <div className="flex flex-wrap gap-1.5 mb-2 p-2 border border-slate-200 rounded bg-slate-50" role="toolbar" aria-label="Outils de préparation">
            {toolBtn("pan", "✋ Déplacer", "pan")}{toolBtn("route", "⟶ Route", "route")}{toolBtn("pattern", "⟲ Circuit", "pattern")}{toolBtn("line", "✎ Tracé", "line")}{toolBtn("text", "T Texte", "text")}{toolBtn("erase", "⌫ Effacer", "erase")}
            <button type="button" onClick={undo} disabled={!past.length} data-testid="plan-undo" className={`${btn} bg-white border-slate-300 disabled:opacity-40`}>↶ Annuler</button>
            <div className="w-full flex flex-wrap gap-1 items-center">
              {POINT_KINDS.map((k) => (
                <button key={k.key} type="button" title={k.label} aria-label={`Symbole : ${k.label}`} aria-pressed={tool === `sym:${k.key}`} data-testid={`tool-sym-${k.key}`} onClick={() => pick(`sym:${k.key}` as Tool)}
                  className={`h-9 w-9 grid place-items-center rounded border ${tool === `sym:${k.key}` ? "bg-[#0d2644] border-[#0d2644]" : "bg-white border-slate-300"}`}>
                  <span className="scale-75" dangerouslySetInnerHTML={{ __html: symbolSvg(k.key, tool === `sym:${k.key}` ? "#fff" : k.color) }} />
                </button>
              ))}
              <span className="ml-2 flex gap-1" role="group" aria-label="Couleur">{MARK_COLORS.map((c) => <button key={c} type="button" aria-label={`Couleur ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} style={{ background: c }} className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-slate-900" : "border-white"} shadow`} />)}</span>
            </div>
            {(tool === "text" || tool.startsWith("sym:")) && <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder={tool === "text" ? "Texte à poser (puis clic sur la carte)" : "Étiquette (facultative)"} data-testid="tool-label" className={`${inp} flex-1 min-w-48`} />}
            {tool === "line" && <button type="button" onClick={finishLine} disabled={lineDraft.length < 2} data-testid="line-finish" className={`${btn} bg-emerald-700 text-white border-emerald-700 disabled:opacity-40`}>Terminer le tracé ({lineDraft.length} pts)</button>}
            {tool === "pattern" && (
              <div className="w-full flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="font-semibold">Clic 1 : seuil d&apos;atterrissage · clic 2 : bout de piste.</span>
                <select value={patSide} onChange={(e) => setPatSide(e.target.value as "L" | "R")} aria-label="Main du circuit" data-testid="pat-side" className="border border-slate-300 rounded px-2 py-1.5 bg-white"><option value="L">Circuit à gauche</option><option value="R">Circuit à droite</option></select>
                <label className="flex items-center gap-1">Hauteur <input type="number" min={0} max={10000} step={100} value={patAlt} onChange={(e) => setPatAlt(Number(e.target.value) || 0)} data-testid="pat-alt" className="w-20 border border-slate-300 rounded px-2 py-1.5" /> ft AGL</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={patHeli} onChange={(e) => setPatHeli(e.target.checked)} className="w-4 h-4" />Hélicoptère (circuit serré)</label>
                {patDraft && <span className="text-[#c00d0d] font-bold">Seuil posé : clique le bout de piste.</span>}
              </div>
            )}
          </div>
        )}
        {isCmd && !planning && (
          <div className="flex flex-wrap gap-1.5 mb-2" role="toolbar" aria-label="Outils du commandement">
            {toolBtn("pan", "✋ Consulter", "view")}{toolBtn("pt-edit", "＋ Points de carte", "pt-edit")}{toolBtn("calibrate", "📏 Calibrer l'échelle", "calibrate")}
          </div>
        )}
        <div className="relative border border-slate-300 bg-slate-200 h-[68vh] min-h-[420px]">
          {!size && <p className="absolute inset-0 grid place-items-center text-[13px] text-slate-500">Chargement de la carte…</p>}
          <div ref={containerRef} className="ac-map absolute inset-0" data-testid="chart-map" />
        </div>
        <p className="mt-1 text-[11.5px] text-slate-500" data-testid="scale-note">
          {scale ? `Échelle : ${scale.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} NM sur la largeur de la carte.` : "Échelle non calibrée : distances et temps indisponibles (le commandement peut calibrer la carte)."} Nord en haut · variation magnétique {plan.magVar}° E.
        </p>
      </div>

      <aside className="space-y-3 min-w-0">
        {msg && <p role="status" data-testid="chart-msg" className={`text-[13px] px-3 py-2 rounded border ${msg.ok ? "text-emerald-800 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"}`}>{msg.text}</p>}

        {calib && isCmd && tool === "calibrate" && (
          <div className="border border-slate-300 rounded bg-white p-3 space-y-2" data-testid="calib-panel">
            <p className="text-[12.5px] font-bold">Calibrer l&apos;échelle ({calib.pts.length}/2 points)</p>
            <p className="text-[12px] text-slate-600">Clique deux points dont tu connais la distance réelle (ex. extrémités d&apos;une piste, ou deux graduations de la règle).</p>
            {calib.pts.length === 2 && (<>
              <label className="block"><span className={lab}>Distance réelle ({unit === "ft" ? "pieds" : "milles nautiques"})</span><input value={calib.dist} onChange={(e) => setCalib({ ...calib, dist: e.target.value })} inputMode="decimal" data-testid="calib-dist" className={inp} /></label>
              <button type="button" onClick={saveCalib} disabled={pending} data-testid="calib-save" className={`${btn} bg-[#0d2644] text-white border-[#0d2644]`}>Enregistrer l&apos;échelle</button>
            </>)}
          </div>
        )}
        {isCmd && tool === "calibrate" && !calib && <p className="text-[12.5px] border border-slate-200 rounded bg-white p-3">Clique le premier point de référence sur la carte.</p>}

        {pointForm && isCmd && (
          <div className="border-2 border-[#0d2644] rounded bg-white p-3 space-y-2" data-testid="point-form">
            <p className="text-[12.5px] font-bold">{pointForm.id ? "Modifier le point" : "Nouveau point"}</p>
            <label className="block"><span className={lab}>Type</span><select value={pointForm.kind} onChange={(e) => setPointForm({ ...pointForm, kind: e.target.value as PointKind })} data-testid="pf-kind" className={inp}>{POINT_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}</select></label>
            <div className="grid grid-cols-3 gap-2">
              <label className="col-span-1"><span className={lab}>Ident.</span><input value={pointForm.ident} maxLength={12} onChange={(e) => setPointForm({ ...pointForm, ident: e.target.value })} data-testid="pf-ident" className={`${inp} uppercase`} /></label>
              <label className="col-span-2"><span className={lab}>Nom *</span><input value={pointForm.name} maxLength={60} onChange={(e) => setPointForm({ ...pointForm, name: e.target.value })} data-testid="pf-name" className={inp} /></label>
              <label className="col-span-2"><span className={lab}>Fréquence</span><input value={pointForm.freq} maxLength={60} onChange={(e) => setPointForm({ ...pointForm, freq: e.target.value })} placeholder="ex. TWR 120.95" className={inp} /></label>
              <label className="col-span-1"><span className={lab}>Alt. (ft)</span><input value={pointForm.elevation} inputMode="numeric" onChange={(e) => setPointForm({ ...pointForm, elevation: e.target.value })} className={inp} /></label>
            </div>
            <label className="block"><span className={lab}>Note</span><textarea rows={2} value={pointForm.note} maxLength={300} onChange={(e) => setPointForm({ ...pointForm, note: e.target.value })} className={inp} /></label>
            <div className="flex gap-2">
              <button type="button" onClick={savePoint} disabled={pending} data-testid="pf-save" className={`${btn} bg-[#0d2644] text-white border-[#0d2644]`}>Enregistrer</button>
              <button type="button" onClick={() => setPointForm(null)} className={`${btn} bg-white border-slate-300`}>Annuler</button>
              {pointForm.id && <button type="button" onClick={removePoint} disabled={pending} className={`${btn} bg-white border-red-300 text-red-700 ml-auto`}>Supprimer</button>}
            </div>
          </div>
        )}

        {sel && !pointForm && (
          <div className="border border-slate-300 rounded bg-white p-3" data-testid="point-info">
            <p className="flex items-center gap-2"><span className="inline-block" dangerouslySetInnerHTML={{ __html: symbolSvg(sel.kind, pointKind(sel.kind).color) }} /><span className="font-bold text-[14px]">{sel.ident && <span className="font-mono mr-1">{sel.ident}</span>}{sel.name}</span></p>
            <p className="text-[12px] text-slate-500">{pointKind(sel.kind).label}{sel.elevation !== null ? ` · ${sel.elevation.toLocaleString("fr-FR")} ft` : ""}</p>
            {sel.freq && <p className="text-[12.5px] font-mono mt-1">{sel.freq}</p>}
            {sel.note && <p className="text-[12.5px] text-slate-700 mt-1 whitespace-pre-wrap">{sel.note}</p>}
            <button type="button" onClick={() => setSelected(null)} className="mt-2 text-[12px] underline text-slate-500">Fermer</button>
          </div>
        )}

        {planning ? (
          <>
            <div className="border border-slate-300 rounded bg-white p-3 space-y-2" data-testid="plan-panel">
              <h3 className="text-[12px] font-bold uppercase text-slate-700">Préparation du vol</h3>
              <label className="block"><span className={lab}>Nom de la préparation</span><input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="ex. LSX → Sandy Shores, largage" data-testid="plan-title" className={inp} /></label>
              <div className="grid grid-cols-4 gap-2">
                <label><span className={lab}>TAS (kt)</span><input type="number" min={1} max={400} value={plan.tas} onChange={(e) => setPlan({ ...plan, tas: Number(e.target.value) || 0 })} data-testid="plan-tas" className={inp} /></label>
                <label><span className={lab}>Vent °</span><input type="number" min={0} max={360} value={plan.windDir ?? ""} placeholder="—" onChange={(e) => setPlan({ ...plan, windDir: e.target.value === "" ? null : Number(e.target.value) })} data-testid="plan-wdir" className={inp} /></label>
                <label><span className={lab}>Vent kt</span><input type="number" min={0} max={200} value={plan.windSpd} onChange={(e) => setPlan({ ...plan, windSpd: Number(e.target.value) || 0 })} data-testid="plan-wspd" className={inp} /></label>
                <label><span className={lab}>Var. E°</span><input type="number" min={-45} max={45} value={plan.magVar} onChange={(e) => setPlan({ ...plan, magVar: Number(e.target.value) || 0 })} className={inp} /></label>
              </div>
              <p className="text-[11px] text-slate-500">Vent : direction d&apos;où il souffle (vraie). Cap magnétique = route vraie − variation Est.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={save} disabled={pending} data-testid="plan-save" className={`${btn} bg-[#0d2644] text-white border-[#0d2644]`}>{planId ? "Mettre à jour" : "Enregistrer"}</button>
                <button type="button" onClick={reset} className={`${btn} bg-white border-slate-300`}>Nouvelle</button>
                {planId && <button type="button" onClick={remove} disabled={pending} className={`${btn} bg-white border-red-300 text-red-700`}>Supprimer</button>}
                <button type="button" onClick={makeFlightPlan} disabled={pending} data-testid="plan-to-form" className={`${btn} bg-white border-emerald-700 text-emerald-800 w-full`}>Créer le plan de vol (formulaire) →</button>
              </div>
            </div>

            <div className="border border-slate-300 rounded bg-white p-3" data-testid="legs-panel">
              <h3 className="text-[12px] font-bold uppercase text-slate-700 mb-1">Route ({plan.route.length} point{plan.route.length > 1 ? "s" : ""})</h3>
              {plan.route.length < 2 ? <p className="text-[12.5px] text-slate-500">Outil « Route » : clique la carte (ou un point existant) pour poser les points de passage.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] font-mono whitespace-nowrap" data-testid="legs-table">
                    <thead className="text-[10px] uppercase text-slate-500"><tr><th className="text-left">Étape</th><th>RV</th><th>RM</th><th>CM</th><th>Dist.</th><th>GS</th><th>ETE</th></tr></thead>
                    <tbody>{legs.map((l, i) => (
                      <tr key={i} data-testid="leg-row" className="border-t border-slate-100">
                        <td className="text-left font-sans pr-2">{l.from} → {l.to}</td><td className="text-right">{fmtDeg(l.tc)}</td><td className="text-right">{fmtDeg(l.mc)}</td><td className="text-right">{l.mh === null ? "—" : fmtDeg(l.mh)}</td>
                        <td className="text-right pl-2">{scale ? fmtNm(l.nm, unit) : "—"}</td><td className="text-right pl-2">{Math.round(l.gs)}</td><td className="text-right pl-2">{scale ? fmtMin(l.minutes) : "—"}</td>
                      </tr>))}</tbody>
                    <tfoot><tr className="border-t-2 border-slate-800 font-bold"><td className="text-left font-sans">Total</td><td colSpan={3} /><td className="text-right pl-2" data-testid="legs-total-dist">{scale ? fmtNm(total.nm, unit) : "—"}</td><td /><td className="text-right pl-2" data-testid="legs-total-time">{scale ? fmtMin(total.min) : "—"}</td></tr></tfoot>
                  </table>
                  <p className="text-[10.5px] text-slate-500 mt-1">RV : route vraie · RM : route magnétique · CM : cap magnétique à tenir (avec vent) · GS : vitesse sol (kt).</p>
                </div>
              )}
            </div>

            {plan.patterns.length > 0 && (
              <div className="border border-slate-300 rounded bg-white p-3" data-testid="patterns-panel">
                <h3 className="text-[12px] font-bold uppercase text-slate-700 mb-1">Circuits d&apos;atterrissage</h3>
                <ul className="space-y-1">{plan.patterns.map((p) => {
                  const g = patternGeometry(p, aspect, scale);
                  const tc = (Math.atan2(p.end[0] - p.start[0], -(p.end[1] - p.start[1]) * aspect) * 180) / Math.PI;
                  const mc = (((tc - plan.magVar) % 360) + 360) % 360;
                  const rwy = String(Math.round(mc / 10) % 36 || 36).padStart(2, "0");
                  return (
                    <li key={p.id} className="flex items-center gap-2 text-[12.5px]" data-testid="pattern-row">
                      <span className="font-mono font-bold border border-slate-700 px-1">RWY {rwy}</span>
                      <span>main {p.side === "L" ? "gauche" : "droite"} · {p.altAgl} ft AGL · {p.heli ? "hélico" : "avion"}{g?.lengthNm ? ` · piste ${fmtNm(g.lengthNm, "ft")}` : ""}</span>
                      <button type="button" aria-label="Supprimer ce circuit" onClick={() => commit({ ...plan, patterns: plan.patterns.filter((x: Pattern) => x.id !== p.id) })} className="ml-auto text-red-700 text-[12px] underline">Suppr.</button>
                    </li>
                  );
                })}</ul>
              </div>
            )}

            <div className="border border-slate-300 rounded bg-white p-3" data-testid="plans-list">
              <h3 className="text-[12px] font-bold uppercase text-slate-700 mb-1">Préparations enregistrées</h3>
              {plans.length === 0 ? <p className="text-[12.5px] text-slate-500">Aucune pour cette carte.</p> : (
                <ul className="divide-y divide-slate-100 max-h-56 overflow-auto">{plans.map((p) => (
                  <li key={p.id}><button type="button" onClick={() => load(p)} data-testid="plan-load" className="w-full text-left py-1.5 text-[12.5px] hover:bg-slate-50"><span className="font-semibold">{p.title}</span><span className="block text-[11px] text-slate-500">{p.authorName} · {new Date(p.updatedAt).toLocaleDateString("fr-FR")}</span></button></li>
                ))}</ul>
              )}
            </div>
          </>
        ) : (
          <div className="border border-slate-300 rounded bg-white p-3" data-testid="points-panel">
            <h3 className="text-[12px] font-bold uppercase text-slate-700 mb-1">Points de la carte ({points.length})</h3>
            <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Rechercher un point…" aria-label="Rechercher un point" className={`${inp} mb-2`} />
            {shown.length === 0 ? <p className="text-[12.5px] text-slate-500">{points.length ? "Aucun résultat." : isCmd ? "Aucun point : outil « Points de carte », puis clic sur la carte." : "Aucun point n'est encore placé sur cette carte."}</p> : (
              <ul className="divide-y divide-slate-100 max-h-72 overflow-auto">{shown.map((p) => (
                <li key={p.id}><button type="button" onClick={() => { setSelected(p.id); const m = mapRef.current, L = LRef.current; if (m && L && size) m.setView(toLL(L, p.x, p.y), Math.max(m.getZoom(), m.getMinZoom() + 1.5)); }} data-testid="point-row" className="w-full text-left py-1.5 flex items-center gap-2 text-[12.5px] hover:bg-slate-50">
                  <span style={{ color: pointKind(p.kind).color }} className="font-mono font-bold w-14 shrink-0">{p.ident || "—"}</span><span>{p.name}</span></button></li>
              ))}</ul>
            )}
            {chart.freqs && <p className="mt-2 text-[11.5px] font-mono text-slate-600 border-t border-slate-100 pt-2">{chart.freqs.join(" · ")}</p>}
          </div>
        )}
      </aside>
    </div>
  );
}
