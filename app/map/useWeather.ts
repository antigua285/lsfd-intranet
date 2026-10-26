"use client";

import { useEffect, useState } from "react";
import type { Weather } from "@/lib/weather";

export type WeatherState =
  | { status: "loading" }
  | { status: "ok"; data: Weather }
  | { status: "error" };

const REFRESH_MS = 10 * 60 * 1000;

/** Prévision météo de Los Santos (heure réelle + 7 h), rafraîchie toutes les 10 minutes. */
export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/weather");
        if (!response.ok) throw new Error("weather");
        const data = (await response.json()) as Weather;
        if (!cancelled) setState({ status: "ok", data });
      } catch {
        // On garde la dernière valeur connue si un rafraîchissement échoue.
        if (!cancelled) setState((previous) => (previous.status === "ok" ? previous : { status: "error" }));
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return state;
}
