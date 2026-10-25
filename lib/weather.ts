/**
 * Météo actuelle de Los Angeles via Open-Meteo (gratuit, sans clé, sans compte).
 * https://open-meteo.com/en/docs
 */

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
  /** Heure locale de la mesure (Los Angeles), telle que renvoyée par le service. */
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

const API_URL =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${LA_LATITUDE}&longitude=${LA_LONGITUDE}` +
  "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation," +
  "weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m" +
  "&wind_speed_unit=mph&timezone=America%2FLos_Angeles";

function num(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Météo : valeur "${label}" absente ou invalide.`);
  }
  return value;
}

/** Transforme la réponse brute d'Open-Meteo (séparé pour pouvoir être testé sans réseau). */
export function parseWeatherResponse(json: unknown): Weather {
  const current = (json as { current?: Record<string, unknown> } | null)?.current;
  if (!current || typeof current !== "object") throw new Error("Météo : réponse inattendue.");

  const humidity = num(current.relative_humidity_2m, "humidité");
  const windMph = num(current.wind_speed_10m, "vent");
  const gustMph = num(current.wind_gusts_10m, "rafales");
  const code = num(current.weather_code, "code météo");

  return {
    temperatureC: num(current.temperature_2m, "température"),
    feelsLikeC: num(current.apparent_temperature, "ressenti"),
    humidity,
    windMph,
    gustMph,
    windDeg: num(current.wind_direction_10m, "direction du vent"),
    precipitationMm: num(current.precipitation, "précipitations"),
    code,
    summary: describeWeatherCode(code),
    observedAt: typeof current.time === "string" ? current.time : "",
    redFlag: humidity <= 15 && (windMph >= 25 || gustMph >= 35),
  };
}

export async function fetchLosAngelesWeather(): Promise<Weather> {
  const response = await fetch(API_URL, { cache: "no-store", signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error(`Météo : le service a répondu ${response.status}.`);
  return parseWeatherResponse(await response.json());
}
