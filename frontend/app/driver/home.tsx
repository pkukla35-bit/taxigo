import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Switch, Alert, TextInput, Modal, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import MapView from "../../components/MapView";
import { useLiveLocation } from "../../hooks/useLiveLocation";

const DEFAULT_LOC = { lat: 50.0617, lng: 19.9373 };

type Reservation = {
  reservation_id: string;
  pickup: { name: string; lat: number; lng: number };
  dest: { name: string; lat: number; lng: number };
  distance_km: number;
  price_pln: number;
  date: string;
  time: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  status: string;
  driver_name?: string;
  created_at?: string;
};

export default function DriverHome() {
  const router = useRouter();
  const { user, authFetch, logout, setRole } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [tab, setTab] = useState<"now" | "resv">("now");
  const [online, setOnline] = useState(false);
  const [pending, setPending] = useState<any[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [busyResvId, setBusyResvId] = useState<string | null>(null);
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [car, setCar] = useState("");
  const [plate, setPlate] = useState("");
  const live = useLiveLocation(online);

  useEffect(() => {
    if (!online || !live) return;
    const send = async () => {
      try {
        await authFetch("/api/driver/online", {
          method: "POST",
          body: JSON.stringify({ is_online: true, lat: live.lat, lng: live.lng }),
        });
      } catch {}
    };
    send();
    const i = setInterval(send, 10000);
    return () => clearInterval(i);
  }, [online, live, authFetch]);

  useEffect(() => {
    if (user && (!user.car_model || !user.plate)) {
      setSetupOpen(true);
      setCar(user.car_model || "Toyota Prius Biała");
      setPlate(user.plate || "KR9KF93");
    }
    setOnline(!!user?.is_online);
  }, [user]);

  const loadPending = useCallback(async () => {
    const r = await authFetch("/api/rides/pending");
    if (r.ok) setPending(await r.json());
  }, [authFetch]);

  const loadReservations = useCallback(async () => {
    try {
      const r = await authFetch("/api/rides/reservations");
      if (r.ok) setReservations(await r.json());
    } catch { /* ignore */ }
  }, [authFetch]);

  const confirmReservation = async (resv: Reservation) => {
    setBusyResvId(resv.reservation_id);
    try {
      const r = await authFetch(`/api/rides/reservations/${resv.reservation_id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ lang }),
      });
      if (r.ok) {
        Alert.alert(t("driver.resv_confirm_success"), `📅 ${resv.date} • ${resv.time}\n📍 ${resv.pickup.name}\n➡️ ${resv.dest.name}\n📞 ${resv.phone}`);
        loadReservations();
      } else {
        const data = await r.json().catch(() => ({}));
        Alert.alert(t("common.error"), data.detail || "Failed");
      }
    } finally {
      setBusyResvId(null);
    }
  };

  const rejectReservation = async (resv: Reservation) => {
    const confirmed = Platform.OS === "web"
      ? (typeof window !== "undefined" && window.confirm(t("driver.resv_reject_confirm")))
      : await new Promise<boolean>((resolve) => {
          Alert.alert(t("driver.resv_reject_confirm"), "", [
            { text: t("tracking.cancel_no"), style: "cancel", onPress: () => resolve(false) },
            { text: t("tracking.cancel_yes"), style: "destructive", onPress: () => resolve(true) },
          ]);
        });
    if (!confirmed) return;
    setBusyResvId(resv.reservation_id);
    try {
      await authFetch(`/api/rides/reservations/${resv.reservation_id}/reject`, { method: "POST" });
      loadReservations();
    } finally {
      setBusyResvId(null);
    }
  };

  const callPassenger = (phone: string) => {
    if (!phone) return;
    const url = `tel:${phone.replace(/\s/g, "")}`;
    Linking.openURL(url).catch(() => {});
  };

  const loadActive = useCallback(async () => {
    const r = await authFetch("/api/rides/active");
    if (r.ok) {
      const data = await r.json();
      setActive(data || null);
    }
  }, [authFetch]);

  useEffect(() => {
    loadActive();
    if (online && !active) {
      loadPending();
      loadReservations();
      const i = setInterval(() => { loadPending(); loadReservations(); }, 5000);
      return () => clearInterval(i);
    }
  }, [online, active, loadPending, loadActive, loadReservations]);

  // Load reservations even when offline (drivers can see & confirm anytime)
  useEffect(() => {
    loadReservations();
    const i = setInterval(loadReservations, 30000);
    return () => clearInterval(i);
  }, [loadReservations]);

  useEffect(() => {
    const i = setInterval(loadActive, 4000);
    return () => clearInterval(i);
  }, [loadActive]);

  const toggleOnline = async (v: boolean) => {
    setLoading(true);
    const r = await authFetch("/api/driver/online", {
      method: "POST",
      body: JSON.stringify({ is_online: v, lat: DEFAULT_LOC.lat, lng: DEFAULT_LOC.lng }),
    });
    setLoading(false);
    if (r.ok) setOnline(v);
  };

  const accept = async (ride_id: string) => {
    const r = await authFetch(`/api/rides/${ride_id}/accept`, { method: "POST" });
    if (r.ok) {
      const data = await r.json();
      setActive(data);
      router.push("/driver/ride");
    }
  };

  const saveSetup = async () => {
    if (!car.trim() || !plate.trim()) return Alert.alert(t("driver.err_setup_title"), t("driver.err_setup"));
    await setRole("driver", car.trim(), plate.trim().toUpperCase());
    setSetupOpen(false);
  };

  useEffect(() => {
    // If the driver has an accepted/in-progress ride, offer to go back — but do NOT auto-redirect.
    // Auto-redirect caused an infinite loop when /driver/ride bailed out on load errors.
    // Handled via a visible banner instead (rendered below).
  }, [active, router]);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView dark center={live || DEFAULT_LOC} drivers={online && live ? [{ lat: live.lat, lng: live.lng, label: t("passenger.driver") }] : []} />
        <View style={styles.topBar}>
          <TouchableOpacity testID="d-logout" style={styles.iconBtn} onPress={() => { logout(); router.replace("/"); }}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>TAXIGO PRO</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === "pl" ? "en" : "pl")}>
              <Text style={styles.langBtnText}>{lang === "pl" ? "EN" : "PL"}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="d-history" style={styles.iconBtn} onPress={() => router.push("/driver/history")}>
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        {/* Active ride banner — visible whenever driver has an accepted/in_progress ride */}
        {active && (active.status === "accepted" || active.status === "in_progress") ? (
          <TouchableOpacity
            testID="active-ride-banner"
            style={styles.activeBanner}
            onPress={() => router.push("/driver/ride")}
            activeOpacity={0.85}
          >
            <View style={styles.activeBannerIcon}>
              <Ionicons name="car-sport" size={22} color="#0A0A0A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeBannerTitle}>
                {lang === "en" ? "You have an active ride" : "Masz aktywny przejazd"}
              </Text>
              <Text style={styles.activeBannerSub} numberOfLines={1}>
                {active.pickup_address} → {active.dest_address}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#0A0A0A" />
          </TouchableOpacity>
        ) : null}

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.eyebrow}>{t("driver.status")}</Text>
            <Text style={[styles.status, { color: online ? "#00E676" : "#FF3B30" }]} testID="driver-status-text">
              {online ? t("driver.you_are_online") : t("driver.you_are_offline")}
            </Text>
            <Text style={styles.statusSub}>{user?.name} {user?.plate ? `• ${user.plate}` : ""}</Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#00E676" />
          ) : (
            <Switch
              testID="online-toggle"
              value={online}
              onValueChange={toggleOnline}
              trackColor={{ true: "#00E676", false: "#262626" }}
              thumbColor="#FFFFFF"
            />
          )}
        </View>

        <View style={styles.divider} />

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "now" && styles.tabBtnActive]}
            onPress={() => setTab("now")}
            testID="tab-now"
          >
            <Text style={[styles.tabText, tab === "now" && styles.tabTextActive]}>{t("driver.tab_now")}</Text>
            {pending.length > 0 && <View style={styles.badgeDot}><Text style={styles.badgeDotText}>{pending.length}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "resv" && styles.tabBtnActive]}
            onPress={() => setTab("resv")}
            testID="tab-resv"
          >
            <Text style={[styles.tabText, tab === "resv" && styles.tabTextActive]}>{t("driver.tab_reservations")}</Text>
            {reservations.filter((r) => r.status === "pending").length > 0 && (
              <View style={styles.badgeDot}><Text style={styles.badgeDotText}>{reservations.filter((r) => r.status === "pending").length}</Text></View>
            )}
          </TouchableOpacity>
        </View>

        {tab === "now" ? (
          <>
            <Text style={styles.h2}>{online ? t("driver.available_rides") : t("driver.turn_on_hint")}</Text>
            {!online ? (
              <View style={styles.offlineBox}>
                <Ionicons name="moon-outline" size={28} color="#A3A3A3" />
                <Text style={styles.offlineText}>{t("driver.offline_msg")}</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 260 }}>
                {pending.length === 0 ? (
                  <View style={styles.offlineBox}>
                    <ActivityIndicator color="#00E676" />
                    <Text style={styles.offlineText}>{t("driver.waiting")}</Text>
                  </View>
                ) : (
                  pending.map((r) => (
                    <View key={r.ride_id} style={styles.rideCard} testID={`pending-${r.ride_id}`}>
                      <View style={styles.rideTop}>
                        <View>
                          <Text style={styles.passenger}>{r.passenger_name}</Text>
                          <Text style={styles.km}>{r.distance_km?.toFixed?.(1)} km</Text>
                        </View>
                        <View style={styles.priceBadge}>
                          <Text style={styles.priceBadgeText}>{r.price_pln?.toFixed(2)} {t("common.pln")}</Text>
                        </View>
                      </View>
                      <View style={styles.routeRow}>
                        <View style={styles.dotG} />
                        <Text numberOfLines={1} style={styles.routeText}>{r.pickup_address}</Text>
                      </View>
                      <View style={styles.routeLine} />
                      <View style={styles.routeRow}>
                        <View style={styles.dotW} />
                        <Text numberOfLines={1} style={styles.routeText}>{r.dest_address}</Text>
                      </View>
                      <TouchableOpacity
                        testID={`accept-${r.ride_id}`}
                        style={styles.acceptBtn}
                        onPress={() => accept(r.ride_id)}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#0A0A0A" />
                        <Text style={styles.acceptText}>{t("driver.accept")}</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </>
        ) : (
          <ScrollView style={{ maxHeight: 340 }}>
            {reservations.length === 0 ? (
              <View style={styles.offlineBox}>
                <Ionicons name="calendar-outline" size={28} color="#A3A3A3" />
                <Text style={styles.offlineText}>{t("driver.no_reservations")}</Text>
              </View>
            ) : (
              reservations.map((r) => {
                const isConfirmed = r.status === "confirmed";
                const isPending = r.status === "pending";
                const isBusy = busyResvId === r.reservation_id;
                return (
                  <View key={r.reservation_id} style={styles.resvCard} testID={`resv-${r.reservation_id}`}>
                    <View style={styles.resvTopRow}>
                      <View style={styles.resvDateBox}>
                        <Text style={styles.resvDate}>{r.date}</Text>
                        <Text style={styles.resvTime}>{r.time}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.resvName}>{r.name}</Text>
                        <Text style={styles.resvPrice}>{r.price_pln?.toFixed(2)} {t("common.pln")} • {r.distance_km?.toFixed(1)} km</Text>
                      </View>
                      <View style={[styles.statusBadge, isConfirmed ? styles.statusConfirmed : (isPending ? styles.statusPending : styles.statusRejected)]}>
                        <Text style={[styles.statusText, isConfirmed && { color: "#0A0A0A" }]}>
                          {isConfirmed ? t("driver.resv_status_confirmed") : (isPending ? t("driver.resv_status_pending") : t("driver.resv_status_rejected"))}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.resvRoute}>
                      <View style={styles.routeRow}>
                        <View style={styles.dotG} />
                        <Text numberOfLines={1} style={styles.routeText}>{r.pickup?.name}</Text>
                      </View>
                      <View style={styles.routeLine} />
                      <View style={styles.routeRow}>
                        <View style={styles.dotW} />
                        <Text numberOfLines={1} style={styles.routeText}>{r.dest?.name}</Text>
                      </View>
                    </View>

                    {r.notes ? (
                      <Text style={styles.resvNotes} numberOfLines={2}>📝 {r.notes}</Text>
                    ) : null}

                    <View style={styles.resvActions}>
                      <TouchableOpacity
                        style={[styles.resvBtn, styles.resvCallBtn]}
                        onPress={() => callPassenger(r.phone)}
                        testID={`call-${r.reservation_id}`}
                      >
                        <Ionicons name="call-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.resvCallText}>{r.phone}</Text>
                      </TouchableOpacity>
                      {isPending && (
                        <>
                          <TouchableOpacity
                            style={[styles.resvBtn, styles.resvRejectBtn, isBusy && { opacity: 0.4 }]}
                            onPress={() => rejectReservation(r)}
                            disabled={isBusy}
                            testID={`reject-${r.reservation_id}`}
                          >
                            <Ionicons name="close" size={18} color="#FF3B30" />
                            <Text style={styles.resvRejectText}>{t("driver.resv_reject")}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.resvBtn, styles.resvConfirmBtn, isBusy && { opacity: 0.4 }]}
                            onPress={() => confirmReservation(r)}
                            disabled={isBusy}
                            testID={`confirm-${r.reservation_id}`}
                          >
                            {isBusy ? <ActivityIndicator color="#0A0A0A" size="small" /> : (
                              <>
                                <Ionicons name="checkmark-circle" size={18} color="#0A0A0A" />
                                <Text style={styles.resvConfirmText}>{t("driver.resv_confirm")}</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      <Modal visible={setupOpen} transparent animationType="slide" onRequestClose={() => {}}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.eyebrow}>{t("driver.car_config")}</Text>
            <Text style={styles.modalTitle}>{t("driver.setup_title")}</Text>
            <Text style={styles.modalSub}>{t("driver.setup_sub")}</Text>
            <Text style={styles.label}>{t("driver.car_model")}</Text>
            <TextInput testID="car-input" value={car} onChangeText={setCar} placeholder={t("driver.car_ph")} placeholderTextColor="#525252" style={styles.modalInput} />
            <Text style={styles.label}>{t("driver.plate")}</Text>
            <TextInput testID="plate-input" value={plate} onChangeText={setPlate} placeholder={t("driver.plate_ph")} placeholderTextColor="#525252" autoCapitalize="characters" style={styles.modalInput} />
            <TouchableOpacity testID="save-vehicle-btn" style={styles.saveBtn} onPress={saveSetup}>
              <Text style={styles.saveText}>{t("driver.save_start")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  mapWrap: { flex: 1, backgroundColor: "#171717" },
  topBar: { position: "absolute", top: Platform.OS === "ios" ? 56 : 40, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  langBtn: { height: 36, minWidth: 44, paddingHorizontal: 10, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignSelf: "center" },
  langBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  brandPill: { backgroundColor: "#00E676", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  brandPillText: { fontWeight: "900", color: "#0A0A0A", letterSpacing: 1 },
  panel: { backgroundColor: "#0A0A0A", padding: 20, paddingBottom: Platform.OS === "ios" ? 32 : 20, borderTopWidth: 1, borderTopColor: "#262626" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { color: "#A3A3A3", fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  status: { fontSize: 22, fontWeight: "900", marginTop: 4 },
  statusSub: { color: "#A3A3A3", fontSize: 12, marginTop: 4, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#262626", marginVertical: 16 },
  h2: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  offlineBox: { padding: 20, alignItems: "center", gap: 10, backgroundColor: "#171717", borderRadius: 12, borderWidth: 1, borderColor: "#262626" },
  offlineText: { color: "#A3A3A3", fontSize: 13, fontWeight: "600", textAlign: "center" },
  rideCard: { backgroundColor: "#171717", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#262626" },
  rideTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  passenger: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  km: { color: "#A3A3A3", fontSize: 12, marginTop: 2, fontWeight: "600" },
  priceBadge: { backgroundColor: "rgba(0,230,118,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(0,230,118,0.4)" },
  priceBadgeText: { color: "#00E676", fontWeight: "900" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeLine: { width: 1, height: 12, backgroundColor: "#262626", marginLeft: 5, marginVertical: 2 },
  routeText: { flex: 1, color: "#FFFFFF", fontSize: 13, fontWeight: "500" },
  dotG: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#00E676" },
  dotW: { width: 10, height: 10, borderRadius: 2, backgroundColor: "#FFFFFF" },
  acceptBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: "#00E676", paddingVertical: 14, borderRadius: 12, marginTop: 12 },
  acceptText: { color: "#0A0A0A", fontWeight: "900", fontSize: 15 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#0A0A0A", padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: "#262626" },
  modalTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", marginTop: 4 },
  modalSub: { color: "#A3A3A3", marginTop: 4, marginBottom: 18 },
  label: { color: "#A3A3A3", fontSize: 11, letterSpacing: 1.4, fontWeight: "700", marginBottom: 8, marginTop: 6 },
  modalInput: { backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626", borderRadius: 12, padding: 14, color: "#FFFFFF", fontSize: 15, fontWeight: "600", marginBottom: 8 },
  saveBtn: { marginTop: 16, height: 54, backgroundColor: "#00E676", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#0A0A0A", fontWeight: "900", fontSize: 16 },

  // Tabs
  tabsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  tabBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: "#171717", borderWidth: 1, borderColor: "#262626" },
  tabBtnActive: { backgroundColor: "#00E676", borderColor: "#00E676" },
  tabText: { color: "#A3A3A3", fontWeight: "800", fontSize: 13 },
  tabTextActive: { color: "#0A0A0A" },
  badgeDot: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: "#FF3B30", paddingHorizontal: 5, alignItems: "center", justifyContent: "center" },
  badgeDotText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },

  // Reservation cards
  resvCard: { backgroundColor: "#171717", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#262626" },
  resvTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  resvDateBox: { backgroundColor: "#00E676", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, alignItems: "center", minWidth: 70 },
  resvDate: { color: "#0A0A0A", fontSize: 11, fontWeight: "900" },
  resvTime: { color: "#0A0A0A", fontSize: 14, fontWeight: "900", marginTop: 1 },
  resvName: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  resvPrice: { color: "#A3A3A3", fontSize: 12, fontWeight: "600", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },
  statusPending: { backgroundColor: "rgba(255,214,0,0.15)", borderColor: "#FFD600" },
  statusConfirmed: { backgroundColor: "#00E676", borderColor: "#00E676" },
  statusRejected: { backgroundColor: "rgba(255,59,48,0.15)", borderColor: "#FF3B30" },
  resvRoute: { paddingVertical: 6 },
  resvNotes: { color: "#A3A3A3", fontSize: 12, marginTop: 6, fontStyle: "italic" },
  resvActions: { flexDirection: "row", gap: 6, marginTop: 12, flexWrap: "wrap" },
  resvBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, flexGrow: 1, flexShrink: 1 },
  resvCallBtn: { backgroundColor: "#0F0F0F", borderWidth: 1, borderColor: "#00E676" },
  resvCallText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  resvRejectBtn: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#FF3B30" },
  resvRejectText: { color: "#FF3B30", fontWeight: "900", fontSize: 13 },
  resvConfirmBtn: { backgroundColor: "#00E676" },
  resvConfirmText: { color: "#0A0A0A", fontWeight: "900", fontSize: 13 },
  activeBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFD600", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, marginBottom: 12 },
  activeBannerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  activeBannerTitle: { color: "#0A0A0A", fontSize: 14, fontWeight: "900" },
  activeBannerSub: { color: "#0A0A0A", fontSize: 11, fontWeight: "600", marginTop: 2 },
});
