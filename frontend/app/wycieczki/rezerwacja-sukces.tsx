import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReservationSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = (params.id as string) || "";
  const trip = (params.trip as string) || "";
  const date = (params.date as string) || "";
  const people = (params.people as string) || "";
  const total = (params.total as string) || "";
  const payment = (params.payment as string) || "cash";
  const proposed = (params.proposed as string) || "";
  const isNegotiate = payment === "negotiate";

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.iconCircle}>
            <Ionicons name="checkmark" size={56} color="#fff" />
          </View>
          <Text style={s.title}>{isNegotiate ? "Propozycja wysłana! 💬" : "Rezerwacja przyjęta! 🎉"}</Text>
          <Text style={s.subtitle}>
            {isNegotiate
              ? "Skontaktujemy się z Tobą telefonicznie, aby omówić proponowaną cenę i potwierdzić rezerwację."
              : "Skontaktujemy się z Tobą telefonicznie w ciągu 24 godzin, aby potwierdzić rezerwację. Płatność gotówką u kierowcy w dniu wycieczki."}
          </Text>

          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.label}>Numer rezerwacji</Text>
              <Text style={s.valBold}>{id || "—"}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Wycieczka</Text>
              <Text style={s.val} numberOfLines={2}>{trip}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Data</Text>
              <Text style={s.val}>{date}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Liczba osób</Text>
              <Text style={s.val}>{people}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Płatność</Text>
              <Text style={s.val}>{isNegotiate ? "💬 Do negocjacji" : "💵 Gotówka przy odbiorze"}</Text>
            </View>
            {isNegotiate ? (
              <>
                <View style={s.row}>
                  <Text style={s.label}>Cena standardowa</Text>
                  <Text style={[s.val, { textDecorationLine: "line-through", color: "#999" }]}>{total} zł</Text>
                </View>
                <View style={[s.row, s.totalRow]}>
                  <Text style={s.totalLabel}>Twoja propozycja</Text>
                  <Text style={s.totalVal}>{proposed} zł</Text>
                </View>
              </>
            ) : (
              <View style={[s.row, s.totalRow]}>
                <Text style={s.totalLabel}>Do zapłaty</Text>
                <Text style={s.totalVal}>{total} zł</Text>
              </View>
            )}
          </View>

          <View style={s.infoBox}>
            <Ionicons name="information-circle" size={18} color="#2E7D32" />
            <Text style={s.infoText}>
              Status: <Text style={{ fontWeight: "700" }}>Oczekująca</Text>. Zachowaj numer rezerwacji.
            </Text>
          </View>

          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => router.replace("/wycieczki" as any)}
            activeOpacity={0.85}
          >
            <Text style={s.primaryBtnText}>Powrót do wycieczek</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => router.replace("/" as any)}
            activeOpacity={0.85}
          >
            <Text style={s.secondaryBtnText}>Strona główna</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 24, alignItems: "center" },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#2E7D32", alignItems: "center", justifyContent: "center", marginTop: 30, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#1c1c1e", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6e6e73", textAlign: "center", lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: "#eee" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, alignItems: "flex-start", gap: 12 },
  label: { fontSize: 13, color: "#8e8e93" },
  val: { fontSize: 13, color: "#1c1c1e", fontWeight: "600", textAlign: "right", flex: 1 },
  valBold: { fontSize: 13, color: "#2E7D32", fontWeight: "800", textAlign: "right", flex: 1 },
  totalRow: { borderTopWidth: 1, borderTopColor: "#eee", marginTop: 4, paddingTop: 12 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: "#1c1c1e" },
  totalVal: { fontSize: 20, fontWeight: "800", color: "#2E7D32" },
  infoBox: { flexDirection: "row", gap: 8, backgroundColor: "#e8f5e9", padding: 12, borderRadius: 10, marginBottom: 24, width: "100%", alignItems: "center" },
  infoText: { fontSize: 12, color: "#1c1c1e", flex: 1 },
  primaryBtn: { backgroundColor: "#2E7D32", paddingVertical: 14, paddingHorizontal: 22, borderRadius: 12, width: "100%", alignItems: "center", marginBottom: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 12, width: "100%", alignItems: "center", borderWidth: 1, borderColor: "#d1d1d6" },
  secondaryBtnText: { color: "#1c1c1e", fontWeight: "600", fontSize: 14 },
});
