import { useEffect, useState, useRef } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

export type LiveLocation = { lat: number; lng: number; accuracy?: number };

/**
 * Live GPS tracking for the driver. Returns latest position and starts a watcher
 * (every ~10 seconds or when accuracy improves).
 */
export function useLiveLocation(enabled: boolean): LiveLocation | null {
  const [loc, setLoc] = useState<LiveLocation | null>(null);
  const watcherRef = useRef<any>(null);
  const webWatchIdRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!enabled) return;

      if (Platform.OS === "web") {
        if (typeof navigator === "undefined" || !navigator.geolocation) return;
        // Use browser geolocation
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            if (cancelled) return;
            setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
        webWatchIdRef.current = id;
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!cancelled) setLoc({ lat: initial.coords.latitude, lng: initial.coords.longitude, accuracy: initial.coords.accuracy ?? undefined });
        watcherRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 15 },
          (pos) => {
            if (cancelled) return;
            setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? undefined });
          }
        );
      } catch {}
    }

    start();

    return () => {
      cancelled = true;
      if (watcherRef.current) {
        try { watcherRef.current.remove(); } catch {}
        watcherRef.current = null;
      }
      if (webWatchIdRef.current != null && typeof navigator !== "undefined" && navigator.geolocation) {
        try { navigator.geolocation.clearWatch(webWatchIdRef.current); } catch {}
        webWatchIdRef.current = null;
      }
    };
  }, [enabled]);

  return loc;
}
