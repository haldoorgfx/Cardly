/**
 * Lightweight server-side geocoding via OpenStreetMap Nominatim.
 * No API key required. Nominatim's usage policy asks for a descriptive
 * User-Agent and low request volume — we only call this when an event has
 * no stored coordinates, and we persist the result so it runs at most once
 * per event.
 */

export interface Coords {
  lat: number;
  lng: number;
}

/** Geocode a free-text location string. Returns null on any failure. */
export async function geocodeAddress(query: string): Promise<Coords | null> {
  const q = query.trim();
  if (!q) return null;

  try {
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
      encodeURIComponent(q);
    // Never let geocoding block page render for more than a few seconds.
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Eventera Events (https://karta.cre8so.com)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(3500),
      // Geocoding rarely changes; let Next cache it for a day.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
