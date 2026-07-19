import { useEffect, useState, useRef } from "react";

/**
 * Fetches a driving route from Mapbox Directions API.
 * Returns an array of [lng, lat] coordinates suitable for MapView routeCoords.
 * Automatically refetches when start or end changes significantly (> 20m).
 */
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string;

type LatLng = { lat: number; lng: number };

type Route = {
  coords: [number, number][]; // [lng, lat] pairs
  distance_m: number;
  duration_s: number;
} | null;

function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function useMapboxRoute(start: LatLng | null | undefined, end: LatLng | null | undefined): Route {
  const [route, setRoute] = useState<Route>(null);
  const lastFetchRef = useRef<{ start: LatLng | null; end: LatLng | null }>({ start: null, end: null });

  useEffect(() => {
    if (!start || !end || !MAPBOX_TOKEN) return;
    // Skip refetch if inputs haven't moved much (avoids hammering API on GPS jitter)
    const prev = lastFetchRef.current;
    if (
      prev.start && prev.end &&
      haversineM(prev.start, start) < 20 &&
      haversineM(prev.end, end) < 20 &&
      route
    ) {
      return;
    }
    lastFetchRef.current = { start, end };
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.routes?.[0]) return;
        const r0 = data.routes[0];
        setRoute({
          coords: r0.geometry.coordinates as [number, number][],
          distance_m: r0.distance,
          duration_s: r0.duration,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [start?.lat, start?.lng, end?.lat, end?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return route;
}

/** Open native turn-by-turn navigation in Google Maps / Apple Maps. */
export function openNativeNavigation(dest: LatLng, label?: string) {
  // Universal geo: URL works on Android, iOS opens Apple Maps
  if (typeof window === "undefined") return;
  const ua = window.navigator?.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  let url: string;
  if (isIOS) {
    url = `https://maps.apple.com/?daddr=${dest.lat},${dest.lng}&dirflg=d${label ? `&q=${encodeURIComponent(label)}` : ""}`;
  } else {
    // Google Maps with turn-by-turn
    url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`;
  }
  window.open(url, "_blank");
}
