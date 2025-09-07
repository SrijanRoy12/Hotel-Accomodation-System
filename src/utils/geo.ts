// Geolocation and fuzzy matching utilities for hotel proximity search
// Browser-safe Nominatim geocoding and simple fuzzy matching implementation

export interface LatLng {
  lat: number;
  lng: number;
}

// Haversine distance in kilometers
export function haversineDistance(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

// Simple fuzzy similarity using Dice coefficient on bigrams
function bigrams(s: string): string[] {
  const str = s.toLowerCase().trim();
  const grams: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    grams.push(str.slice(i, i + 2));
  }
  return grams;
}

function diceCoefficient(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a.toLowerCase() === b.toLowerCase()) return 1;
  const aGrams = bigrams(a);
  const bGrams = bigrams(b);
  if (aGrams.length === 0 || bGrams.length === 0) return 0;
  let matches = 0;
  const bMap = new Map<string, number>();
  for (const g of bGrams) bMap.set(g, (bMap.get(g) || 0) + 1);
  for (const g of aGrams) {
    const c = bMap.get(g) || 0;
    if (c > 0) {
      matches++;
      bMap.set(g, c - 1);
    }
  }
  return (2 * matches) / (aGrams.length + bGrams.length);
}

export function getCloseMatches(query: string, choices: string[], n = 5, cutoff = 0.6): string[] {
  const scored = choices
    .map((c) => ({ choice: c, score: Math.max(diceCoefficient(query, c), c.toLowerCase().includes(query.toLowerCase()) ? 0.75 : 0) }))
    .filter((x) => x.score >= cutoff)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.choice);
  return Array.from(new Set(scored));
}

// Geocode using Nominatim public API
export async function geocodeNominatim(q: string): Promise<LatLng | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  } catch (e) {
    return null;
  }
}
