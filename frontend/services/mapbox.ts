// Mapbox Geocoding + Directions helpers
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string;

export type GeoSuggestion = {
  id: string;
  name: string;       // full place_name (Polish)
  short: string;      // short text
  lat: number;
  lng: number;
};

export async function searchAddress(query: string, proximityLat = 50.0617, proximityLng = 19.9373): Promise<GeoSuggestion[]> {
  if (!query || query.trim().length < 2) return [];
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json?country=pl&language=pl&proximity=${proximityLng},${proximityLat}&limit=6&access_token=${TOKEN}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.features || []).map((f: any) => ({
      id: f.id,
      name: f.place_name_pl || f.place_name,
      short: f.text_pl || f.text,
      lat: f.center[1],
      lng: f.center[0],
    }));
  } catch {
    return [];
  }
}

export type RouteResult = {
  distance_km: number;
  duration_min: number;
  coordinates: Array<[number, number]>; // [lng, lat]
};

export async function getRoute(pickup: { lat: number; lng: number }, dest: { lat: number; lng: number }): Promise<RouteResult | null> {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${dest.lng},${dest.lat}?geometries=geojson&overview=full&language=pl&access_token=${TOKEN}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    const route = (data.routes || [])[0];
    if (!route) return null;
    return {
      distance_km: route.distance / 1000,
      duration_min: route.duration / 60,
      coordinates: route.geometry.coordinates as Array<[number, number]>,
    };
  } catch {
    return null;
  }
}
