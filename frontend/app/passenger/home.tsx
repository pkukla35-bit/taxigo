import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import MapView from "../../components/MapView";
import { searchAddress, getRoute, GeoSuggestion, RouteResult } from "../../services/mapbox";

type Place = { name: string; lat: number; lng: number };

export default function PassengerHome() {
  const router = useRouter();
  const { user, authFetch, logout } = useAuth();
  const [pickup, setPickup] = useState<Place | null>(null);
  const [dest, setDest] = useState<Place | null>(null);
  const [pickupQ, setPickupQ] = useState("");
  const [destQ, setDestQ] = useState("");
  const [activeField, setActiveField] = useState<"pickup" | "dest" | null>(null);
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<any>(null);

  const loadActive = useCallback(async () => {
    const r = await authFetch("/api/rides/active");
    if (r.ok) {
      const data = await r.json();
      if (data && ["pending", "accepted", "in_progress"].includes(data.status)) {
        router.replace({ pathname: "/passenger/tracking", params: { ride_id: data.ride_id } });
      }
    }
  }, [authFetch, router]);

  const loadDrivers = useCallback(async () => {
    const r = await authFetch("/api/drivers/online");
    if (r.ok) setDrivers(await r.json());
  }, [authFetch]);

  useEffect(() => {
    loadActive();
    loadDrivers();
    const i = setInterval(loadDrivers, 8000);
    return () => clearInterval(i);
  }, [loadActive, loadDrivers]);

  // Debounced address search
  useEffect(() => {
    const q = activeField === "pickup" ? pickupQ : activeField === "dest" ? destQ : "";
    if (!activeField || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchAddress(q);
      setSuggestions(res);
      setSearching(false);
    }, 350);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [pickupQ, destQ, activeField]);

  // Compute route when both points selected
  useEffect(() => {
    if (pickup && dest) {
      getRoute(pickup, dest).then(setRoute);
    } else {
      setRoute(null);
    }
  }, [pickup, dest]);

  const BASE_FEE = 5;
  const PRICE_PER_KM = 3;
  const distance = route?.distance_km || 0;
  const price = distance ? BASE_FEE + distance * PRICE_PER_KM : 0;

  const pickSuggestion = (s: GeoSuggestion) => {
    const p: Place = { name: s.name, lat: s.lat, lng: s.lng };
    if (activeField === "pickup") {
      setPickup(p); setPickupQ("");
      setActiveField(dest ? null : "dest");
    } else {
      setDest(p); setDestQ("");
      setActiveField(null);
    }
    setSuggestions([]);
  };

  const order = async () => {
    if (!pickup || !dest || !route) return Alert.alert("Brak danych", "Wybierz miejsce odbioru i docelowe.");
    setLoading(true);
    const r = await authFetch("/api/rides", {
      method: "POST",
      body: JSON.stringify({
        pickup_address: pickup.name,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dest_address: dest.name,
        dest_lat: dest.lat,
        dest_lng: dest.lng,
        distance_km: Math.round(distance * 10) / 10,
        price_pln: Math.round(price * 100) / 100,
      }),
    });
    setLoading(false);
    if (r.ok) {
      const data = await r.json();
      router.replace({ pathname: "/passenger/tracking", params: { ride_id: data.ride_id } });
    } else {
      Alert.alert("Błąd", "Nie udało się zamówić.");
    }
  };

  const driverMarkers = drivers
    .filter((d) => d.last_lat && d.last_lng)
    .map((d) => ({ lat: d.last_lat, lng: d.last_lng, label: "Kierowca" }));

  const showList = activeField && (activeField === "pickup" ? pickupQ.length >= 2 : destQ.length >= 2);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView pickup={pickup} destination={dest} drivers={driverMarkers} routeCoords={route?.coordinates || null} />
        <View style={styles.topBar}>
          <TouchableOpacity testID="logout-btn" style={styles.iconBtn} onPress={() => { logout(); router.replace("/"); }}>
            <Ionicons name="log-out-outline" size={20} color="#0F0F0F" />
          </TouchableOpacity>
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>TAXIGO</Text>
          </View>
          <TouchableOpacity testID="history-btn" style={styles.iconBtn} onPress={() => router.push("/passenger/history")}>
            <Ionicons name="time-outline" size={20} color="#0F0F0F" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.greeting}>Cześć, {user?.name?.split(" ")[0] || "podróżniku"} 👋</Text>
        <Text style={styles.h1}>Dokąd jedziemy?</Text>

        <View style={styles.routeRow}>
          <View style={styles.dotA} />
          <TextInput
            testID="pickup-input"
            value={pickupQ || pickup?.name || ""}
            onChangeText={(t) => { setPickupQ(t); setPickup(null); setActiveField("pickup"); }}
            onFocus={() => setActiveField("pickup")}
            placeholder="Skąd jedziemy?"
            placeholderTextColor="#A3A3A3"
            style={styles.input}
            numberOfLines={1}
          />
        </View>
        <View style={styles.divLine} />
        <View style={styles.routeRow}>
          <View style={styles.dotB} />
          <TextInput
            testID="dest-input"
            value={destQ || dest?.name || ""}
            onChangeText={(t) => { setDestQ(t); setDest(null); setActiveField("dest"); }}
            onFocus={() => setActiveField("dest")}
            placeholder="Dokąd jedziemy?"
            placeholderTextColor="#A3A3A3"
            style={styles.input}
            numberOfLines={1}
          />
        </View>

        {showList && (
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {searching && (
              <View style={styles.listItem}>
                <ActivityIndicator size="small" color="#525252" />
                <Text style={styles.listText}>Szukam adresów...</Text>
              </View>
            )}
            {!searching && suggestions.length === 0 && (
              <View style={styles.listItem}>
                <Ionicons name="alert-circle-outline" size={18} color="#A3A3A3" />
                <Text style={styles.listText}>Brak wyników</Text>
              </View>
            )}
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s.id}
                testID={`suggestion-${s.id}`}
                style={styles.listItem}
                onPress={() => pickSuggestion(s)}
              >
                <Ionicons name="location-outline" size={18} color="#525252" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.listText} numberOfLines={1}>{s.short}</Text>
                  <Text style={styles.listSub} numberOfLines={1}>{s.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {pickup && dest && route && (
          <>
            <View style={styles.summary}>
              <View>
                <Text style={styles.summaryLabel}>DYSTANS</Text>
                <Text style={styles.summaryVal}>{distance.toFixed(1)} km</Text>
              </View>
              <View style={styles.vSep} />
              <View>
                <Text style={styles.summaryLabel}>CZAS</Text>
                <Text style={styles.summaryVal}>~{Math.round(route.duration_min)} min</Text>
              </View>
              <View style={styles.vSep} />
              <View>
                <Text style={styles.summaryLabel}>CENA</Text>
                <Text style={[styles.summaryVal, { color: "#0F0F0F" }]}>{price.toFixed(2)} zł</Text>
              </View>
            </View>
            <View style={styles.breakdown} testID="price-breakdown">
              <Text style={styles.breakdownLine}>Opłata: <Text style={styles.breakdownVal}>{BASE_FEE.toFixed(2)} zł</Text></Text>
              <Text style={styles.breakdownDot}>•</Text>
              <Text style={styles.breakdownLine}>{PRICE_PER_KM} zł/km × {distance.toFixed(1)} = <Text style={styles.breakdownVal}>{(distance * PRICE_PER_KM).toFixed(2)} zł</Text></Text>
            </View>
          </>
        )}

        <TouchableOpacity
          testID="order-ride-btn"
          style={[styles.cta, (!pickup || !dest || !route || loading) && { opacity: 0.4 }]}
          disabled={!pickup || !dest || !route || loading}
          onPress={order}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Zamów przejazd</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  mapWrap: { flex: 1.05, backgroundColor: "#E5E5E5" },
  topBar: { position: "absolute", top: Platform.OS === "ios" ? 56 : 40, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  brandPill: { backgroundColor: "#FFD600", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  brandPillText: { fontWeight: "900", color: "#0F0F0F", letterSpacing: 1 },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: Platform.OS === "ios" ? 32 : 22, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: -8 }, elevation: 12 },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: "#E5E5E5", alignSelf: "center", marginBottom: 14 },
  greeting: { color: "#525252", fontSize: 13, fontWeight: "600" },
  h1: { fontSize: 26, fontWeight: "900", color: "#0F0F0F", letterSpacing: -0.5, marginTop: 2, marginBottom: 16 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  dotA: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#FFD600", borderWidth: 2, borderColor: "#0F0F0F" },
  dotB: { width: 12, height: 12, borderRadius: 2, backgroundColor: "#0F0F0F" },
  input: { flex: 1, color: "#0F0F0F", fontSize: 15, fontWeight: "600", paddingVertical: 10 },
  divLine: { height: 1, backgroundColor: "#E5E5E5", marginLeft: 22 },
  list: { maxHeight: 200, marginTop: 8 },
  listItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  listText: { color: "#0F0F0F", fontSize: 14, fontWeight: "600" },
  listSub: { color: "#A3A3A3", fontSize: 11, marginTop: 2 },
  summary: { flexDirection: "row", justifyContent: "space-between", padding: 16, backgroundColor: "#FAFAFA", borderRadius: 14, marginTop: 12, alignItems: "center" },
  summaryLabel: { color: "#525252", fontSize: 10, letterSpacing: 1.4, fontWeight: "700" },
  summaryVal: { color: "#0F0F0F", fontSize: 18, fontWeight: "900", marginTop: 2 },
  vSep: { width: 1, height: 30, backgroundColor: "#E5E5E5" },
  breakdown: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 8, paddingHorizontal: 4 },
  breakdownLine: { color: "#525252", fontSize: 12, fontWeight: "600" },
  breakdownVal: { color: "#0F0F0F", fontWeight: "900" },
  breakdownDot: { color: "#A3A3A3", fontWeight: "900" },
  cta: { marginTop: 16, height: 56, backgroundColor: "#0F0F0F", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", letterSpacing: 0.3 },
});
