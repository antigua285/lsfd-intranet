"use client";

import "leaflet/dist/leaflet.css";
import "./map.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { usesAssembly, zoneGeometry } from "@/lib/map-geometry";
import {
  FEATURE_META,
  MAP_IMAGE_URL,
  ZONE_META,
  type MapFeature,
  type MapPoint,
  type MapZone,
  type ZoneKind,
} from "@/lib/map-types";
import {
  Z_OFFSET,
  buildFeaturePopup,
  buildMarkerIcon,
  buildVertexIcon,
  buildZonePopup,
  featureSignature,
  insideImage,
  textNode,
  toFraction,
  toLatLng,
  zoneSignature,
  type Size,
} from "./leaflet-helpers";
import {
  FeatureForm,
  FiltersCard,
  ToolsCard,
  WeatherCard,
  ZoneForm,
  kindKey,
  zoneKindKey,
  type HiddenSet,
  type Tool,
} from "./panels";
import { useWeather } from "./useWeather";
import {
  createFeatureAction,
  createZoneAction,
  deleteFeatureAction,
  deleteZoneAction,
  moveFeatureAction,
  updateFeatureAction,
  updateZoneAction,
} from "./actions";

type Selection = { type: "feature" | "zone"; id: string } | null;

type Props = {
  initialFeatures: MapFeature[];
  initialZones: MapZone[];
  /** true = page "EDIT MAP" (réservée aux modérateurs). */
  editing: boolean;
};

/** Zoom de départ au-dessus du dézoom maximum (0 = image entière visible, plus grand = plus près). */
const START_ZOOM_ABOVE_MIN = 0.5;

const FILTER_STORAGE_KEY = "lsfd-map-hidden-v1";

