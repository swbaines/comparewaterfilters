/**
 * Haversine great-circle distance between two lat/lng points in kilometres.
 */
export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Look up a postcode (or suburb) and return the centroid lat/lng.
 * Uses our suburb-search edge function (which proxies postcodeapi.com.au).
 * Returns null on miss/error.
 */
export async function lookupPostcodeCoords(
  query: string
): Promise<{ lat: number; lng: number; state: string } | null> {
  if (!query || query.length < 2) return null;
  try {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!baseUrl || !apiKey) return null;
    const res = await fetch(
      `${baseUrl}/functions/v1/suburb-search?q=${encodeURIComponent(query)}`,
      { headers: { apikey: apiKey } }
    );
    if (!res.ok) return null;
    const list = (await res.json()) as Array<{
      latitude: number | null;
      longitude: number | null;
      state: string;
    }>;
    const hit = list.find((s) => s.latitude != null && s.longitude != null);
    if (!hit) return null;
    return { lat: hit.latitude!, lng: hit.longitude!, state: hit.state };
  } catch {
    return null;
  }
}
