import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, ActivityIndicator, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import MapView from "../../components/MapView";
import { searchAddress, getRoute, reverseGeocode, GeoSuggestion, RouteResult } from "../../services/mapbox";
import { useLiveLocation } from "../../hooks/useLiveLocation";

type Place = { name: string; lat: number; lng: number };
type Reservation = {
  id: string;
  pickup: Place;
  dest: Place;
  distance_km: number;
  price_pln: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  name: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
};

export default function PassengerHome() {
  const router = useRouter();
  const { user, authFetch, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
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
  const [autoPickupDone, setAutoPickupDone] = useState(false);
  const debounceRef = useRef<any>(null);
  const myLoc = useLiveLocation(true);

  // Reservation modal state
  const [resvOpen, setResvOpen] = useState(false);
  const [resvDate, setResvDate] = useState("");
  const [resvTime, setResvTime] = useState("");
  const [resvName, setResvName] = useState("");
  const [resvPhone, setResvPhone] = useState("");
  const [resvEmail, setResvEmail] = useState("");
  const [resvNotes, setResvNotes] = useState("");
  const [resvSaving, setResvSaving] = useState(false);

  // Auto-fill pickup with current GPS location (only once on first GPS fix)
  useEffect(() => {
    if (autoPickupDone || pickup || !myLoc) return;
    (async () => {
      const addr = await reverseGeocode(myLoc.lat, myLoc.lng);
      if (addr) {
        setPickup({ name: addr.name, lat: addr.lat, lng: addr.lng });
      } else {
        setPickup({ name: lang === "en" ? "Your current location" : "Twoja aktualna lokalizacja", lat: myLoc.lat, lng: myLoc.lng });
      }
      setAutoPickupDone(true);
      setActiveField("dest");
    })();
  }, [myLoc, pickup, autoPickupDone, lang]);

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
    if (!pickup || !dest || !route) return Alert.alert(t("passenger.err_missing_data"), t("passenger.err_missing_data_msg"));
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
      Alert.alert(t("common.error"), t("passenger.err_order_failed"));
    }
  };

  const openReservation = () => {
    if (!pickup || !dest || !route) {
      Alert.alert(t("reservation.err_no_route"), t("reservation.err_no_route_msg"));
      return;
    }
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    const yyyy = tm.getFullYear();
    const mm = String(tm.getMonth() + 1).padStart(2, "0");
    const dd = String(tm.getDate()).padStart(2, "0");
    setResvDate(`${yyyy}-${mm}-${dd}`);
    setResvTime("10:00");
    setResvName(user?.name || "");
    setResvPhone("");
    setResvEmail(user?.email || "");
    setResvNotes("");
    setResvOpen(true);
  };

  const saveReservation = async () => {
    if (!pickup || !dest || !route) return;
    if (!resvDate || !resvTime) {
      Alert.alert(t("reservation.err_missing"), t("reservation.err_datetime"));
      return;
    }
    if (!resvName.trim() || !resvPhone.trim()) {
      Alert.alert(t("reservation.err_missing"), t("reservation.err_contact"));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(resvDate)) {
      Alert.alert(t("reservation.err_date_format"), t("reservation.err_date_format_msg"));
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(resvTime)) {
      Alert.alert(t("reservation.err_time_format"), t("reservation.err_time_format_msg"));
      return;
    }
    const resv: Reservation = {
      id: `rsv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      pickup,
      dest,
      distance_km: Math.round(distance * 10) / 10,
      price_pln: Math.round(price * 100) / 100,
      date: resvDate,
      time: resvTime,
      name: resvName.trim(),
      phone: resvPhone.trim(),
      email: resvEmail.trim(),
      notes: resvNotes.trim(),
      createdAt: new Date().toISOString(),
    };
    setResvSaving(true);
    try {
      // 1) Store locally
      const existing = await AsyncStorage.getItem("passenger_reservations");
      const list: Reservation[] = existing ? JSON.parse(existing) : [];
      list.unshift(resv);
      await AsyncStorage.setItem("passenger_reservations", JSON.stringify(list));

      // 2) Send to backend for email confirmation (non-blocking)
      let emailSent = false;
      try {
        const r = await authFetch("/api/rides/reservations", {
          method: "POST",
          body: JSON.stringify({ ...resv, lang }),
        });
        if (r.ok) {
          const data = await r.json();
          emailSent = data?.email_sent === true;
        }
      } catch { /* backend not required */ }

      setResvOpen(false);
      const savedMsg = t("reservation.saved_msg").replace("{phone}", resv.phone);
      const details = `\n\n📅 ${resv.date} • ${resv.time}\n📍 ${resv.pickup.name}\n➡️ ${resv.dest.name}\n💰 ${resv.price_pln.toFixed(2)} ${t("common.pln")}${emailSent ? `\n\n${t("reservation.email_sent")}` : ""}`;
      Alert.alert(t("reservation.saved_title"), savedMsg + details, [{ text: t("common.ok") }]);
    } finally {
      setResvSaving(false);
    }
  };

  const driverMarkers = drivers
    .filter((d) => d.last_lat && d.last_lng)
    .map((d) => ({ lat: d.last_lat, lng: d.last_lng, label: t("passenger.driver") }));

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
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => setLang(lang === "pl" ? "en" : "pl")}
              testID="lang-toggle"
            >
              <Text style={styles.langBtnText}>{lang === "pl" ? "EN" : "PL"}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="history-btn" style={styles.iconBtn} onPress={() => router.push("/passenger/history")}>
              <Ionicons name="time-outline" size={20} color="#0F0F0F" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.greeting}>{t("passenger.hello")}, {user?.name?.split(" ")[0] || t("passenger.traveller")} 👋</Text>
        <Text style={styles.h1}>{t("passenger.where_to")}</Text>

        <View style={styles.routeRow}>
          <View style={styles.dotA} />
          <TextInput
            testID="pickup-input"
            value={pickupQ || pickup?.name || ""}
            onChangeText={(tt) => { setPickupQ(tt); setPickup(null); setActiveField("pickup"); }}
            onFocus={() => setActiveField("pickup")}
            placeholder={t("passenger.where_from")}
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
            onChangeText={(tt) => { setDestQ(tt); setDest(null); setActiveField("dest"); }}
            onFocus={() => setActiveField("dest")}
            placeholder={t("passenger.where_to")}
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
                <Text style={styles.listText}>{t("passenger.searching_addresses")}</Text>
              </View>
            )}
            {!searching && suggestions.length === 0 && (
              <View style={styles.listItem}>
                <Ionicons name="alert-circle-outline" size={18} color="#A3A3A3" />
                <Text style={styles.listText}>{t("passenger.no_results")}</Text>
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
                <Text style={styles.summaryLabel}>{t("passenger.distance")}</Text>
                <Text style={styles.summaryVal}>{distance.toFixed(1)} km</Text>
              </View>
              <View style={styles.vSep} />
              <View>
                <Text style={styles.summaryLabel}>{t("passenger.time")}</Text>
                <Text style={styles.summaryVal}>~{Math.round(route.duration_min)} min</Text>
              </View>
              <View style={styles.vSep} />
              <View>
                <Text style={styles.summaryLabel}>{t("passenger.price")}</Text>
                <Text style={[styles.summaryVal, { color: "#0F0F0F" }]}>{price.toFixed(2)} {t("common.pln")}</Text>
              </View>
            </View>
            <View style={styles.breakdown} testID="price-breakdown">
              <Text style={styles.breakdownLine}>{t("passenger.fee")}: <Text style={styles.breakdownVal}>{BASE_FEE.toFixed(2)} {t("common.pln")}</Text></Text>
              <Text style={styles.breakdownDot}>•</Text>
              <Text style={styles.breakdownLine}>{PRICE_PER_KM} {t("common.pln")}/km × {distance.toFixed(1)} = <Text style={styles.breakdownVal}>{(distance * PRICE_PER_KM).toFixed(2)} {t("common.pln")}</Text></Text>
            </View>
          </>
        )}

        <View style={styles.ctaRow}>
          <TouchableOpacity
            testID="reserve-ride-btn"
            style={[styles.ctaSecondary, (!pickup || !dest || !route) && { opacity: 0.4 }]}
            disabled={!pickup || !dest || !route}
            onPress={openReservation}
          >
            <Ionicons name="calendar-outline" size={18} color="#0F0F0F" />
            <Text style={styles.ctaSecondaryText}>{t("passenger.reserve")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="order-ride-btn"
            style={[styles.cta, styles.ctaGrow, (!pickup || !dest || !route || loading) && { opacity: 0.4 }]}
            disabled={!pickup || !dest || !route || loading}
            onPress={order}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{t("passenger.order_ride")}</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Reservation Modal */}
      <Modal visible={resvOpen} transparent animationType="slide" onRequestClose={() => setResvOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("reservation.title")}</Text>
              <TouchableOpacity onPress={() => setResvOpen(false)}>
                <Ionicons name="close" size={26} color="#0F0F0F" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 500 }} keyboardShouldPersistTaps="handled">
              <View style={styles.resvSummary}>
                <Text style={styles.resvSummaryLine}>📍 <Text style={styles.b}>{t("reservation.pickup_label")}:</Text> {pickup?.name}</Text>
                <Text style={styles.resvSummaryLine}>➡️ <Text style={styles.b}>{t("reservation.dest_label")}:</Text> {dest?.name}</Text>
                <Text style={styles.resvSummaryLine}>💰 <Text style={styles.b}>{t("reservation.price_label")}:</Text> {price.toFixed(2)} {t("common.pln")} ({distance.toFixed(1)} km)</Text>
              </View>

              <View style={styles.resvRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resvLabel}>{t("reservation.date")}</Text>
                  <TextInput
                    style={styles.resvInput}
                    value={resvDate}
                    onChangeText={setResvDate}
                    placeholder="2026-06-15"
                    placeholderTextColor="#A3A3A3"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resvLabel}>{t("reservation.time")}</Text>
                  <TextInput
                    style={styles.resvInput}
                    value={resvTime}
                    onChangeText={setResvTime}
                    placeholder="10:00"
                    placeholderTextColor="#A3A3A3"
                  />
                </View>
              </View>

              <Text style={styles.resvLabel}>{t("reservation.name")}</Text>
              <TextInput
                style={styles.resvInput}
                value={resvName}
                onChangeText={setResvName}
                placeholder="Jan Kowalski"
                placeholderTextColor="#A3A3A3"
              />

              <Text style={styles.resvLabel}>{t("reservation.phone")}</Text>
              <TextInput
                style={styles.resvInput}
                value={resvPhone}
                onChangeText={setResvPhone}
                placeholder="+48 500 100 200"
                placeholderTextColor="#A3A3A3"
                keyboardType="phone-pad"
              />

              <Text style={styles.resvLabel}>{t("reservation.email")}</Text>
              <TextInput
                style={styles.resvInput}
                value={resvEmail}
                onChangeText={setResvEmail}
                placeholder="jan@example.com"
                placeholderTextColor="#A3A3A3"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.resvLabel}>{t("reservation.notes")}</Text>
              <TextInput
                style={[styles.resvInput, { height: 80, textAlignVertical: "top" }]}
                value={resvNotes}
                onChangeText={setResvNotes}
                placeholder={t("reservation.notes_ph")}
                placeholderTextColor="#A3A3A3"
                multiline
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.resvSaveBtn, resvSaving && { opacity: 0.6 }]}
              onPress={saveReservation}
              disabled={resvSaving}
              testID="save-reservation-btn"
            >
              {resvSaving ? <ActivityIndicator color="#0F0F0F" /> : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#0F0F0F" />
                  <Text style={styles.resvSaveText}>{t("reservation.save")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  mapWrap: { flex: 1.05, backgroundColor: "#E5E5E5" },
  topBar: { position: "absolute", top: Platform.OS === "ios" ? 56 : 40, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  langBtn: { height: 36, minWidth: 44, paddingHorizontal: 10, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", alignSelf: "center" },
  langBtnText: { color: "#0F0F0F", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
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
  ctaRow: { flexDirection: "row", gap: 10, marginTop: 16, alignItems: "stretch" },
  ctaGrow: { flex: 2, marginTop: 0 },
  ctaSecondary: { flex: 1, height: 56, borderRadius: 14, backgroundColor: "#FFD600", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 2, borderColor: "#0F0F0F" },
  ctaSecondaryText: { color: "#0F0F0F", fontSize: 15, fontWeight: "900" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: Platform.OS === "ios" ? 40 : 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#0F0F0F" },
  resvSummary: { backgroundColor: "#FAFAFA", borderRadius: 12, padding: 12, marginBottom: 14, gap: 4 },
  resvSummaryLine: { fontSize: 13, color: "#0F0F0F" },
  b: { fontWeight: "700" },
  resvRow: { flexDirection: "row", alignItems: "flex-start" },
  resvLabel: { fontSize: 12, color: "#525252", fontWeight: "700", marginTop: 12, marginBottom: 4, letterSpacing: 0.3 },
  resvInput: { borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: "#0F0F0F", backgroundColor: "#fff" },
  resvSaveBtn: { marginTop: 20, height: 54, borderRadius: 14, backgroundColor: "#FFD600", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 2, borderColor: "#0F0F0F" },
  resvSaveText: { color: "#0F0F0F", fontSize: 16, fontWeight: "900" },
});
