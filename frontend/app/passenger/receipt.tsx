import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

const VAT_RATE = 0.08;

function fmtPLN(v: number) {
  return v.toFixed(2).replace(".", ",") + " zł";
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pl-PL", { dateStyle: "long", timeStyle: "short" });
  } catch { return iso; }
}

export default function Receipt() {
  const router = useRouter();
  const { ride_id } = useLocalSearchParams<{ ride_id: string }>();
  const { authFetch, user } = useAuth();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await authFetch("/api/rides/mine");
    if (r.ok) {
      const list = await r.json();
      const match = list.find((x: any) => x.ride_id === ride_id);
      if (match) setRide(match);
    }
    setLoading(false);
  }, [authFetch, ride_id]);

  useEffect(() => { load(); }, [load]);

  const handleShare = async () => {
    if (!ride) return;
    const text = `🧾 Paragon TAXIGO\nNr: ${ride.ride_id}\nData: ${fmtDate(ride.completed_at || ride.created_at)}\n${ride.pickup_address} → ${ride.dest_address}\nDystans: ${ride.distance_km?.toFixed(1)} km\nDo zapłaty (brutto): ${fmtPLN(ride.price_pln)}`;
    if (Platform.OS === "web" && typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Paragon TAXIGO", text });
      } catch {}
    } else if (Platform.OS === "web") {
      try {
        await navigator.clipboard.writeText(text);
        Alert.alert("Skopiowano", "Treść paragonu została skopiowana do schowka.");
      } catch {
        Alert.alert("Paragon", text);
      }
    } else {
      Alert.alert("Paragon", text);
    }
  };

  const handlePrint = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator color="#0F0F0F" /></View>;
  }
  if (!ride) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Nie znaleziono paragonu</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.replace("/passenger/home")}>
          <Text style={styles.errorBtnText}>Powrót</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const brutto = ride.price_pln || 0;
  const netto = brutto / (1 + VAT_RATE);
  const vat = brutto - netto;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="receipt-back-btn" onPress={() => router.replace("/passenger/home")} style={styles.back}>
          <Ionicons name="close" size={26} color="#0F0F0F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paragon</Text>
        <TouchableOpacity testID="receipt-share-btn" onPress={handleShare} style={styles.back}>
          <Ionicons name="share-outline" size={22} color="#0F0F0F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card} testID="receipt-card">
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>T</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>TAXIGO</Text>
              <Text style={styles.brandSub}>Twoja taksówka w Krakowie</Text>
            </View>
          </View>

          <View style={styles.dashedLine} />

          <Text style={styles.eyebrow}>NUMER PARAGONU</Text>
          <Text style={styles.receiptNo}>{ride.ride_id.toUpperCase()}</Text>
          <Text style={styles.date}>{fmtDate(ride.completed_at || ride.created_at)}</Text>

          <View style={styles.dashedLine} />

          <Text style={styles.eyebrow}>TRASA</Text>
          <View style={styles.routeRow}>
            <View style={styles.dotA} />
            <Text style={styles.routeText}>{ride.pickup_address}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.dotB} />
            <Text style={styles.routeText}>{ride.dest_address}</Text>
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>DYSTANS</Text>
              <Text style={styles.statVal}>{ride.distance_km?.toFixed(1)} km</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>KIEROWCA</Text>
              <Text style={styles.statVal}>{ride.driver_name || "—"}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>POJAZD</Text>
              <Text style={styles.statVal}>{ride.driver_plate || "—"}</Text>
            </View>
          </View>

          <View style={styles.dashedLine} />

          <Text style={styles.eyebrow}>ROZLICZENIE</Text>
          <View style={styles.lineItem}>
            <Text style={styles.lineLabel}>Opłata wstępna</Text>
            <Text style={styles.lineValue}>{fmtPLN(5)}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.lineLabel}>Przejazd ({ride.distance_km?.toFixed(1)} km × 3,00 zł)</Text>
            <Text style={styles.lineValue}>{fmtPLN(ride.distance_km * 3)}</Text>
          </View>

          <View style={styles.thinLine} />

          <View style={styles.lineItem}>
            <Text style={styles.netLabel}>Wartość netto</Text>
            <Text style={styles.netValue}>{fmtPLN(netto)}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.netLabel}>VAT 8%</Text>
            <Text style={styles.netValue}>{fmtPLN(vat)}</Text>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>DO ZAPŁATY (BRUTTO)</Text>
            <Text style={styles.totalValue}>{fmtPLN(brutto)}</Text>
          </View>

          <View style={styles.dashedLine} />

          <Text style={styles.footer}>Dziękujemy za skorzystanie z TAXIGO!{"\n"}Zapraszamy ponownie 🚖</Text>
          <Text style={styles.footerSmall}>Paragon wystawiony dla: {user?.name}</Text>
        </View>

        {Platform.OS === "web" && (
          <TouchableOpacity testID="receipt-print-btn" style={styles.printBtn} onPress={handlePrint}>
            <Ionicons name="print-outline" size={18} color="#0F0F0F" />
            <Text style={styles.printBtnText}>Drukuj / zapisz PDF</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          testID="receipt-rate-btn"
          style={styles.rateBtn}
          onPress={() => router.replace({ pathname: "/passenger/rate", params: { ride_id: ride.ride_id } })}
        >
          <Text style={styles.rateBtnText}>Oceń kierowcę</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity testID="receipt-home-btn" style={styles.homeBtn} onPress={() => router.replace("/passenger/home")}>
          <Text style={styles.homeBtnText}>Powrót do ekranu głównego</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { alignItems: "center", justifyContent: "center" },
  errorText: { color: "#525252", marginBottom: 16 },
  errorBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#0F0F0F", borderRadius: 12 },
  errorBtnText: { color: "#FFFFFF", fontWeight: "800" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingTop: Platform.OS === "ios" ? 56 : 40, paddingBottom: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "900", color: "#0F0F0F" },
  scroll: { padding: 20, paddingBottom: 60 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "#E5E5E5" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  logoBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFD600", alignItems: "center", justifyContent: "center" },
  logoBadgeText: { fontSize: 22, fontWeight: "900", color: "#0F0F0F" },
  brand: { fontSize: 22, fontWeight: "900", color: "#0F0F0F", letterSpacing: -0.5 },
  brandSub: { fontSize: 11, color: "#525252", marginTop: 2, fontWeight: "600" },
  dashedLine: { height: 1, borderBottomWidth: 1, borderStyle: "dashed", borderColor: "#D4D4D4", marginVertical: 16 },
  thinLine: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 12 },
  eyebrow: { color: "#525252", fontSize: 10, letterSpacing: 1.6, fontWeight: "700", marginBottom: 6 },
  receiptNo: { color: "#0F0F0F", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  date: { color: "#525252", fontSize: 12, marginTop: 4, fontWeight: "600" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  routeLine: { width: 1, height: 12, backgroundColor: "#E5E5E5", marginLeft: 5 },
  routeText: { flex: 1, color: "#0F0F0F", fontSize: 14, fontWeight: "600" },
  dotA: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#FFD600", borderWidth: 2, borderColor: "#0F0F0F" },
  dotB: { width: 11, height: 11, borderRadius: 2, backgroundColor: "#0F0F0F" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, gap: 8 },
  statLabel: { fontSize: 9, color: "#525252", letterSpacing: 1.2, fontWeight: "700" },
  statVal: { fontSize: 13, color: "#0F0F0F", fontWeight: "900", marginTop: 4 },
  lineItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  lineLabel: { color: "#0F0F0F", fontSize: 13, fontWeight: "600", flex: 1 },
  lineValue: { color: "#0F0F0F", fontSize: 13, fontWeight: "800" },
  netLabel: { color: "#525252", fontSize: 13, fontWeight: "600", flex: 1 },
  netValue: { color: "#525252", fontSize: 13, fontWeight: "700" },
  totalBox: { backgroundColor: "#FFD600", padding: 14, borderRadius: 12, marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { color: "#0F0F0F", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  totalValue: { color: "#0F0F0F", fontSize: 22, fontWeight: "900" },
  footer: { textAlign: "center", color: "#0F0F0F", fontSize: 13, fontWeight: "600", marginTop: 8, lineHeight: 20 },
  footerSmall: { textAlign: "center", color: "#A3A3A3", fontSize: 11, marginTop: 8, fontWeight: "500" },
  printBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E5E5E5", marginTop: 16, backgroundColor: "#FFFFFF" },
  printBtnText: { color: "#0F0F0F", fontWeight: "800", fontSize: 14 },
  rateBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, height: 54, backgroundColor: "#0F0F0F", borderRadius: 14, marginTop: 12 },
  rateBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  homeBtn: { alignItems: "center", paddingVertical: 14, marginTop: 8 },
  homeBtnText: { color: "#525252", fontWeight: "700" },
});
