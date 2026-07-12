import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import MapView from "../../components/MapView";

export default function DriverRide() {
  const router = useRouter();
  const { authFetch } = useAuth();
  const { t, lang } = useLanguage();
  const [ride, setRide] = useState<any>(null);

  const LABEL: Record<string, string> = {
    accepted: lang === "en" ? "Pick up passenger" : "Jedź po pasażera",
    in_progress: lang === "en" ? "Passenger on board" : "Wieziesz pasażera",
  };

  const load = useCallback(async () => {
    const r = await authFetch("/api/rides/active");
    if (r.ok) {
      const data = await r.json();
      if (!data) {
        router.replace("/driver/home");
      } else {
        setRide(data);
      }
    }
  }, [authFetch, router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 4000);
    return () => clearInterval(i);
  }, [load]);

  const start = async () => {
    await authFetch(`/api/rides/${ride.ride_id}/start`, { method: "POST" });
    load();
  };
  const complete = async () => {
    await authFetch(`/api/rides/${ride.ride_id}/complete`, { method: "POST" });
    Alert.alert(lang === "en" ? "Great!" : "Świetnie!", (lang === "en" ? "Ride completed. +" : "Przejazd zakończony. +") + ride.price_pln + " " + t("common.pln"));
    router.replace("/driver/home");
  };
  const cancel = async () => {
    const msg = t("tracking.cancel_confirm_title");
    const confirmed =
      Platform.OS === "web"
        ? (typeof window !== "undefined" && window.confirm(msg))
        : await new Promise<boolean>((resolve) => {
            Alert.alert(msg, "", [
              { text: t("tracking.cancel_no"), style: "cancel", onPress: () => resolve(false) },
              { text: t("tracking.cancel_yes"), style: "destructive", onPress: () => resolve(true) },
            ]);
          });
    if (!confirmed) return;
    await authFetch(`/api/rides/${ride.ride_id}/cancel`, { method: "POST" });
    router.replace("/driver/home");
  };

  if (!ride) {
    return <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}><ActivityIndicator color="#00E676" /></View>;
  }

  const isAccepted = ride.status === "accepted";

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          dark
          pickup={{ lat: ride.pickup_lat, lng: ride.pickup_lng, label: t("tracking.pickup_label") }}
          destination={{ lat: ride.dest_lat, lng: ride.dest_lng, label: t("tracking.dest_label") }}
        />
        <View style={styles.topBar}>
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>TAXIGO PRO</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.dotLive} />
            <Text style={styles.statusPillText}>{LABEL[ride.status] || ride.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(ride.passenger_name || "P")[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{t("driver.passenger").toUpperCase()}</Text>
            <Text style={styles.name}>{ride.passenger_name}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>{ride.price_pln?.toFixed(2)} {t("common.pln")}</Text>
          </View>
        </View>

        <View style={styles.routeBox}>
          <View style={styles.routeRow}>
            <View style={styles.dotG} />
            <Text numberOfLines={1} style={styles.routeText}>{ride.pickup_address}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.dotW} />
            <Text numberOfLines={1} style={styles.routeText}>{ride.dest_address}</Text>
          </View>
        </View>

        {isAccepted ? (
          <TouchableOpacity testID="start-ride-btn" style={styles.primaryBtn} onPress={start}>
            <Text style={styles.primaryBtnText}>{t("driver.start_ride")}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity testID="complete-ride-btn" style={styles.primaryBtn} onPress={complete}>
            <Text style={styles.primaryBtnText}>{t("driver.complete_ride")}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity testID="d-cancel-btn" style={styles.cancelBtn} onPress={cancel}>
          <Text style={styles.cancelText}>{t("common.cancel")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  mapWrap: { flex: 1, backgroundColor: "#171717" },
  topBar: { position: "absolute", top: Platform.OS === "ios" ? 56 : 40, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandPill: { backgroundColor: "#00E676", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  brandPillText: { fontWeight: "900", color: "#0A0A0A", letterSpacing: 1 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: "#262626" },
  dotLive: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00E676" },
  statusPillText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  panel: { padding: 20, paddingBottom: Platform.OS === "ios" ? 32 : 20, borderTopWidth: 1, borderTopColor: "#262626" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#00E676", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#0A0A0A", fontSize: 22, fontWeight: "900" },
  eyebrow: { color: "#A3A3A3", fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  name: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", marginTop: 2 },
  priceBadge: { backgroundColor: "rgba(0,230,118,0.15)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "rgba(0,230,118,0.4)" },
  priceBadgeText: { color: "#00E676", fontWeight: "900" },
  routeBox: { padding: 14, borderWidth: 1, borderColor: "#262626", borderRadius: 12, marginBottom: 14, backgroundColor: "#171717" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeLine: { width: 1, height: 12, backgroundColor: "#262626", marginLeft: 5, marginVertical: 2 },
  routeText: { flex: 1, color: "#FFFFFF", fontWeight: "500", fontSize: 13 },
  dotG: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#00E676" },
  dotW: { width: 10, height: 10, borderRadius: 2, backgroundColor: "#FFFFFF" },
  primaryBtn: { backgroundColor: "#00E676", height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#0A0A0A", fontSize: 16, fontWeight: "900" },
  cancelBtn: { marginTop: 10, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FF3B30" },
  cancelText: { color: "#FF3B30", fontWeight: "800" },
});
