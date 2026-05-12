import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import MapView from "../../components/MapView";
import { useLiveLocation } from "../../hooks/useLiveLocation";

const STATUS_TEXT: Record<string, string> = {
  pending: "Szukamy kierowcy...",
  accepted: "Twój kierowca jest w drodze",
  in_progress: "W trakcie przejazdu",
  completed: "Przejazd zakończony",
  cancelled: "Przejazd anulowany",
};

// Haversine distance in km
function haversine(a: any, b: any) {
  if (!a || !b) return 0;
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function Tracking() {
  const router = useRouter();
  const { ride_id } = useLocalSearchParams<{ ride_id: string }>();
  const { authFetch } = useAuth();
  const [ride, setRide] = useState<any>(null);
  const passengerLoc = useLiveLocation(true);

  const load = useCallback(async () => {
    const r = await authFetch("/api/rides/active");
    if (r.ok) {
      const data = await r.json();
      if (data) {
        setRide(data);
      } else {
        // No active ride anymore — back to home
        router.replace("/passenger/home");
      }
    }
  }, [authFetch, router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 3500);
    return () => clearInterval(i);
  }, [load]);

  useEffect(() => {
    if (ride?.status === "completed") {
      router.replace({ pathname: "/passenger/pay", params: { ride_id: ride.ride_id } });
    }
    if (ride?.status === "cancelled") {
      router.replace("/passenger/home");
    }
  }, [ride, router]);

  const cancel = async () => {
    const confirmed =
      Platform.OS === "web"
        ? (typeof window !== "undefined" && window.confirm("Anulować przejazd? Tej akcji nie można cofnąć."))
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Anulować przejazd?", "Tej akcji nie można cofnąć.", [
              { text: "Nie", style: "cancel", onPress: () => resolve(false) },
              { text: "Tak, anuluj", style: "destructive", onPress: () => resolve(true) },
            ]);
          });
    if (!confirmed) return;
    await authFetch(`/api/rides/${ride.ride_id}/cancel`, { method: "POST" });
    router.replace("/passenger/home");
  };

  if (!ride) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#0F0F0F" />
      </View>
    );
  }

  const driverPos = ride.driver_lat && ride.driver_lng ? { lat: ride.driver_lat, lng: ride.driver_lng, label: "Kierowca" } : null;

  // Dynamic ETA
  let etaText = "—";
  if (driverPos) {
    if (ride.status === "accepted") {
      const km = haversine(driverPos, { lat: ride.pickup_lat, lng: ride.pickup_lng });
      const min = Math.max(1, Math.round(km / 0.5)); // ~30 km/h city
      etaText = `Za ${min} ${min === 1 ? "minutę" : min < 5 ? "minuty" : "minut"}`;
    } else if (ride.status === "in_progress") {
      const km = haversine(driverPos, { lat: ride.dest_lat, lng: ride.dest_lng });
      const min = Math.max(1, Math.round(km / 0.5));
      etaText = `Do celu ~${min} min`;
    }
  } else if (ride.status === "accepted") {
    etaText = "Za 3 minuty";
  } else if (ride.status === "in_progress") {
    etaText = "Do celu ~8 min";
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          pickup={{ lat: ride.pickup_lat, lng: ride.pickup_lng, label: "Odbiór" }}
          destination={{ lat: ride.dest_lat, lng: ride.dest_lng, label: "Cel" }}
          drivers={[
            ...(driverPos ? [driverPos] : []),
            ...(passengerLoc ? [{ lat: passengerLoc.lat, lng: passengerLoc.lng, label: "Ty" }] : []),
          ]}
        />
        <View style={styles.topBar}>
          <TouchableOpacity testID="back-home-btn" style={styles.iconBtn} onPress={() => router.replace("/passenger/home")}>
            <Ionicons name="chevron-back" size={22} color="#0F0F0F" />
          </TouchableOpacity>
          <View style={styles.statusPill}>
            <View style={[styles.dotLive, ride.status === "pending" && { backgroundColor: "#FFD600" }]} />
            <Text style={styles.statusPillText} testID="ride-status">{STATUS_TEXT[ride.status] || ride.status}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        {ride.status === "pending" ? (
          <View style={styles.searchBox}>
            <ActivityIndicator color="#0F0F0F" />
            <Text style={styles.searchText}>Szukamy najlepszego kierowcy w Twojej okolicy...</Text>
          </View>
        ) : (
          <>
            <View style={styles.driverRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(ride.driver_name || "K")[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{ride.driver_name || "Kierowca"}</Text>
                <Text style={styles.driverSub}>{ride.driver_car || "Pojazd"} • {ride.driver_plate || "—"}</Text>
              </View>
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color="#FFD600" />
                <Text style={styles.ratingText}>5.0</Text>
              </View>
            </View>

            <View style={styles.etaBox}>
              <Text style={styles.etaLabel}>SZACOWANY CZAS</Text>
              <Text style={styles.etaValue}>{etaText}</Text>
            </View>
          </>
        )}

        <View style={styles.routeBox}>
          <View style={styles.routeRow}>
            <View style={styles.dotA} />
            <Text numberOfLines={1} style={styles.routeText}>{ride.pickup_address}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.dotB} />
            <Text numberOfLines={1} style={styles.routeText}>{ride.dest_address}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Do zapłaty</Text>
          <Text style={styles.priceVal}>{ride.price_pln?.toFixed(2)} zł</Text>
        </View>

        <TouchableOpacity testID="cancel-ride-btn" style={styles.cancelBtn} onPress={cancel}>
          <Text style={styles.cancelText}>Anuluj przejazd</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  mapWrap: { flex: 1, backgroundColor: "#E5E5E5" },
  topBar: { position: "absolute", top: Platform.OS === "ios" ? 56 : 40, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.95)", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  dotLive: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00E676" },
  statusPillText: { color: "#0F0F0F", fontWeight: "700", fontSize: 13 },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: Platform.OS === "ios" ? 32 : 22 },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: "#E5E5E5", alignSelf: "center", marginBottom: 14 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "#FFD600", borderRadius: 14, marginBottom: 16 },
  searchText: { flex: 1, color: "#0F0F0F", fontWeight: "700" },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#0F0F0F", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFD600", fontSize: 22, fontWeight: "900" },
  driverName: { fontSize: 17, fontWeight: "900", color: "#0F0F0F" },
  driverSub: { fontSize: 13, color: "#525252", marginTop: 2 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#FAFAFA", borderRadius: 999 },
  ratingText: { fontSize: 13, fontWeight: "800", color: "#0F0F0F" },
  etaBox: { padding: 14, backgroundColor: "#FAFAFA", borderRadius: 14, marginBottom: 14 },
  etaLabel: { fontSize: 10, color: "#525252", letterSpacing: 1.4, fontWeight: "700" },
  etaValue: { fontSize: 22, fontWeight: "900", color: "#0F0F0F", marginTop: 2 },
  routeBox: { padding: 14, borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 14, marginBottom: 14 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  routeLine: { width: 1, height: 14, backgroundColor: "#E5E5E5", marginLeft: 6, marginVertical: 4 },
  routeText: { flex: 1, color: "#0F0F0F", fontWeight: "600", fontSize: 14 },
  dotA: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#FFD600", borderWidth: 2, borderColor: "#0F0F0F" },
  dotB: { width: 12, height: 12, borderRadius: 2, backgroundColor: "#0F0F0F" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  priceLabel: { color: "#525252", fontWeight: "600" },
  priceVal: { color: "#0F0F0F", fontSize: 24, fontWeight: "900" },
  cancelBtn: { paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "#FF3B30", alignItems: "center" },
  cancelText: { color: "#FF3B30", fontWeight: "800" },
});
