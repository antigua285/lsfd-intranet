import { NextResponse } from "next/server";
import { fetchLosAngelesWeather } from "@/lib/weather";

/** Météo actuelle de Los Angeles (réservé aux connectés : le proxy verrouille toutes les routes). */
export async function GET() {
  try {
    const weather = await fetchLosAngelesWeather();
    return NextResponse.json(weather, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "Météo indisponible pour le moment." }, { status: 502 });
  }
}
