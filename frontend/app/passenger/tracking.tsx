import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import MapView from "../../components/MapView";
import { useLiveLocation } from "../../hooks/useLiveLocation";
import { ensureSilentSubscription } from "../../src/utils/webpush";

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
  const { user, authFetch } = useAuth();
  const { t, lang } = useLanguage();
  const [ride, setRide] = useState<any>(null);
  const [replyBusy, setReplyBusy] = useState<string | null>(null);
  const [dismissedEventAt, setDismissedEventAt] = useState<string | null>(null);
  const passengerLoc = useLiveLocation(true);

  // Silently link this browser's push subscription to the passenger's user_id
  useEffect(() => {
    if (Platform.OS !== "web" || !user?.user_id) return;
    ensureSilentSubscription("passenger", user.user_id, user.name || "");
  }, [user]);

  const load = useCallback(async () => {
    const r = await authFetch("/api/rides/active");
    if (r.ok) {
      const data = await r.json();
      if (data) {
        setRide(data);
      } else {
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
        ? (typeof window !== "undefined" && window.confirm(t("tracking.cancel_confirm_title") + " " + t("tracking.cancel_confirm_msg")))
        : await new Promise<boolean>((resolve) => {
            Alert.alert(t("tracking.cancel_confirm_title"), t("tracking.cancel_confirm_msg"), [
              { text: t("tracking.cancel_no"), style: "cancel", onPress: () => resolve(false) },
              { text: t("tracking.cancel_yes"), style: "destructive", onPress: () => resolve(true) },
            ]);
          });
    if (!confirmed) return;
    await authFetch(`/api/rides/${ride.ride_id}/cancel`, { method: "POST" });
    router.replace("/passenger/home");
  };

  const sendReply = async (code: "coming" | "two_min" | "cant_see_car") => {
    if (!ride) return;
    setReplyBusy(code);
    try {
      const r = await authFetch(`/api/rides/${ride.ride_id}/passenger-reply`, {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (r.ok) {
        // hide banner after successful reply
        setDismissedEventAt(ride?.last_event?.at || null);
        load();
      }
    } finally {
      setReplyBusy(null);
    }
  };

  if (!ride) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#0F0F0F" />
      </View>
    );
  }

  const driverPos = ride.driver_lat && ride.driver_lng ? { lat: ride.driver_lat, lng: ride.driver_lng, label: t("passenger.driver") } : null;

  const minutesLabel = (min: number) => {
    if (lang === "en") return `${min} min`;
    if (min === 1) return `1 minutę`;
    if (min < 5) return `${min} minuty`;
    return `${min} minut`;
  };

  let etaText = "—";
  if (driverPos) {
    if (ride.status === "accepted") {
      const km = haversine(driverPos, { lat: ride.pickup_lat, lng: ride.pickup_lng });
      const min = Math.max(1, Math.round(km / 0.5));
      etaText = `${t("tracking.eta_in")} ${minutesLabel(min)}`;
    } else if (ride.status === "in_progress") {
      const km = haversine(driverPos, { lat: ride.dest_lat, lng: ride.dest_lng });
      const min = Math.max(1, Math.round(km / 0.5));
      etaText = `${t("tracking.eta_to_dest")}${min} min`;
    }
  } else if (ride.status === "accepted") {
    etaText = `${t("tracking.eta_in")} ${minutesLabel(3)}`;
  } else if (ride.status === "in_progress") {
    etaText = `${t("tracking.eta_to_dest")}8 min`;
  }

  const statusKey = `tracking.status.${ride.status}` as any;
  const statusVal = t(statusKey);
  const statusText = statusVal === statusKey ? ride.status : statusVal;

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          pickup={{ lat: ride.pickup_lat, lng: ride.pickup_lng, label: t("tracking.pickup_label") }}
          destination={{ lat: ride.dest_lat, lng: ride.dest_lng, label: t("tracking.dest_label") }}
          drivers={[
            ...(driverPos ? [driverPos] : []),
            ...(passengerLoc ? [{ lat: passengerLoc.lat, lng: passengerLoc.lng, label: t("tracking.you") }] : []),
          ]}
        />
        <View style={styles.topBar}>
          <TouchableOpacity testID="back-home-btn" style={styles.iconBtn} onPress={() => router.replace("/passenger/home")}>
            <Ionicons name="chevron-back" size={22} color="#0F0F0F" />
          </TouchableOpacity>
          <View style={styles.statusPill}>
            <View style={[styles.dotLive, ride.status === "pending" && { backgroundColor: "#FFD600" }]} />
            <Text style={styles.statusPillText} testID="ride-status">{statusText}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Driver-arrived banner with quick reply buttons */}
        {ride.last_event && (ride.last_event.kind === "driver_arrived" || ride.last_event.kind === "driver_cannot_find") && ride.last_event.at !== dismissedEventAt ? (
          <View style={styles.arrivalBanner} testID="arrival-banner">
            <View style={styles.arrivalHeader}>
              <View style={styles.arrivalIconWrap}>
                <Ionicons name={ride.last_event.kind === "driver_arrived" ? "car-sport" : "search"} size={22} color="#0F0F0F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.arrivalTitle}>
                  {ride.last_event.kind === "driver_arrived"
                    ? (lang === "en" ? "Your driver has arrived!" : "Kierowca dojechał!")
                    : (lang === "en" ? "Driver is looking for you" : "Kierowca Cię szuka")}
                </Text>
                <Text style={styles.arrivalSub}>
                  {ride.last_event.kind === "driver_arrived"
                    ? (lang === "en" ? "Head out to the car" : "Wyjdź do samochodu")
                    : (lang === "en" ? "Please show yourself" : "Pokaż się kierowcy")}
                </Text>
              </View>
            </View>
            <View style={styles.replyRow}>
              <TouchableOpacity
                testID="reply-coming"
                style={[styles.replyBtn, styles.replyBtnPrimary, replyBusy === "coming" && { opacity: 0.6 }]}
                onPress={() => sendReply("coming")}
                disabled={replyBusy !== null}
              >
                <Text style={styles.replyBtnTextPrimary}>{replyBusy === "coming" ? "..." : (lang === "en" ? "✅ Coming" : "✅ Już schodzę")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="reply-two-min"
                style={[styles.replyBtn, styles.replyBtnSecondary, replyBusy === "two_min" && { opacity: 0.6 }]}
                onPress={() => sendReply("two_min")}
                disabled={replyBusy !== null}
              >
                <Text style={styles.replyBtnTextSecondary}>{replyBusy === "two_min" ? "..." : (lang === "en" ? "⏳ 2 min" : "⏳ Daj 2 min")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="reply-cant-see"
                style={[styles.replyBtn, styles.replyBtnSecondary, replyBusy === "cant_see_car" && { opacity: 0.6 }]}
                onPress={() => sendReply("cant_see_car")}
                disabled={replyBusy !== null}
              >
                <Text style={styles.replyBtnTextSecondary}>{replyBusy === "cant_see_car" ? "..." : (lang === "en" ? "🚗 Can't see car" : "🚗 Nie widzę auta")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {ride.status === "pending" ? (
          <View style={styles.searchBox}>
            <ActivityIndicator color="#0F0F0F" />
            <Text style={styles.searchText}>{t("tracking.searching_best")}</Text>
          </View>
        ) : (
          <>
            <View style={styles.driverRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(ride.driver_name || "K")[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{ride.driver_name || t("passenger.driver")}</Text>
                <Text style={styles.driverSub}>{ride.driver_car || t("tracking.vehicle")} • {ride.driver_plate || "—"}</Text>
              </View>
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color="#FFD600" />
                <Text style={styles.ratingText}>5.0</Text>
              </View>
            </View>

            <View style={styles.etaBox}>
              <Text style={styles.etaLabel}>{t("tracking.eta_label")}</Text>
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
          <Text style={styles.priceLabel}>{t("tracking.to_pay")}</Text>
          <Text style={styles.priceVal}>{ride.price_pln?.toFixed(2)} {t("common.pln")}</Text>
        </View>

        <TouchableOpacity testID="cancel-ride-btn" style={styles.cancelBtn} onPress={cancel}>
          <Text style={styles.cancelText}>{t("passenger.cancel_ride")}</Text>
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
  arrivalBanner: { backgroundColor: "#FFD600", borderRadius: 16, padding: 14, marginBottom: 14, gap: 10 },
  arrivalHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  arrivalIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  arrivalTitle: { color: "#0F0F0F", fontSize: 16, fontWeight: "900" },
  arrivalSub: { color: "#0F0F0F", fontSize: 12, fontWeight: "600", marginTop: 2 },
  replyRow: { flexDirection: "row", gap: 8 },
  replyBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  replyBtnPrimary: { backgroundColor: "#0F0F0F" },
  replyBtnSecondary: { backgroundColor: "rgba(15,15,15,0.08)", borderWidth: 1, borderColor: "rgba(15,15,15,0.15)" },
  replyBtnTextPrimary: { color: "#FFD600", fontSize: 12, fontWeight: "900" },
  replyBtnTextSecondary: { color: "#0F0F0F", fontSize: 12, fontWeight: "800" },
});
