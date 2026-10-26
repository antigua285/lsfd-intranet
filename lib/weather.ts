/**
 * Météo de Los Santos (mêmes coordonnées que la vraie ville de référence) via Open-Meteo (gratuit, sans clé, sans compte).
 * https://open-meteo.com/en/docs
 *
 * Réglage RP : on affiche la PRÉVISION de l'heure réelle + FORECAST_OFFSET_HOURS (19 h à Los Santos
 * -> prévision de 2 h du matin), pas la mesure actuelle.
 */

/** Décalage entre l'heure réelle et l'heure de la prévision affichée. */
export const FORECAST_OFFSET_HOURS = 7;

export type Weather = {
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windMph: number;
  gustMph: number;
  windDeg: number;
  precipitationMm: number;
  code: number;
  summary: string;
  /** Heure locale de la prévision affichée (fuseau de Los Santos), ex. « 2026-10-26T02:00 ». */
  observedAt: string;
  /** Humidité très basse + vent fort : critères proches d'une alerte "Red Flag". */
  redFlag: boolean;
};

export const LA_LATITUDE = 34.0522;
export const LA_LONGITUDE = -118.2437;

const WMO_CODES: Record<number, string> = {
  0: "Ciel dégagé",
  1: "Plutôt dégagé",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  53: "Bruine",
  55: "Bruine forte",
  56: "Bruine verglaçante",
  57: "Bruine verglaçante forte",
  61: "Pluie légère",
  63: "Pluie",
  65: "Pluie forte",
  66: "Pluie verglaçante",
  67: "Pluie verglaçante forte",
  71: "Neige légère",
  73: "Neige",
  75: "Neige forte",
  77: "Grains de neige",
  80: "Averses légères",
  81: "Averses",
  82: "Averses violentes",
  85: "Averses de neige",
  86: "Averses de neige fortes",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Orage violent avec grêle",
};

export function describeWeatherCode(code: number): string {
  return WMO_CODES[code] ?? "Conditions inconnues";
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

export function compassPoint(deg: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return points[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

const HOURLY_FIELDS =
  "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation," +
  "weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m";

const API_URL =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${LA_LATITUDE}&longitude=${LA_LONGITUDE}` +
  `&hourly=${HOURLY_FIELDS}&forecast_days=3` +
  "&wind_speed_unit=mph&timezone=America%2FLos_Angeles";

function num(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Météo : valeur "${label}" absente ou invalide.`);
  }
  return value;
}

/** Heure locale (Los Santos) « AAAA-MM-JJTHH:00 » de l'instant `now` + `offsetHours`. */
export function targetHour(now: Date, offsetHours = FORECAST_OFFSET_HOURS): string {
  const shifted = new Date(now.getTime() + offsetHours * 3_600_000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(shifted);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:00`;
}

/** Extrait de la réponse horaire d'Open-Meteo la prévision de l'heure `target` (séparé pour être testable sans réseau). */
export function parseWeatherResponse(json: unknown, target: string): Weather {
  const hourly = (json as { hourly?: Record<string, unknown> } | null)?.hourly;
  if (!hourly || typeof hourly !== "object" || !Array.isArray(hourly.time)) throw new Error("Météo : réponse inattendue.");
  const i = hourly.time.indexOf(target);
  if (i < 0) throw new Error("Météo : heure de prévision introuvable.");
  const at = (key: string, label: string) => num((hourly[key] as unknown[] | undefined)?.[i], label);

  const humidity = at("relative_humidity_2m", "humidité");
  const windMph = at("wind_speed_10m", "vent");
  const gustMph = at("wind_gusts_10m", "rafales");
  const code = at("weather_code", "code météo");

  return {
    temperatureC: at("temperature_2m", "température"),
    feelsLikeC: at("apparent_temperature", "ressenti"),
    humidity,
    windMph,
    gustMph,
    windDeg: at("wind_direction_10m", "direction du vent"),
    precipitationMm: at("precipitation", "précipitations"),
    code,
    summary: describeWeatherCode(code),
    observedAt: target,
    redFlag: humidity <= 15 && (windMph >= 25 || gustMph >= 35),
  };
}

export async function fetchLosSantosWeather(now = new Date()): Promise<Weather> {
  const response = await fetch(API_URL, { cache: "no-store", signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error(`Météo : le service a répondu ${response.status}.`);
  return parseWeatherResponse(await response.json(), targetHour(now));
}
