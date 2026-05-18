import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, LocaleConfig, DateData } from "react-native-calendars";
import { getTripBySlug } from "../../../data/trips";

// Polish locale for calendar
LocaleConfig.locales["pl"] = {
  monthNames: [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
  ],
  monthNamesShort: ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"],
  dayNames: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
  dayNamesShort: ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"],
  today: "Dzisiaj",
};
LocaleConfig.defaultLocale = "pl";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL as string;

export default function TripReservation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const slug = (params.slug as string) || "";
  const trip = getTripBySlug(slug);

  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [people, setPeople] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Negocjacja ceny
  const [negotiateOpen, setNegotiateOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState("");
  const [negotiationNote, setNegotiationNote] = useState("");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/api/trips/blocked-dates/${slug}`);
        const data = await res.json();
        if (!cancelled) {
          setBlockedDates((data || []).map((d: any) => d.date));
        }
      } catch (e) {
        if (!cancelled) setBlockedDates([]);
      } finally {
        if (!cancelled) setLoadingDates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!trip) {
    return (
      <View style={s.centered}>
        <Text>Wycieczka nie znaleziona</Text>
      </View>
    );
  }

  const maxPeople = trip.maxPeople || 8;
  const totalPrice = trip.price * people;

  const markedDates = useMemo(() => {
    const m: Record<string, any> = {};
    blockedDates.forEach((d) => {
      m[d] = {
        disabled: true,
        disableTouchEvent: true,
        customStyles: {
          container: { backgroundColor: "#fde2e2" },
          text: { color: "#c0392b", textDecorationLine: "line-through" },
        },
      };
    });
    if (selectedDate) {
      m[selectedDate] = {
        ...(m[selectedDate] || {}),
        selected: true,
        selectedColor: trip.accent,
      };
    }
    return m;
  }, [blockedDates, selectedDate, trip.accent]);

  const incPeople = () => setPeople((p) => Math.min(maxPeople, p + 1));
  const decPeople = () => setPeople((p) => Math.max(1, p - 1));

  const validate = (): string | null => {
    if (!selectedDate) return "Wybierz datę wycieczki";
    if (people < 1) return "Liczba osób musi być >= 1";
    if (name.trim().length < 2) return "Podaj imię i nazwisko";
    if (phone.trim().length < 6) return "Podaj numer telefonu";
    if (!email.includes("@") || email.trim().length < 5) return "Podaj poprawny email";
    if (pickupAddress.trim().length < 3) return "Podaj adres odbioru";
    return null;
  };

  const submit = async (paymentMethod: "cash" | "negotiate") => {
    const err = validate();
    if (err) {
      if (Platform.OS === "web") {
        window.alert(err);
      } else {
        Alert.alert("Uzupełnij dane", err);
      }
      return;
    }
    // walidacja negocjacji
    let proposed: number | null = null;
    if (paymentMethod === "negotiate") {
      const p = parseFloat(proposedPrice.replace(",", "."));
      if (!proposedPrice || isNaN(p) || p <= 0) {
        const msg = "Wpisz proponowaną cenę (większą od 0)";
        if (Platform.OS === "web") window.alert(msg);
        else Alert.alert("Brakuje ceny", msg);
        return;
      }
      proposed = p;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND}/api/trips/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_slug: trip.slug,
          trip_name: trip.title,
          date: selectedDate,
          people,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          pickup_address: pickupAddress.trim(),
          price_per_person: trip.price,
          total_price: totalPrice,
          notes: "",
          payment_method: paymentMethod,
          proposed_price: proposed,
          negotiation_note: paymentMethod === "negotiate" ? negotiationNote.trim() : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.detail || "Nie udało się utworzyć rezerwacji";
        if (Platform.OS === "web") window.alert(msg);
        else Alert.alert("Błąd", msg);
        setSubmitting(false);
        return;
      }
      router.replace({
        pathname: "/wycieczki/rezerwacja-sukces" as any,
        params: {
          id: data.reservation_id,
          trip: trip.title,
          date: selectedDate,
          people: String(people),
          total: String(totalPrice),
          payment: paymentMethod,
          proposed: proposed != null ? String(proposed) : "",
        },
      });
    } catch (e: any) {
      const msg = e?.message || "Błąd połączenia";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Błąd", msg);
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1c1c1e" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle} numberOfLines={1}>Rezerwacja</Text>
            <Text style={s.headerSub} numberOfLines={1}>{trip.title}</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          {/* Date */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📅 Wybierz datę</Text>
            <Text style={s.sectionHint}>Dni przekreślone na czerwono są niedostępne.</Text>
            {loadingDates ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator color={trip.accent} />
              </View>
            ) : (
              <View style={s.calendarWrap}>
                <Calendar
                  minDate={today}
                  onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                  markedDates={markedDates}
                  markingType="custom"
                  firstDay={1}
                  theme={{
                    todayTextColor: trip.accent,
                    arrowColor: trip.accent,
                    selectedDayBackgroundColor: trip.accent,
                    textMonthFontWeight: "700",
                    textDayFontWeight: "500",
                  }}
                />
              </View>
            )}
            {selectedDate ? (
              <View style={[s.dateBadge, { backgroundColor: trip.bgAccent }]}>
                <Ionicons name="calendar" size={16} color={trip.accent} />
                <Text style={[s.dateBadgeText, { color: trip.accent }]}> Wybrana data: {formatPlDate(selectedDate)}</Text>
              </View>
            ) : null}
          </View>

          {/* People */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>👥 Liczba osób</Text>
            <View style={s.peopleRow}>
              <TouchableOpacity onPress={decPeople} style={s.peopleBtn} disabled={people <= 1}>
                <Ionicons name="remove" size={22} color={people <= 1 ? "#bbb" : "#1c1c1e"} />
              </TouchableOpacity>
              <Text style={s.peopleCount}>{people}</Text>
              <TouchableOpacity onPress={incPeople} style={s.peopleBtn} disabled={people >= maxPeople}>
                <Ionicons name="add" size={22} color={people >= maxPeople ? "#bbb" : "#1c1c1e"} />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <Text style={s.peopleMax}>max {maxPeople}</Text>
            </View>
          </View>

          {/* Contact */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>👤 Dane kontaktowe</Text>
            <Text style={s.label}>Imię i nazwisko</Text>
            <TextInput
              style={s.input}
              placeholder="Jan Kowalski"
              placeholderTextColor="#9aa0a6"
              value={name}
              onChangeText={setName}
            />
            <Text style={s.label}>Telefon</Text>
            <TextInput
              style={s.input}
              placeholder="+48 600 123 456"
              placeholderTextColor="#9aa0a6"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="jan@example.com"
              placeholderTextColor="#9aa0a6"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={s.label}>Adres odbioru</Text>
            <TextInput
              style={[s.input, { minHeight: 60 }]}
              placeholder="np. ul. Krupówki 12, Zakopane"
              placeholderTextColor="#9aa0a6"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              multiline
            />
          </View>

          {/* Summary */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>💰 Podsumowanie</Text>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Cena za osobę</Text>
              <Text style={s.summaryVal}>{trip.price} zł</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Liczba osób</Text>
              <Text style={s.summaryVal}>× {people}</Text>
            </View>
            <View style={[s.summaryRow, s.summaryTotal]}>
              <Text style={s.summaryTotalLabel}>Razem</Text>
              <Text style={[s.summaryTotalVal, { color: trip.accent }]}>{totalPrice} zł</Text>
            </View>
            <Text style={s.summaryNote}>
              Rezerwacja będzie miała status „Oczekująca". Skontaktujemy się telefonicznie w celu potwierdzenia i ustalenia formy płatności.
            </Text>
          </View>
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={s.ctaBar}>
          {negotiateOpen && (
            <View style={[s.negoBox, { borderColor: trip.accent, backgroundColor: trip.bgAccent }]}>
              <View style={s.negoHeader}>
                <Ionicons name="chatbubbles" size={18} color={trip.accent} />
                <Text style={[s.negoTitle, { color: trip.accent }]}>💬 Negocjuj cenę</Text>
                <TouchableOpacity onPress={() => setNegotiateOpen(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <Text style={s.negoHint}>Cena standardowa: {totalPrice} zł ({trip.price} zł × {people} os).
                {"\n"}Wpisz cenę, którą proponujesz — skontaktujemy się aby ustalić szczegóły.
              </Text>
              <View style={s.negoRow}>
                <TextInput
                  style={s.negoInput}
                  placeholder="np. 280"
                  placeholderTextColor="#9aa0a6"
                  keyboardType="numeric"
                  value={proposedPrice}
                  onChangeText={setProposedPrice}
                />
                <Text style={s.negoCurrency}>zł</Text>
              </View>
              <TextInput
                style={[s.negoInput, { height: 60, marginTop: 8, textAlignVertical: "top" }]}
                placeholder="Opcjonalna notatka (np. studenci, grupa, stały klient)..."
                placeholderTextColor="#9aa0a6"
                value={negotiationNote}
                onChangeText={setNegotiationNote}
                multiline
              />
              <TouchableOpacity
                style={[s.negoSubmit, { backgroundColor: trip.accent, opacity: submitting ? 0.7 : 1 }]}
                onPress={() => submit("negotiate")}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={s.negoSubmitText}>Wyślij propozycję {proposedPrice ? `— ${proposedPrice} zł` : ""}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={s.ctaRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[s.ctaBtn, { backgroundColor: trip.accent, opacity: submitting ? 0.7 : 1, flex: 1.4 }]}
              onPress={() => submit("cash")}
              disabled={submitting}
              testID="reserve-cash-btn"
            >
              {submitting && !negotiateOpen ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cash" size={18} color="#fff" />
                  <Text style={s.ctaBtnText} numberOfLines={1}>Gotówka — {totalPrice} zł</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[s.ctaSecondary, negotiateOpen && { backgroundColor: trip.accent }]}
              onPress={() => setNegotiateOpen((o) => !o)}
              disabled={submitting}
              testID="negotiate-btn"
            >
              <Ionicons name="chatbubbles-outline" size={18} color={negotiateOpen ? "#fff" : trip.accent} />
              <Text style={[s.ctaSecondaryText, { color: negotiateOpen ? "#fff" : trip.accent }]}>Negocjuj</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.ctaHint}>💵 Płatność gotówką u kierowcy w dniu wycieczki</Text>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function formatPlDate(iso: string) {
  try {
    const d = new Date(iso + "T00:00:00");
    const dni = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
    const m = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
    return `${dni[d.getDay()]}, ${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

const s = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1c1c1e" },
  headerSub: { fontSize: 12, color: "#6e6e73", marginTop: 1 },
  section: { padding: 18, backgroundColor: "#fff", marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1c1c1e", marginBottom: 6 },
  sectionHint: { fontSize: 12, color: "#8e8e93", marginBottom: 10 },
  calendarWrap: { borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#eee" },
  dateBadge: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, marginTop: 10 },
  dateBadgeText: { fontSize: 13, fontWeight: "600" },
  peopleRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 },
  peopleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },
  peopleCount: { fontSize: 24, fontWeight: "800", color: "#1c1c1e", minWidth: 40, textAlign: "center" },
  peopleMax: { fontSize: 12, color: "#8e8e93" },
  label: { fontSize: 12, color: "#6e6e73", marginTop: 12, marginBottom: 6, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#e5e5ea", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: "#1c1c1e", backgroundColor: "#fafafa" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: "#6e6e73" },
  summaryVal: { fontSize: 14, fontWeight: "600", color: "#1c1c1e" },
  summaryTotal: { borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10, marginTop: 6 },
  summaryTotalLabel: { fontSize: 16, fontWeight: "700", color: "#1c1c1e" },
  summaryTotalVal: { fontSize: 22, fontWeight: "800" },
  summaryNote: { fontSize: 11, color: "#8e8e93", marginTop: 12, lineHeight: 16 },
  ctaBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e5ea", padding: 14 },
  ctaRow: { flexDirection: "row", gap: 8 },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  ctaBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  ctaSecondary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 16, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#2E7D32", backgroundColor: "#fff" },
  ctaSecondaryText: { fontSize: 14, fontWeight: "700" },
  ctaHint: { fontSize: 11, color: "#8e8e93", textAlign: "center", marginTop: 8 },
  // negotiate box
  negoBox: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10 },
  negoHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  negoTitle: { fontSize: 15, fontWeight: "800", flex: 1 },
  negoHint: { fontSize: 12, color: "#555", marginBottom: 10, lineHeight: 17 },
  negoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  negoInput: { flex: 1, borderWidth: 1, borderColor: "#d1d1d6", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, fontWeight: "700", color: "#1c1c1e" },
  negoCurrency: { fontSize: 16, fontWeight: "700", color: "#1c1c1e" },
  negoSubmit: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12, marginTop: 10 },
  negoSubmitText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