export function MapView({ initialFeatures, initialZones, editing }: Props) {
  const [features, setFeatures] = useState(initialFeatures);
  const [zones, setZones] = useState(initialZones);
  const [selected, setSelected] = useState<Selection>(null);
  const [tool, setTool] = useState<Tool>(null);
  const [draft, setDraft] = useState<MapPoint[]>([]);
  const [hidden, setHidden] = useState<HiddenSet>(new Set());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [size, setSize] = useState<Size | null>(null);
  const [missingImage, setMissingImage] = useState(false);
  const [mapVersion, setMapVersion] = useState(0);
  const weather = useWeather();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const featureLayers = useRef(new Map<string, { marker: Leaflet.Marker; sig: string }>());
  const zoneLayers = useRef(new Map<string, { polygon: Leaflet.Polygon; sig: string }>());

  // Les fonctions appelées par les couches Leaflet doivent toujours voir les données
  // les plus récentes : on les range dans une référence mise à jour à chaque rendu.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  });

  const latest = useRef({
    features,
    zones,
    weather,
    tool,
    actions: {} as Actions,
  });
  useEffect(() => {
    latest.current = { features, zones, weather, tool, actions: latest.current.actions };
  });

  /* ------------------------------------------------------- filtres mémorisés */
  useEffect(() => {
    // Lu après l'affichage (pas pendant) pour que le rendu serveur et le premier rendu
    // du navigateur soient identiques.
    queueMicrotask(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) ?? "[]");
        if (Array.isArray(stored)) setHidden(new Set(stored.filter((s) => typeof s === "string")));
      } catch {
        /* navigation privée, stockage bloqué : on garde les valeurs par défaut */
      }
    });
  }, []);

  function toggleHidden(key: string) {
    setHidden((previous) => {
      const next = new Set(previous);
      if (!next.delete(key)) next.add(key);
      try {
        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignoré */
      }
      return next;
    });
  }

  /* ----------------------------------------------------------- image de fond */
  useEffect(() => {
    const img = new Image();
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setMissingImage(true);
    img.src = MAP_IMAGE_URL;
  }, []);

  /* ------------------------------------------------------ création de la carte */
  useEffect(() => {
    if (!size || !containerRef.current) return;
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const featureMap = featureLayers.current;
    const zoneMap = zoneLayers.current;

    (async () => {
      const mod = await import("leaflet");
      const L = ((mod as unknown as { default?: typeof Leaflet }).default ?? mod) as typeof Leaflet;
      if (cancelled || !containerRef.current) return;

      const bounds = L.latLngBounds([0, 0], [size.h, size.w]);
      map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -5,
        maxZoom: 3,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 120,
        attributionControl: false,
        doubleClickZoom: false,
        // Sans focus clavier : un clic sur la carte ne fait pas défiler la page.
        keyboard: false,
        // La carte ne peut pas sortir de l'image.
        maxBounds: bounds,
        maxBoundsViscosity: 1,
      });
      L.imageOverlay(MAP_IMAGE_URL, bounds).addTo(map);

      // Dézoom maximum = l'image remplit tout le cadre (jamais de vide autour).
      const fitLimits = (m: Leaflet.Map) => {
        m.setMinZoom(m.getBoundsZoom(bounds, true));
      };
      fitLimits(map);

      // Vue de départ : en bas de la carte (la ville), centrée horizontalement.
      const startZoom = Math.min(map.getMaxZoom(), map.getMinZoom() + START_ZOOM_ABOVE_MIN);
      const startHeight = map.getSize().y / Math.pow(2, startZoom);
      map.setView([startHeight / 2, size.w / 2], startZoom, { animate: false });

      // Si la fenêtre change de taille, on recalcule la limite de dézoom.
      const observer = new ResizeObserver(() => {
        if (!map) return;
        map.invalidateSize();
        fitLimits(map);
      });
      observer.observe(containerRef.current);
      resizeObserver = observer;

      map.on("click", (e: Leaflet.LeafletMouseEvent) => latest.current.actions.mapClick(e.latlng));

      LRef.current = L;
      mapRef.current = map;
      setMapVersion((v) => v + 1);
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      map?.remove();
      mapRef.current = null;
      featureMap.clear();
      zoneMap.clear();
    };
  }, [size]);

  /* ------------------------------------------------------------ points sur la carte */
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !size) return;
    const layers = featureLayers.current;
    const alive = new Set<string>();

    for (const f of features) {
      alive.add(f.id);
      const isSelected = selected?.type === "feature" && selected.id === f.id;
      const sig = featureSignature(f, isSelected);
      const latlng = toLatLng(L, size, [f.x, f.y]);
      let entry = layers.get(f.id);

      if (!entry) {
        const marker = L.marker(latlng, {
          icon: buildMarkerIcon(L, f, isSelected),
          draggable: editing,
          keyboard: false,
          zIndexOffset: Z_OFFSET[f.kind] + (isSelected ? 1000 : 0),
        });
        marker.bindTooltip(textNode(f.name), { direction: "top", offset: [0, -14] });
        if (!editing) {
          marker.bindPopup(
            () => {
              const current = latest.current.features.find((x) => x.id === f.id);
              return buildFeaturePopup(current ?? f, latest.current.weather);
            },
            { maxWidth: 300 }
          );
        }
        marker.on("click", () => latest.current.actions.clickFeature(f.id));
        if (editing) {
          marker.on("dragend", () => {
            const [x, y] = toFraction(size, marker.getLatLng());
            latest.current.actions.dragFeature(f.id, x, y);
          });
        }
        entry = { marker, sig };
        layers.set(f.id, entry);
      } else if (entry.sig !== sig) {
        entry.marker.setLatLng(latlng);
        entry.marker.setIcon(buildMarkerIcon(L, f, isSelected));
        entry.marker.setZIndexOffset(Z_OFFSET[f.kind] + (isSelected ? 1000 : 0));
        entry.marker.setTooltipContent(textNode(f.name));
        entry.sig = sig;
      }

      const visible = !hidden.has(kindKey(f.kind)) && !hidden.has(f.id);
      if (visible && !map.hasLayer(entry.marker)) entry.marker.addTo(map);
      if (!visible && map.hasLayer(entry.marker)) entry.marker.remove();
    }

    for (const [id, entry] of layers) {
      if (!alive.has(id)) {
        entry.marker.remove();
        layers.delete(id);
      }
    }
  }, [mapVersion, features, hidden, selected, editing, size]);

  /* ------------------------------------------------------------------- zones */
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !size) return;
    const layers = zoneLayers.current;
    const alive = new Set<string>();

    for (const z of zones) {
      alive.add(z.id);
      const isSelected = selected?.type === "zone" && selected.id === z.id;
      // Forme à afficher : tracé propre, ou union des bataillons pour un bureau assemblé.
      const geometry = zoneGeometry(z, zones);
      if (geometry.length === 0) {
        const stale = layers.get(z.id);
        if (stale) {
          stale.polygon.remove();
          layers.delete(z.id);
        }
        continue;
      }
      const sig = zoneSignature(z, isSelected, geometry);
      const latlngs = geometry.map((poly) => poly.map((ring) => ring.map((p) => toLatLng(L, size, p))));
      const style: Leaflet.PathOptions = {
        color: z.color,
        fillColor: z.color,
        weight: isSelected ? 4 : 2,
        fillOpacity: z.kind === "bureau" ? 0.26 : 0.14,
        dashArray: z.kind === "bureau" ? "7 5" : undefined,
      };
      let entry = layers.get(z.id);

      if (!entry) {
        const polygon = L.polygon(latlngs, { ...style, bubblingMouseEvents: false });
        polygon.bindTooltip(textNode(z.name), {
          permanent: true,
          direction: "center",
          className: "zone-label",
        });
        if (!editing) {
          polygon.bindPopup(
            () => {
              const current = latest.current.zones.find((x) => x.id === z.id);
              return buildZonePopup(current ?? z, latest.current.zones);
            },
            { maxWidth: 260 }
          );
        }
        polygon.on("click", (e: Leaflet.LeafletMouseEvent) => {
          // Avec un outil actif, un clic sur une zone sert à poser un point, pas à la sélectionner.
          if (latest.current.tool) latest.current.actions.mapClick(e.latlng);
          else latest.current.actions.clickZone(z.id);
        });
        entry = { polygon, sig };
        layers.set(z.id, entry);
      } else if (entry.sig !== sig) {
        entry.polygon.setLatLngs(latlngs);
        entry.polygon.setStyle(style);
        entry.polygon.setTooltipContent(textNode(z.name));
        entry.sig = sig;
      }

      const visible = !hidden.has(zoneKindKey(z.kind)) && !hidden.has(z.id);
      if (visible && !map.hasLayer(entry.polygon)) {
        entry.polygon.addTo(map);
        if (z.kind === "battalion") entry.polygon.bringToBack();
      }
      if (!visible && map.hasLayer(entry.polygon)) entry.polygon.remove();
    }

    for (const [id, entry] of layers) {
      if (!alive.has(id)) {
        entry.polygon.remove();
        layers.delete(id);
      }
    }

    // Un bureau assemblé recouvre ses bataillons : on le passe derrière eux pour que
    // les bataillons restent cliquables (le bureau se choisit depuis la liste des filtres).
    for (const z of zones) {
      const entry = layers.get(z.id);
      if (entry && map.hasLayer(entry.polygon) && usesAssembly(z, zones)) entry.polygon.bringToBack();
    }
  }, [mapVersion, zones, hidden, selected, editing, size]);

  /* ----------------------------------- poignées de la zone sélectionnée (édition) */
  const selectedZoneRaw =
    editing && !tool && selected?.type === "zone"
      ? (zones.find((z) => z.id === selected.id) ?? null)
      : null;
  // Pas de poignées pour un bureau assemblé : sa forme vient de ses bataillons.
  const selectedZone =
    selectedZoneRaw && selectedZoneRaw.points.length >= 3 && !usesAssembly(selectedZoneRaw, zones)
      ? selectedZoneRaw
      : null;

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !size || !selectedZone) return;

    const zoneId = selectedZone.id;
    const current: MapPoint[] = selectedZone.points.map((p) => [p[0], p[1]]);
    const group = L.layerGroup().addTo(map);

    const livePolygon = () => zoneLayers.current.get(zoneId)?.polygon;
    const redraw = (pts: MapPoint[]) => livePolygon()?.setLatLngs(pts.map((p) => toLatLng(L, size, p)));
    const commit = (pts: MapPoint[]) => latest.current.actions.saveZoneShape(zoneId, pts);

    current.forEach((point, index) => {
      const handle = L.marker(toLatLng(L, size, point), {
        icon: buildVertexIcon(L, "vertex"),
        draggable: true,
        keyboard: false,
        zIndexOffset: 3000,
      }).addTo(group);
      handle.on("drag", () => {
        current[index] = toFraction(size, handle.getLatLng());
        redraw(current);
      });
      handle.on("dragend", () => commit(current.map((p) => [p[0], p[1]] as MapPoint)));
      handle.on("contextmenu", () => {
        if (current.length <= 3) return;
        commit(current.filter((_, i) => i !== index));
      });

      const next = current[(index + 1) % current.length];
      const middle: MapPoint = [(point[0] + next[0]) / 2, (point[1] + next[1]) / 2];
      L.marker(toLatLng(L, size, middle), {
        icon: buildVertexIcon(L, "mid"),
        keyboard: false,
        zIndexOffset: 2500,
      })
        .on("click", () => {
          const inserted = [...current];
          inserted.splice(index + 1, 0, middle);
          commit(inserted);
        })
        .addTo(group);
    });

    return () => {
      group.remove();
    };
  }, [mapVersion, selectedZone, size]);

  /* ------------------------------------------------- aperçu de la zone en cours */
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !size || tool?.type !== "zone" || draft.length === 0) return;
    const group = L.layerGroup().addTo(map);
    const latlngs = draft.map((p) => toLatLng(L, size, p));
    L.polyline([...latlngs, latlngs[0]], { color: "#f6b26b", weight: 3, dashArray: "5 5", interactive: false }).addTo(group);
    for (const ll of latlngs) {
      L.marker(ll, { icon: buildVertexIcon(L, "draft"), interactive: false, keyboard: false }).addTo(group);
    }
    return () => {
      group.remove();
    };
  }, [mapVersion, draft, tool, size]);

  /* --------------------------------------------------------- curseur et clavier */
  useEffect(() => {
    containerRef.current?.classList.toggle("is-tool", tool !== null);
  }, [tool, mapVersion]);

  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (e.key === "Escape") {
        if (draft.length > 0) setDraft([]);
        else if (latest.current.tool) setTool(null);
        else setSelected(null);
      } else if (e.key === "Enter" && !typing && latest.current.tool?.type === "zone") {
        latest.current.actions.finishDraft();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, draft.length]);

  /* ------------------------------------------------------------------ actions */
  type Actions = {
    mapClick: (latlng: Leaflet.LatLng) => void;
    clickFeature: (id: string) => void;
    clickZone: (id: string) => void;
    dragFeature: (id: string, x: number, y: number) => void;
    saveZoneShape: (id: string, points: MapPoint[]) => void;
    finishDraft: () => void;
  };

  async function run<T extends { ok: boolean }>(task: () => Promise<T>): Promise<T | null> {
    setBusy(true);
    try {
      return await task();
    } catch {
      setError("L'action a échoué (session expirée ou connexion perdue ?). Recharge la page.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function chooseTool(next: Tool) {
    setDraft([]);
    setTool(next);
    setError(null);
    setNotice(null);
    if (next) setSelected(null);
  }

  async function placePoint(kind: Extract<Tool, { type: "point" }>["kind"], x: number, y: number) {
    const res = await run(() => createFeatureAction({ kind, x, y }));
    if (!res) return;
    if (!res.ok) return setError(res.error);
    setError(null);
    setNotice(null);
    setFeatures((previous) => [...previous, res.feature]);
    setSelected({ type: "feature", id: res.feature.id });
  }

  async function finishDraft() {
    const t = latest.current.tool;
    if (!editing || t?.type !== "zone" || draftRef.current.length < 3) return;
    const res = await run(() => createZoneAction({ kind: t.kind, points: draftRef.current }));
    if (!res) return;
    if (!res.ok) return setError(res.error);
    setError(null);
    setZones((previous) => [...previous, res.zone]);
    setDraft([]);
    setTool(null);
    setSelected({ type: "zone", id: res.zone.id });
  }

  async function saveZoneShape(id: string, points: MapPoint[]) {
    const before = latest.current.zones.find((z) => z.id === id);
    setZones((previous) => previous.map((z) => (z.id === id ? { ...z, points } : z)));
    const res = await run(() => updateZoneAction(id, { points }));
    if (res && !res.ok) {
      setError(res.error);
      if (before) setZones((previous) => previous.map((z) => (z.id === id ? before : z)));
    } else if (!res && before) {
      setZones((previous) => previous.map((z) => (z.id === id ? before : z)));
    } else setError(null);
  }

  async function dragFeature(id: string, x: number, y: number) {
    const before = latest.current.features.find((f) => f.id === id);
    setFeatures((previous) => previous.map((f) => (f.id === id ? { ...f, x, y } : f)));
    const res = await run(() => moveFeatureAction(id, x, y));
    if (res?.ok) return setError(null);
    if (res && !res.ok) setError(res.error);
    if (before) setFeatures((previous) => previous.map((f) => (f.id === id ? before : f)));
  }

  function mapClick(latlng: Leaflet.LatLng) {
    if (!size || !editing) {
      return;
    }
    const t = latest.current.tool;
    if (!t) return setSelected(null);
    if (!insideImage(size, latlng)) return;
    const [x, y] = toFraction(size, latlng);
    if (t.type === "point") void placePoint(t.kind, x, y);
    else setDraft((previous) => [...previous, [x, y]]);
  }

  function clickFeature(id: string) {
    if (!editing) return; // en consultation, le clic ouvre simplement la fiche (popup)
    const t = latest.current.tool;
    if (t?.type === "point") return;
    if (t?.type === "zone") {
      const f = latest.current.features.find((x) => x.id === id);
      if (f) setDraft((previous) => [...previous, [f.x, f.y]]);
      return;
    }
    setError(null);
    setNotice(null);
    setSelected({ type: "feature", id });
  }

  function clickZone(id: string) {
    if (!editing) return;
    setError(null);
    setNotice(null);
    setSelected({ type: "zone", id });
  }

  useEffect(() => {
    latest.current.actions = { mapClick, clickFeature, clickZone, dragFeature, saveZoneShape, finishDraft };
  });

  /* --------------------------------------------------- formulaires d'édition */
  async function saveFeature(id: string, name: string, details: Record<string, string>) {
    const res = await run(() => updateFeatureAction(id, { name, details }));
    if (!res) return;
    if (!res.ok) {
      setNotice(null);
      return setError(res.error);
    }
    setError(null);
    setNotice("Enregistré.");
    setFeatures((previous) => previous.map((f) => (f.id === id ? res.feature : f)));
  }

  async function removeFeature(f: MapFeature) {
    if (!window.confirm(`Supprimer « ${f.name} » ? Cette action est définitive.`)) return;
    const res = await run(() => deleteFeatureAction(f.id));
    if (!res) return;
    if (!res.ok) return setError(res.error);
    setError(null);
    setFeatures((previous) => previous.filter((x) => x.id !== f.id));
    setSelected(null);
  }

  async function createAssembly() {
    const res = await run(() => createZoneAction({ kind: "bureau", members: [] }));
    if (!res) return;
    if (!res.ok) return setError(res.error);
    setError(null);
    setNotice(null);
    setZones((previous) => [...previous, res.zone]);
    setTool(null);
    setDraft([]);
    setSelected({ type: "zone", id: res.zone.id });
  }

  async function saveZone(
    id: string,
    fields: { name: string; kind: ZoneKind; color: string; members: string[] | null }
  ) {
    const res = await run(() => updateZoneAction(id, fields));
    if (!res) return;
    if (!res.ok) {
      setNotice(null);
      return setError(res.error);
    }
    setError(null);
    setNotice("Enregistré.");
    setZones((previous) => previous.map((z) => (z.id === id ? res.zone : z)));
  }

  async function removeZone(z: MapZone) {
    if (!window.confirm(`Supprimer la zone « ${z.name} » ? Cette action est définitive.`)) return;
    const res = await run(() => deleteZoneAction(z.id));
    if (!res) return;
    if (!res.ok) return setError(res.error);
    setError(null);
    setZones((previous) =>
      previous
        .filter((x) => x.id !== z.id)
        .map((x) => (x.members?.includes(z.id) ? { ...x, members: x.members.filter((m) => m !== z.id) } : x))
    );
    setSelected(null);
  }

  /* ------------------------------------------------ recentrer depuis la liste */
  function focusFeature(id: string) {
    const map = mapRef.current;
    const L = LRef.current;
    const f = features.find((x) => x.id === id);
    if (!map || !L || !size || !f) return;
    setHidden((previous) => {
      if (!previous.has(id)) return previous;
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
    map.setView(toLatLng(L, size, [f.x, f.y]), Math.max(map.getZoom(), map.getMinZoom() + 2), {
      animate: true,
    });
    if (editing) {
      setTool(null);
      setSelected({ type: "feature", id });
    } else {
      // laisser le temps au point de réapparaître avant d'ouvrir sa fiche
      setTimeout(() => featureLayers.current.get(id)?.marker.openPopup(), 50);
    }
  }

  function focusZone(id: string) {
    const map = mapRef.current;
    if (!map) return;
    setHidden((previous) => {
      if (!previous.has(id)) return previous;
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
    setTimeout(() => {
      const polygon = zoneLayers.current.get(id)?.polygon;
      if (!polygon) return;
      map.fitBounds(polygon.getBounds().pad(0.25));
      if (!editing) polygon.openPopup(polygon.getBounds().getCenter());
    }, 50);
    if (editing) {
      setTool(null);
      setSelected({ type: "zone", id });
    }
  }

  const selectedFeature = selected?.type === "feature" ? features.find((f) => f.id === selected.id) : undefined;
  const selectedZoneItem = selected?.type === "zone" ? zones.find((z) => z.id === selected.id) : undefined;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="relative flex-1 min-w-0 h-[62vh] min-h-[420px] lg:h-[calc(100vh-16rem)] lg:min-h-[520px] border border-slate-300 rounded overflow-hidden bg-slate-200">
        {missingImage ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-[13px] text-slate-600">
            <p>
              <strong className="block text-slate-800 mb-1">Fond de carte introuvable.</strong>
              Ajoute ton image dans le dossier <code className="bg-white px-1 rounded">public</code> du
              projet sous le nom <code className="bg-white px-1 rounded">map.png</code>, puis recharge la
              page.
            </p>
          </div>
        ) : (
          <>
            <div ref={containerRef} className="lsfd-map absolute inset-0" data-testid="map-canvas" />
            {mapVersion === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-[13px] text-slate-500 pointer-events-none">
                Chargement de la carte…
              </p>
            )}
          </>
        )}
        {editing && tool && (
          <div
            data-testid="tool-banner"
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-[#0d2644] text-white text-[12px] font-bold rounded px-3 py-1.5 shadow pointer-events-none"
          >
            {tool.type === "point"
              ? `Placement : ${FEATURE_META[tool.kind].label}`
              : `Dessin d'une zone (${ZONE_META[tool.kind].label}) — ${draft.length} sommet${draft.length > 1 ? "s" : ""}`}
          </div>
        )}
      </div>

      <aside className="lg:w-80 shrink-0 flex flex-col gap-4 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-1">
        {editing && (
          <ToolsCard
            tool={tool}
            draftCount={draft.length}
            busy={busy}
            onChoose={chooseTool}
            onFinishDraft={() => void finishDraft()}
            onUndoDraft={() => setDraft((previous) => previous.slice(0, -1))}
            onCancelDraft={() => chooseTool(null)}
            onCreateAssembly={() => void createAssembly()}
          />
        )}

        {editing && error && (
          <p role="alert" data-testid="map-error" className="border border-red-300 bg-red-50 text-red-800 text-[13px] rounded px-3 py-2">
            {error}
          </p>
        )}

        {editing && selectedFeature && (
          <FeatureForm
            key={selectedFeature.id}
            feature={selectedFeature}
            busy={busy}
            message={notice}
            onSave={(name, details) => void saveFeature(selectedFeature.id, name, details)}
            onDelete={() => void removeFeature(selectedFeature)}
          />
        )}
        {editing && selectedZoneItem && (
          <ZoneForm
            key={selectedZoneItem.id}
            zone={selectedZoneItem}
            battalions={zones.filter((z) => z.kind === "battalion")}
            busy={busy}
            message={notice}
            onSave={(fields) => void saveZone(selectedZoneItem.id, fields)}
            onDelete={() => void removeZone(selectedZoneItem)}
          />
        )}

        <WeatherCard weather={weather} />
        <FiltersCard
          features={features}
          zones={zones}
          hidden={hidden}
          selectedId={selected?.id ?? null}
          onToggle={toggleHidden}
          onFocusFeature={focusFeature}
          onFocusZone={focusZone}
        />
      </aside>
    </div>
  );
}
