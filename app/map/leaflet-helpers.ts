import type * as Leaflet from "leaflet";
import {
  FEATURE_META,
  ZONE_META,
  detailLines,
  type MapFeature,
  type MapPoint,
  type MapZone,
} from "@/lib/map-types";
import { assembledBattalions } from "@/lib/map-geometry";
import { celsiusToFahrenheit, compassPoint, type Weather } from "@/lib/weather";
import type { WeatherState } from "./useWeather";

/** Taille de l'image de fond en pixels : sert à convertir fractions <-> coordonnées Leaflet. */
export type Size = { w: number; h: number };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// Leaflet (CRS.Simple) : lat = vers le haut, lng = vers la droite, origine en bas à gauche.
// Nos points : y = 0 en haut de l'image. D'où le "1 - y".
export function toLatLng(L: typeof Leaflet, size: Size, [x, y]: MapPoint): Leaflet.LatLng {
  return L.latLng((1 - y) * size.h, x * size.w);
}

export function toFraction(size: Size, latlng: { lat: number; lng: number }): MapPoint {
  return [clamp01(latlng.lng / size.w), clamp01(1 - latlng.lat / size.h)];
}

export function insideImage(size: Size, latlng: { lat: number; lng: number }): boolean {
  return latlng.lng >= 0 && latlng.lng <= size.w && latlng.lat >= 0 && latlng.lat <= size.h;
}

/** Texte brut dans un élément : jamais d'HTML construit à partir des noms saisis. */
export function textNode(text: string): HTMLElement {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

export const Z_OFFSET: Record<MapFeature["kind"], number> = {
  weather: 0,
  hydrant: 200,
  risk: 400,
  station: 600,
};

export function featureSignature(f: MapFeature, selected: boolean): string {
  return [
    f.kind,
    f.name,
    f.x,
    f.y,
    f.details.status ?? "",
    f.details.hazard ?? "",
    f.details.number ?? "",
    selected ? "1" : "0",
  ].join("|");
}

export function zoneSignature(z: MapZone, selected: boolean, geometry: unknown): string {
  return [z.kind, z.name, z.color, JSON.stringify(geometry), selected ? "1" : "0"].join("|");
}

export function buildMarkerIcon(L: typeof Leaflet, f: MapFeature, selected: boolean): Leaflet.DivIcon {
  const el = document.createElement("div");
  const classes = ["lm", `lm-${f.kind}`];
  if (f.kind === "hydrant") classes.push(`st-${f.details.status ?? "in_service"}`);
  if (f.kind === "risk") classes.push(`hz-${f.details.hazard ?? "medium"}`);
  if (selected) classes.push("is-selected");
  el.className = classes.join(" ");

  const glyph = document.createElement("span");
  if (f.kind === "station") glyph.textContent = f.details.number || "FS";
  else if (f.kind === "risk") glyph.textContent = "!";
  else if (f.kind === "weather") glyph.textContent = "☁";
  el.appendChild(glyph);

  return L.divIcon({ html: el, className: "lm-wrap", iconSize: [30, 30], iconAnchor: [15, 15] });
}

export function buildVertexIcon(L: typeof Leaflet, variant: "vertex" | "mid" | "draft"): Leaflet.DivIcon {
  const el = document.createElement("div");
  el.className = variant === "vertex" ? "lv" : variant === "mid" ? "lv-mid" : "lv-draft";
  const size = variant === "vertex" ? 14 : 10;
  return L.divIcon({ html: el, className: "lv-wrap", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

export type WeatherLine = { label: string; value: string };

export function weatherLines(w: Weather): WeatherLine[] {
  const f = celsiusToFahrenheit;
  return [
    { label: "Température", value: `${f(w.temperatureC)} °F (${Math.round(w.temperatureC)} °C)` },
    { label: "Ressenti", value: `${f(w.feelsLikeC)} °F (${Math.round(w.feelsLikeC)} °C)` },
    { label: "Humidité", value: `${Math.round(w.humidity)} %` },
    {
      label: "Vent",
      value: `${Math.round(w.windMph)} mph ${compassPoint(w.windDeg)} · rafales ${Math.round(w.gustMph)} mph`,
    },
    ...(w.precipitationMm > 0
      ? [{ label: "Précipitations", value: `${w.precipitationMm.toFixed(1)} mm` }]
      : []),
  ];
}

function appendLines(parent: HTMLElement, lines: WeatherLine[]) {
  const dl = document.createElement("dl");
  for (const line of lines) {
    const dt = document.createElement("dt");
    dt.textContent = line.label;
    const dd = document.createElement("dd");
    dd.textContent = line.value;
    dl.append(dt, dd);
  }
  parent.appendChild(dl);
}

function popupShell(title: string, subtitle: string): HTMLElement {
  const root = document.createElement("div");
  root.className = "lsfd-popup";
  const h = document.createElement("h3");
  h.textContent = title;
  const sub = document.createElement("div");
  sub.className = "sub";
  sub.textContent = subtitle;
  root.append(h, sub);
  return root;
}

export function buildFeaturePopup(f: MapFeature, weather: WeatherState, showReportLinks = false): HTMLElement {
  const root = popupShell(f.name, FEATURE_META[f.kind].label);

  if (f.kind === "weather") {
    if (weather.status === "ok") {
      const p = document.createElement("div");
      p.textContent = weather.data.summary;
      p.style.fontWeight = "700";
      root.appendChild(p);
      appendLines(root, weatherLines(weather.data));
      if (weather.data.redFlag) {
        const flag = document.createElement("div");
        flag.className = "flag";
        flag.textContent = "Vent fort + air très sec : conditions critiques";
        root.appendChild(flag);
      }
    } else {
      const p = document.createElement("div");
      p.textContent = weather.status === "loading" ? "Chargement de la météo…" : "Météo indisponible.";
      root.appendChild(p);
    }
  }

  const lines = detailLines(f);
  if (lines.length) appendLines(root, lines);
  if (f.lastReport) {
    const when = new Date(f.lastReport.at).toLocaleDateString("fr-FR");
    const p = document.createElement("div");
    p.className = "last-report";
    p.style.marginTop = "6px";
    p.append("Dernier rapport : ");
    if (showReportLinks) {
      const a = document.createElement("a");
      a.href = `/reports/${f.lastReport.id}`;
      a.textContent = `${f.lastReport.title} — ${when}`;
      a.style.textDecoration = "underline";
      p.appendChild(a);
    } else {
      p.append(`${f.lastReport.title} — ${when}`);
    }
    root.appendChild(p);
  }
  return root;
}

export function buildZonePopup(z: MapZone, all: MapZone[]): HTMLElement {
  const root = popupShell(z.name, ZONE_META[z.kind].label);
  const parts = assembledBattalions(z, all);
  if (parts.length) appendLines(root, [{ label: "Bataillons", value: parts.map((b) => b.name).join(", ") }]);
  return root;
}
