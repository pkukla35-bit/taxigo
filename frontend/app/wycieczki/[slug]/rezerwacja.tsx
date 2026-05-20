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
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, LocaleConfig, DateData } from "react-native-calendars";
import { getTripBySlug } from "../../../data/trips";
import { COMPANY } from "../../../data/legal";

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
  // Metoda płatności (cash | card_on_arrival | blik_phone)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card_on_arrival" | "blik_phone">("cash");
  // BLIK na telefon - modal z instrukcjami
  const [blikPhoneOpen, setBlikPhoneOpen] = useState(false);
  const [pendingReservation, setPendingReservation] = useState<any>(null);
  // BLIK modal
  const [blikOpen, setBlikOpen] = useState(false);
  const [blikCode, setBlikCode] = useState("");
  const [blikStage, setBlikStage] = useState<"input" | "waiting" | "success" | "failed">("input");
  const [blikMessage, setBlikMessage] = useState("");
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
  const totalPrice = trip.price; // cena za samochód (nie × osoby)

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

  const submit = async (paymentMethodArg: "cash" | "negotiate" | "blik" | "card_on_arrival") => {
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
    if (paymentMethodArg === "negotiate") {
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
      // 1. zawsze najpierw tworzymy rezerwację
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
          payment_method: paymentMethodArg,
          proposed_price: proposed,
          negotiation_note: paymentMethodArg === "negotiate" ? negotiationNote.trim() : "",
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

      // 2. dalsze kroki dla każdej metody
      if (paymentMethodArg === "blik") {
        // Otwieramy modal BLIK; zapamiętujemy ID rezerwacji
        setSubmitting(false);
        setBlikStage("input");
        setBlikCode("");
        setBlikMessage("");
        setBlikOpen(true);
        (globalThis as any).__pendingReservationId = data.reservation_id;
        return;
      }

      if (paymentMethodArg === "card_on_arrival") {
        // Karta u kierowcy na miejscu — działa tak jak gotówka, idziemy na ekran sukcesu
        router.replace({
          pathname: "/wycieczki/rezerwacja-sukces" as any,
          params: {
            id: data.reservation_id,
            trip: trip.title,
            date: selectedDate,
            people: String(people),
            total: String(totalPrice),
            payment: "card_on_arrival",
          },
        });
        return;
      }

      if (paymentMethodArg === "blik_phone") {
        // BLIK na telefon — pokazujemy modal z instrukcjami przelewu P2P
        setSubmitting(false);
        setPendingReservation(data);
        setBlikPhoneOpen(true);
        return;
      }

      // cash / negotiate -> bezpośrednio na ekran sukcesu
      router.replace({
        pathname: "/wycieczki/rezerwacja-sukces" as any,
        params: {
          id: data.reservation_id,
          trip: trip.title,
          date: selectedDate,
          people: String(people),
          total: String(totalPrice),
          payment: paymentMethodArg,
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

  // BLIK confirmation - po utworzeniu rezerwacji + wpisaniu kodu
  const confirmBlik = async () => {
    if (!/^\d{6}$/.test(blikCode)) {
      setBlikMessage("Wpisz 6 cyfr kodu BLIK");
      return;
    }
    const reservationId = (globalThis as any).__pendingReservationId;
    if (!reservationId) {
      setBlikMessage("Brak ID rezerwacji - zacznij od nowa");
      return;
    }
    setBlikStage("waiting");
    setBlikMessage("Wysyłam kod do banku... Potwierdź w aplikacji bankowej.");
    try {
      const res = await fetch(`${BACKEND}/api/trips/payment/blik`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservationId, blik_code: blikCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBlikStage("failed");
        setBlikMessage(data?.detail || "Nie udało się przetworzyć płatności BLIK");
        return;
      }
      // poll status (BLIK często requires_action -> czekamy na akceptację)
      let attempts = 0;
      const poll = async (): Promise<void> => {
        attempts++;
        const statusRes = await fetch(`${BACKEND}/api/trips/payment/${reservationId}/status`);
        const statusData = await statusRes.json();
        if (statusData.payment_status === "succeeded") {
          setBlikStage("success");
          setBlikMessage("Płatność potwierdzona!");
          setTimeout(() => {
            setBlikOpen(false);
            router.replace({
              pathname: "/wycieczki/rezerwacja-sukces" as any,
              params: {
                id: reservationId,
                trip: trip.title,
                date: selectedDate,
                people: String(people),
                total: String(totalPrice),
                payment: "blik",
                paid: "1",
              },
            });
          }, 1500);
          return;
        }
        if (["requires_payment_method", "canceled", "failed"].includes(statusData.payment_status)) {
          setBlikStage("failed");
          setBlikMessage("Płatność nieudana lub anulowana. Spróbuj ponownie.");
          return;
        }
        if (attempts < 40) {
          setTimeout(poll, 1500);
        } else {
          setBlikStage("failed");
          setBlikMessage("Czas oczekiwania minął. Sprawdź aplikację bankową.");
        }
      };
      setTimeout(poll, 1500);
    } catch (e: any) {
      setBlikStage("failed");
      setBlikMessage(e?.message || "Błąd połączenia");
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

          {/* Payment method selector */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>💳 Metoda płatności</Text>
            <View style={s.payMethodGrid}>
              <PayMethodChip
                active={paymentMethod === "cash"}
                icon="cash"
                label="Gotówka"
                sub="u kierowcy"
                onPress={() => setPaymentMethod("cash")}
                accent={trip.accent}
                bgAccent={trip.bgAccent}
              />
              <PayMethodChip
                active={paymentMethod === "card_on_arrival"}
                icon="card"
                label="Karta"
                sub="u kierowcy"
                onPress={() => setPaymentMethod("card_on_arrival")}
                accent={trip.accent}
                bgAccent={trip.bgAccent}
              />
              <PayMethodChip
                active={paymentMethod === "blik_phone"}
                icon="phone-portrait"
                label="BLIK"
                sub="na telefon"
                onPress={() => setPaymentMethod("blik_phone")}
                accent={trip.accent}
                bgAccent={trip.bgAccent}
              />
            </View>
            {paymentMethod === "cash" ? (
              <Text style={s.payHint}>💵 Zapłacisz gotówką kierowcy w dniu wycieczki — bez prowizji.</Text>
            ) : paymentMethod === "card_on_arrival" ? (
              <Text style={s.payHint}>💳 Zapłacisz kartą u kierowcy w dniu wycieczki (terminal mobilny).</Text>
            ) : (
              <Text style={s.payHint}>📱 Przelew BLIK na numer telefonu {COMPANY.phone} — z aplikacji bankowej, w 30 sekund.</Text>
            )}
          </View>

          {/* Summary */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>💰 Podsumowanie</Text>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Cena za samochód (do {maxPeople} osób)</Text>
              <Text style={s.summaryVal}>{trip.price} zł</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Liczba osób</Text>
              <Text style={s.summaryVal}>{people}</Text>
            </View>
            <View style={[s.summaryRow, s.summaryTotal]}>
              <Text style={s.summaryTotalLabel}>Razem</Text>
              <Text style={[s.summaryTotalVal, { color: trip.accent }]}>{totalPrice} zł</Text>
            </View>
            <Text style={s.summaryNote}>
              Cena obejmuje transport prywatny Toyotą Prius (do {maxPeople} osób) tam i z powrotem. Skontaktujemy się z Tobą telefonicznie w celu potwierdzenia rezerwacji.
            </Text>
          </View>
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={s.ctaBar}>
          <TouchableOpacity
              activeOpacity={0.85}
              style={[s.ctaBtn, { backgroundColor: trip.accent, opacity: submitting ? 0.7 : 1 }]}
              onPress={() => submit(paymentMethod)}
              disabled={submitting}
              testID="reserve-main-btn"
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={paymentMethod === "cash" ? "cash" : paymentMethod === "blik_phone" ? "phone-portrait" : "card"}
                    size={18}
                    color="#fff"
                  />
                  <Text style={s.ctaBtnText} numberOfLines={1}>
                    {paymentMethod === "blik_phone" ? `Zarezerwuj + BLIK — ${totalPrice} zł` : `Zarezerwuj — ${totalPrice} zł`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          <Text style={s.ctaHint}>
            {paymentMethod === "cash"
              ? "💵 Płatność gotówką u kierowcy w dniu wycieczki"
              : paymentMethod === "card_on_arrival"
              ? "💳 Płatność kartą u kierowcy w dniu wycieczki (terminal)"
              : `📱 Przelew BLIK na numer ${COMPANY.phone} z aplikacji bankowej`}
          </Text>
          <TouchableOpacity onPress={() => router.push("/regulamin" as any)}>
            <Text style={s.legalLink}>
              Klikając „Zarezerwuj" akceptujesz <Text style={{ textDecorationLine: "underline" }}>regulamin</Text> i <Text style={{ textDecorationLine: "underline" }} onPress={() => router.push("/polityka-prywatnosci" as any)}>politykę prywatności</Text>.
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* BLIK na telefon - modal z instrukcjami */}
      <Modal
        visible={blikPhoneOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBlikPhoneOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Ionicons name="phone-portrait" size={22} color={trip.accent} />
              <Text style={s.modalTitle}>Przelew BLIK na telefon</Text>
              <TouchableOpacity onPress={() => setBlikPhoneOpen(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={s.modalAmount}>Do zapłaty: <Text style={{ color: trip.accent, fontWeight: "800" }}>{totalPrice} zł</Text></Text>

            <View style={s.phoneBox}>
              <Text style={s.phoneLabel}>Numer odbiorcy:</Text>
              <Text style={[s.phoneNumber, { color: trip.accent }]}>{COMPANY.phone}</Text>
              <Text style={s.phoneOwner}>{COMPANY.name}</Text>
            </View>

            <Text style={s.modalHint}>📲 Jak zapłacić w 30 sekund:</Text>
            <View style={s.steps}>
              <Step n="1" text="Otwórz aplikację swojego banku" />
              <Step n="2" text={`Wybierz „BLIK" → „Przelew na telefon" (lub „BLIK P2P")`} />
              <Step n="3" text={`Wpisz numer: ${COMPANY.phone}`} />
              <Step n="4" text={`Wpisz kwotę: ${totalPrice} zł`} />
              <Step n="5" text="W tytule podaj numer rezerwacji (zobaczysz na następnym ekranie)" />
              <Step n="6" text="Potwierdź PIN-em w aplikacji banku" />
            </View>

            <View style={s.infoBoxNote}>
              <Ionicons name="information-circle" size={16} color="#856404" />
              <Text style={s.infoBoxNoteText}>Pieniądze wpłyną w 30 sek. Po sprawdzeniu zaksięgujemy rezerwację jako „Opłaconą".</Text>
            </View>

            <TouchableOpacity
              style={[s.blikSubmit, { backgroundColor: trip.accent }]}
              onPress={() => {
                setBlikPhoneOpen(false);
                if (pendingReservation) {
                  router.replace({
                    pathname: "/wycieczki/rezerwacja-sukces" as any,
                    params: {
                      id: pendingReservation.reservation_id,
                      trip: trip.title,
                      date: selectedDate,
                      people: String(people),
                      total: String(totalPrice),
                      payment: "blik_phone",
                    },
                  });
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={s.blikSubmitText}>✓ Wysłałem przelew</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BLIK Modal */}
      <Modal
        visible={blikOpen}
        transparent
        animationType="fade"
        onRequestClose={() => blikStage !== "waiting" && setBlikOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Ionicons name="phone-portrait" size={22} color={trip.accent} />
              <Text style={s.modalTitle}>Płatność BLIK</Text>
              {blikStage !== "waiting" && (
                <TouchableOpacity onPress={() => setBlikOpen(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={22} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={s.modalAmount}>Do zapłaty: <Text style={{ color: trip.accent, fontWeight: "800" }}>{totalPrice} zł</Text></Text>

            {blikStage === "input" && (
              <>
                <Text style={s.modalHint}>Otwórz aplikację banku i wygeneruj kod BLIK, potem wpisz go poniżej:</Text>
                <TextInput
                  style={s.blikInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="#bbb"
                  value={blikCode}
                  onChangeText={(t) => setBlikCode(t.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                {blikMessage ? <Text style={s.blikErr}>{blikMessage}</Text> : null}
                <TouchableOpacity
                  style={[s.blikSubmit, { backgroundColor: trip.accent, opacity: blikCode.length === 6 ? 1 : 0.5 }]}
                  onPress={confirmBlik}
                  disabled={blikCode.length !== 6}
                  activeOpacity={0.85}
                >
                  <Text style={s.blikSubmitText}>Zapłać {totalPrice} zł</Text>
                </TouchableOpacity>
              </>
            )}

            {blikStage === "waiting" && (
              <View style={{ alignItems: "center", paddingVertical: 30 }}>
                <ActivityIndicator size="large" color={trip.accent} />
                <Text style={[s.modalHint, { textAlign: "center", marginTop: 16 }]}>{blikMessage}</Text>
                <Text style={[s.modalHint, { textAlign: "center", marginTop: 6, fontSize: 11 }]}>
                  Otwórz aplikację banku i potwierdź transakcję.
                </Text>
              </View>
            )}

            {blikStage === "success" && (
              <View style={{ alignItems: "center", paddingVertical: 30 }}>
                <View style={[s.modalSuccessIcon, { backgroundColor: trip.accent }]}>
                  <Ionicons name="checkmark" size={36} color="#fff" />
                </View>
                <Text style={[s.modalTitle, { marginTop: 12 }]}>{blikMessage}</Text>
              </View>
            )}

            {blikStage === "failed" && (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <View style={[s.modalSuccessIcon, { backgroundColor: "#c0392b" }]}>
                  <Ionicons name="close" size={36} color="#fff" />
                </View>
                <Text style={[s.modalHint, { textAlign: "center", marginTop: 12 }]}>{blikMessage}</Text>
                <TouchableOpacity
                  style={[s.blikSubmit, { backgroundColor: trip.accent, marginTop: 16 }]}
                  onPress={() => { setBlikStage("input"); setBlikCode(""); setBlikMessage(""); }}
                  activeOpacity={0.85}
                >
                  <Text style={s.blikSubmitText}>Spróbuj ponownie</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PayMethodChip({ active, icon, label, sub, onPress, accent, bgAccent }: any) {
  return (
    <TouchableOpacity
      style={[
        s.payChip,
        active && { backgroundColor: bgAccent, borderColor: accent },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={active ? accent : "#666"} />
      <Text style={[s.payChipLabel, active && { color: accent, fontWeight: "800" }]}>{label}</Text>
      <Text style={s.payChipSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <View style={s.step}>
      <View style={s.stepNum}><Text style={s.stepNumText}>{n}</Text></View>
      <Text style={s.stepText}>{text}</Text>
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
  legalLink: { fontSize: 10.5, color: "#8e8e93", textAlign: "center", marginTop: 6, lineHeight: 14 },
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
  // payment method chips
  payMethodGrid: { flexDirection: "row", gap: 8, marginTop: 4 },
  payChip: { flex: 1, borderWidth: 1.5, borderColor: "#e5e5ea", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 6, alignItems: "center", gap: 3 },
  payChipLabel: { fontSize: 13, fontWeight: "700", color: "#1c1c1e", marginTop: 4 },
  payChipSub: { fontSize: 10, color: "#8e8e93" },
  payHint: { fontSize: 12, color: "#666", marginTop: 12, lineHeight: 17 },
  // BLIK modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { backgroundColor: "#fff", borderRadius: 18, padding: 22, width: "100%", maxWidth: 380 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1c1c1e", flex: 1 },
  modalAmount: { fontSize: 14, color: "#666", marginBottom: 14 },
  modalHint: { fontSize: 13, color: "#666", lineHeight: 18, marginBottom: 12 },
  blikInput: { borderWidth: 2, borderColor: "#e5e5ea", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 16, fontSize: 28, fontWeight: "800", textAlign: "center", letterSpacing: 8, color: "#1c1c1e", marginBottom: 6 },
  blikErr: { fontSize: 12, color: "#c0392b", marginBottom: 8, marginTop: 4 },
  blikSubmit: { paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 10 },
  blikSubmitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalSuccessIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  // BLIK na telefon
  phoneBox: { backgroundColor: "#f5f5f7", borderRadius: 12, padding: 16, marginBottom: 14, alignItems: "center" },
  phoneLabel: { fontSize: 11, color: "#8e8e93", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  phoneNumber: { fontSize: 28, fontWeight: "800", letterSpacing: 2, marginBottom: 4 },
  phoneOwner: { fontSize: 12, color: "#666", fontWeight: "600" },
  steps: { gap: 8, marginBottom: 12 },
  step: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#2E7D32", alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 12.5, color: "#1c1c1e", lineHeight: 17 },
  infoBoxNote: { flexDirection: "row", gap: 8, backgroundColor: "#fff3cd", padding: 10, borderRadius: 8, marginBottom: 12 },
  infoBoxNoteText: { flex: 1, fontSize: 11, color: "#856404", lineHeight: 15 },
});
