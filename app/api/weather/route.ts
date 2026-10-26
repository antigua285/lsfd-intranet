import { NextResponse } from "next/server";
import { fetchLosSantosWeather } from "@/lib/weather";

/** Prévision météo de Los Santos (heure réelle + 7 h) (réservé aux connectés : le proxy verrouille toutes les routes). */
export async function GET() {
  try {
    const weather = await fetchLosSantosWeather();
    return NextResponse.json(weather, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "Météo indisponible pour le moment." }, { status: 502 });
  }
}
