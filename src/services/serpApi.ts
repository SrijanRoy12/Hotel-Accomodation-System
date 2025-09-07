export async function fetchHotelImage(query: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_SERPAPI_KEY as string | undefined;
  if (!apiKey) {
    console.warn('[SerpApi] Missing VITE_SERPAPI_KEY; cannot fetch images.');
    return null;
  }

  try {
    // Normalize noisy address strings often coming from scraped sources
    const cleanQuery = query
      .replace(/–\s*Show\s*map/gi, '')
      .replace(/-\s*Show\s*map/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Use Vite dev proxy in development to avoid CORS; use direct URL in production
    const baseUrl = import.meta.env.DEV ? '/api/serp/search.json' : 'https://serpapi.com/search.json';

    // 1) Try Google Maps engine to get photo_url
    const mapsParams = new URLSearchParams({
      engine: 'google_maps',
      q: cleanQuery,
      type: 'search',
      api_key: apiKey,
      hl: 'en',
      gl: 'in',
    });
    const mapsRes = await fetch(`${baseUrl}?${mapsParams.toString()}`);
    if (mapsRes.ok) {
      const mapsData = await mapsRes.json();
      const place = mapsData?.place_results;
      const photos = place?.photos as Array<{ photo_url?: string }> | undefined;
      const purl = photos?.find(p => p?.photo_url)?.photo_url ?? null;
      if (purl && typeof purl === 'string' && purl.startsWith('http')) {
        const httpsUrl = purl.replace(/^http:\/\//, 'https://');
        return httpsUrl;
      }
    } else {
      console.warn('[SerpApi] google_maps engine response not OK:', mapsRes.status);
    }

    // 2) Fall back to Google Images
    const imgParams = new URLSearchParams({
      engine: 'google_images',
      q: `${cleanQuery} hotel`,
      api_key: apiKey,
      ijn: '0',
      safe: 'active',
      gl: 'in',
      hl: 'en',
    });
    const res = await fetch(`${baseUrl}?${imgParams.toString()}`);
    if (!res.ok) {
      console.warn('[SerpApi] google_images engine response not OK:', res.status);
      return null;
    }
    const data = await res.json();
    const images = data?.images_results as Array<{ original?: string; thumbnail?: string; link?: string }> | undefined;
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.warn('[SerpApi] No images_results returned for query:', cleanQuery);
      return null;
    }
    const first = images.find((i) => i?.original) || images[0];
    let url = first?.original || first?.thumbnail || first?.link || null;
    if (url && typeof url === 'string') {
      url = url.replace(/^http:\/\//, 'https://');
      if (url.startsWith('https://')) return url;
    }
    console.warn('[SerpApi] No usable https image URL for query:', cleanQuery);
    return null;
  } catch (e) {
    console.warn('[SerpApi] Error fetching image for query:', query, e);
    return null;
  }
}

// Shared cache and de-duplication across components
const sharedImageCache = new Map<string, string | null>();
const sharedInFlight = new Map<string, Promise<string | null>>();

export function getCachedUrl(key: string): string | null {
  return sharedImageCache.get(key) ?? null;
}

export async function getCachedHotelImage(key: string, query: string): Promise<string | null> {
  if (sharedImageCache.has(key)) return sharedImageCache.get(key) ?? null;
  const existing = sharedInFlight.get(key);
  if (existing) return existing;
  const p = fetchHotelImage(query)
    .then((url) => {
      sharedImageCache.set(key, url ?? null);
      sharedInFlight.delete(key);
      return url ?? null;
    })
    .catch((err) => {
      console.warn('[SerpApi] getCachedHotelImage error for key:', key, err);
      sharedInFlight.delete(key);
      return null;
    });
  sharedInFlight.set(key, p);
  return p;
}
