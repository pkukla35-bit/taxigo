import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar, LocaleConfig, DateData } from "react-native-calendars";
import { TRIPS } from "../../data/trips";

LocaleConfig.locales["pl"] = LocaleConfig.locales["pl"] || {
  monthNames: ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
  monthNamesShort: ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"],
  dayNames: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
  dayNamesShort: ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"],
  today: "Dzisiaj",
};
LocaleConfig.defaultLocale = "pl";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL as string;
const STORAGE_KEY = "admin_passcode";

type Reservation = {
  reservation_id: string;
  trip_slug: string;
  trip_name: string;
  date: string;
  people: number;
  name: string;
  phone: string;
  email: string;
  pickup_address: string;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  payment_method?: "cash" | "negotiate" | "blik" | "card_on_arrival" | "blik_phone";
  proposed_price?: number | null;
  negotiation_note?: string;
};

type BlockedDate = { trip_slug: string; date: string; reason?: string };

export default function AdminPanel() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"reservations" | "blocked">("reservations");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // blocked-dates state
  const [selectedTrip, setSelectedTrip] = useState<string>("all");
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPasscode(saved);
        await tryLogin(saved, true);
      }
    })();
  }, []);

  const showErr = (msg: string) => {
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert("Błąd", msg);
  };

  const tryLogin = async (code: string, silent = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/trips/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code }),
      });
      if (!res.ok) {
        if (!silent) showErr("Nieprawidłowy kod admina");
        await AsyncStorage.removeItem(STORAGE_KEY);
        setAuthed(false);
        setLoading(false);
        return;
      }
      await AsyncStorage.setItem(STORAGE_KEY, code);
      setAuthed(true);
      await Promise.all([loadReservations(code), loadBlocked(code, selectedTrip)]);
    } catch (e: any) {
      if (!silent) showErr(e?.message || "Błąd połączenia");
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async (code: string) => {
    try {
      const res = await fetch(`${BACKEND}/api/trips/reservations`, {
        headers: { "X-Admin-Passcode": code },
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data || []);
      }
    } catch {}
  };

  const loadBlocked = async (code: string, slug: string) => {
    try {
      const res = await fetch(`${BACKEND}/api/trips/blocked-dates/${slug}`, {
        headers: { "X-Admin-Passcode": code },
      });
      if (res.ok) {
        const data = await res.json();
        setBlocked(data || []);
      }
    } catch {}
  };

  const refresh = useCallback(async () => {
    if (!passcode) return;
    setRefreshing(true);
    await Promise.all([loadReservations(passcode), loadBlocked(passcode, selectedTrip)]);
    setRefreshing(false);
  }, [passcode, selectedTrip]);

  useEffect(() => {
    if (authed && passcode) loadBlocked(passcode, selectedTrip);
  }, [selectedTrip, authed, passcode]);

  const updateStatus = async (id: string, status: Reservation["status"]) => {
    try {
      const res = await fetch(`${BACKEND}/api/trips/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Passcode": passcode },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await loadReservations(passcode);
    } catch (e: any) {
      showErr(e?.message || "Błąd");
    }
  };

  const deleteReservation = async (id: string) => {
    const confirm = Platform.OS === "web"
      ? window.confirm("Czy na pewno usunąć rezerwację?")
      : await new Promise<boolean>((resolve) => {
          Alert.alert("Usunąć?", "Tego nie można cofnąć", [
            { text: "Anuluj", style: "cancel", onPress: () => resolve(false) },
            { text: "Usuń", style: "destructive", onPress: () => resolve(true) },
          ]);
        });
    if (!confirm) return;
    await fetch(`${BACKEND}/api/trips/reservations/${id}`, {
      method: "DELETE",
      headers: { "X-Admin-Passcode": passcode },
    });
    await loadReservations(passcode);
  };

  const toggleBlock = async (date: string) => {
    const exists = blocked.find((b) => b.date === date && b.trip_slug === selectedTrip);
    try {
      if (exists) {
        await fetch(`${BACKEND}/api/trips/blocked-dates/${selectedTrip}/${date}`, {
          method: "DELETE",
          headers: { "X-Admin-Passcode": passcode },
        });
      } else {
        await fetch(`${BACKEND}/api/trips/blocked-dates`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Passcode": passcode },
          body: JSON.stringify({ trip_slug: selectedTrip, date, reason: "" }),
        });
      }
      await loadBlocked(passcode, selectedTrip);
    } catch (e: any) {
      showErr(e?.message || "Błąd");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setPasscode("");
  };

  const markedDates = useMemo(() => {
    const m: Record<string, any> = {};
    blocked.forEach((b) => {
      m[b.date] = {
        selected: true,
        selectedColor: "#c0392b",
        selectedTextColor: "#fff",
      };
    });
    return m;
  }, [blocked]);

  const pendingCount = reservations.filter((r) => r.status === "pending").length;

  // ============ LOGIN VIEW ============
  if (!authed) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0F0F" }}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView edges={["top"]}>
          <View style={s.loginHeader}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtnDark}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitleLight}>Panel administratora</Text>
          </View>
        </SafeAreaView>
        <View style={s.loginBox}>
          <View style={s.lockIcon}>
            <Ionicons name="lock-closed" size={36} color="#FFD600" />
          </View>
          <Text style={s.loginTitle}>Wymagana autoryzacja</Text>
          <Text style={s.loginSub}>Wpisz kod administratora aby uzyskać dostęp.</Text>
          <TextInput
            style={s.loginInput}
            placeholder="Kod administratora"
            placeholderTextColor="#666"
            secureTextEntry
            value={passcode}
            onChangeText={setPasscode}
            autoCapitalize="none"
          />
          <TouchableOpacity style={s.loginBtn} onPress={() => tryLogin(passcode)} disabled={loading}>
            {loading ? <ActivityIndicator color="#0F0F0F" /> : <Text style={s.loginBtnText}>Zaloguj</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============ MAIN VIEW ============
  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1c1c1e" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Panel admina</Text>
            <Text style={s.headerSub}>{reservations.length} rezerwacji • {pendingCount} oczekuje</Text>
          </View>
          <TouchableOpacity onPress={logout} style={s.logoutBtn}>
            <Ionicons name="log-out" size={20} color="#c0392b" />
          </TouchableOpacity>
        </View>

        <View style={s.tabs}>
          <TouchableOpacity
            style={[s.tab, tab === "reservations" && s.tabActive]}
            onPress={() => setTab("reservations")}
          >
            <Text style={[s.tabText, tab === "reservations" && s.tabTextActive]}>📋 Rezerwacje</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, tab === "blocked" && s.tabActive]}
            onPress={() => setTab("blocked")}
          >
            <Text style={[s.tabText, tab === "blocked" && s.tabTextActive]}>🚫 Blokady dat</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: 12, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {tab === "reservations" ? (
          reservations.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={48} color="#bbb" />
              <Text style={s.emptyText}>Brak rezerwacji</Text>
            </View>
          ) : (
            reservations.map((r) => (
              <View key={r.reservation_id} style={s.resCard}>
                <View style={s.resHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.resTitle} numberOfLines={1}>{r.trip_name}</Text>
                    <Text style={s.resId}>#{r.reservation_id}</Text>
                  </View>
                  <StatusBadge status={r.status} />
                </View>
                {r.payment_method === "negotiate" && r.proposed_price != null ? (
                  <View style={s.negoCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Ionicons name="chatbubbles" size={14} color="#856404" />
                      <Text style={s.negoCardTitle}>💬 KLIENT NEGOCJUJE CENĘ</Text>
                    </View>
                    <View style={s.negoCardRow}>
                      <Text style={s.negoCardLabel}>Standardowa:</Text>
                      <Text style={s.negoCardOrig}>{r.total_price} zł</Text>
                    </View>
                    <View style={s.negoCardRow}>
                      <Text style={s.negoCardLabel}>Propozycja:</Text>
                      <Text style={s.negoCardProposed}>{r.proposed_price} zł</Text>
                    </View>
                    {r.negotiation_note ? (
                      <Text style={s.negoCardNote}>📝 „{r.negotiation_note}"</Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={s.paymentChip}>
                    <Ionicons
                      name={r.payment_method === "card_on_arrival" ? "card" : (r.payment_method === "blik" || r.payment_method === "blik_phone") ? "phone-portrait" : "cash"}
                      size={12}
                      color="#155724"
                    />
                    <Text style={s.paymentChipText}>
                      {r.payment_method === "card_on_arrival" ? "Karta u kierowcy" : r.payment_method === "blik" ? "BLIK online" : r.payment_method === "blik_phone" ? "BLIK na telefon (sprawdź przelew)" : "Gotówka przy odbiorze"}
                    </Text>
                  </View>
                )}
                <View style={s.resBody}>
                  <Row icon="calendar" label="Data" value={r.date} />
                  <Row icon="people" label="Osoby" value={String(r.people)} />
                  <Row icon="person" label="Klient" value={r.name} />
                  <Row icon="call" label="Tel." value={r.phone} />
                  <Row icon="mail" label="Email" value={r.email} />
                  <Row icon="location" label="Odbiór" value={r.pickup_address} />
                  <Row icon="cash" label="Kwota" value={`${r.total_price} zł`} bold />
                </View>
                <View style={s.resActions}>
                  {r.status === "pending" && (
                    <TouchableOpacity style={[s.actBtn, { backgroundColor: "#2E7D32" }]} onPress={() => updateStatus(r.reservation_id, "confirmed")}>
                      <Text style={s.actBtnText}>✓ Potwierdź</Text>
                    </TouchableOpacity>
                  )}
                  {r.status === "confirmed" && (
                    <TouchableOpacity style={[s.actBtn, { backgroundColor: "#1976D2" }]} onPress={() => updateStatus(r.reservation_id, "completed")}>
                      <Text style={s.actBtnText}>🏁 Zakończ</Text>
                    </TouchableOpacity>
                  )}
                  {r.status !== "cancelled" && (
                    <TouchableOpacity style={[s.actBtn, { backgroundColor: "#ff9800" }]} onPress={() => updateStatus(r.reservation_id, "cancelled")}>
                      <Text style={s.actBtnText}>✕ Anuluj</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[s.actBtn, { backgroundColor: "#c0392b" }]} onPress={() => deleteReservation(r.reservation_id)}>
                    <Ionicons name="trash" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          <View>
            <View style={s.tripPicker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                <TouchableOpacity
                  style={[s.tripChip, selectedTrip === "all" && s.tripChipActive]}
                  onPress={() => setSelectedTrip("all")}
                >
                  <Text style={[s.tripChipText, selectedTrip === "all" && s.tripChipTextActive]}>🌍 Wszystkie</Text>
                </TouchableOpacity>
                {TRIPS.map((t) => (
                  <TouchableOpacity
                    key={t.slug}
                    style={[s.tripChip, selectedTrip === t.slug && s.tripChipActive]}
                    onPress={() => setSelectedTrip(t.slug)}
                  >
                    <Text style={[s.tripChipText, selectedTrip === t.slug && s.tripChipTextActive]} numberOfLines={1}>
                      {t.title.split("—")[0].trim()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={s.calendarHint}>Stuknij datę aby zablokować/odblokować ({selectedTrip === "all" ? "dla wszystkich wycieczek" : selectedTrip})</Text>
            <View style={s.calendarContainer}>
              <Calendar
                onDayPress={(d: DateData) => toggleBlock(d.dateString)}
                markedDates={markedDates}
                firstDay={1}
                minDate={new Date().toISOString().slice(0, 10)}
                theme={{ arrowColor: "#2E7D32", todayTextColor: "#2E7D32" }}
              />
            </View>
            {blocked.length > 0 && (
              <View style={s.blockedList}>
                <Text style={s.blockedTitle}>🚫 Zablokowane dni ({blocked.length})</Text>
                {blocked.map((b) => (
                  <TouchableOpacity
                    key={`${b.trip_slug}-${b.date}`}
                    style={s.blockedItem}
                    onPress={() => toggleBlock(b.date)}
                  >
                    <Text style={s.blockedDate}>{b.date}</Text>
                    <Text style={s.blockedSlug}>{b.trip_slug === "all" ? "Wszystkie" : b.trip_slug}</Text>
                    <Ionicons name="close-circle" size={20} color="#c0392b" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value, bold }: { icon: any; label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.row}>
      <Ionicons name={icon} size={14} color="#8e8e93" />
      <Text style={s.rowLabel}>{label}:</Text>
      <Text style={[s.rowVal, bold && { fontWeight: "800", color: "#2E7D32" }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: Reservation["status"] }) {
  const cfg: Record<string, { bg: string; fg: string; label: string }> = {
    pending: { bg: "#fff3cd", fg: "#856404", label: "Oczekuje" },
    confirmed: { bg: "#d4edda", fg: "#155724", label: "Potwierdz." },
    cancelled: { bg: "#f8d7da", fg: "#721c24", label: "Anulowana" },
    completed: { bg: "#cfe2f3", fg: "#0b5394", label: "Zakończ." },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.badgeText, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  loginHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  backBtnDark: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  headerTitleLight: { fontSize: 17, fontWeight: "700", color: "#fff" },
  loginBox: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  lockIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,214,0,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  loginTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 8 },
  loginSub: { fontSize: 13, color: "#999", textAlign: "center", marginBottom: 24 },
  loginInput: { backgroundColor: "#1c1c1e", color: "#fff", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 15, width: "100%", marginBottom: 14, borderWidth: 1, borderColor: "#262626" },
  loginBtn: { backgroundColor: "#FFD600", paddingVertical: 14, borderRadius: 12, width: "100%", alignItems: "center" },
  loginBtnText: { color: "#0F0F0F", fontWeight: "800", fontSize: 15 },

  header: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1c1c1e" },
  headerSub: { fontSize: 11, color: "#8e8e93", marginTop: 1 },
  logoutBtn: { padding: 8 },

  tabs: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f0f0f0", alignItems: "center" },
  tabActive: { backgroundColor: "#2E7D32" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#1c1c1e" },
  tabTextActive: { color: "#fff" },

  empty: { alignItems: "center", padding: 50, gap: 12 },
  emptyText: { fontSize: 14, color: "#8e8e93" },

  resCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#eee" },
  negoCard: { backgroundColor: "#fff3cd", borderWidth: 1, borderColor: "#ffe082", borderRadius: 10, padding: 10, marginBottom: 10 },
  negoCardTitle: { fontSize: 11, fontWeight: "800", color: "#856404", letterSpacing: 0.5 },
  negoCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 },
  negoCardLabel: { fontSize: 12, color: "#856404" },
  negoCardOrig: { fontSize: 12, color: "#999", textDecorationLine: "line-through" },
  negoCardProposed: { fontSize: 15, fontWeight: "800", color: "#c0392b" },
  negoCardNote: { fontSize: 12, fontStyle: "italic", color: "#856404", marginTop: 6, lineHeight: 16 },
  paymentChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#d4edda", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 10 },
  paymentChipText: { fontSize: 11, color: "#155724", fontWeight: "600" },
  resHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  resTitle: { fontSize: 15, fontWeight: "700", color: "#1c1c1e" },
  resId: { fontSize: 10, color: "#999", marginTop: 1 },
  resBody: { gap: 4, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowLabel: { fontSize: 12, color: "#8e8e93", minWidth: 50 },
  rowVal: { fontSize: 12, color: "#1c1c1e", flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  resActions: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  actBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  actBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  tripPicker: { marginBottom: 8 },
  tripChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e5ea" },
  tripChipActive: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  tripChipText: { fontSize: 12, color: "#1c1c1e", fontWeight: "600" },
  tripChipTextActive: { color: "#fff" },
  calendarHint: { fontSize: 11, color: "#8e8e93", marginVertical: 8, paddingHorizontal: 4 },
  calendarContainer: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#eee" },
  blockedList: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: "#eee" },
  blockedTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#1c1c1e" },
  blockedItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#f0f0f0", gap: 10 },
  blockedDate: { fontSize: 13, fontWeight: "600", color: "#1c1c1e" },
  blockedSlug: { fontSize: 11, color: "#8e8e93", flex: 1 },
});
