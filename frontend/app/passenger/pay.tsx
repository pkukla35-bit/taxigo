import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function Pay() {
  const router = useRouter();
  const { ride_id } = useLocalSearchParams<{ ride_id: string }>();
  const { authFetch } = useAuth();
  const { t } = useLanguage();
  const [ride, setRide] = useState<any>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await authFetch("/api/rides/mine");
    if (r.ok) {
      const list = await r.json();
      const m = list.find((x: any) => x.ride_id === ride_id);
      if (m) setRide(m);
    }
  }, [authFetch, ride_id]);

  useEffect(() => { load(); }, [load]);

  const pay = async () => {
    if (code.length !== 6) return Alert.alert(t("pay.blik"), t("pay.blik_err"));
    setBusy(true);
    setStatus(t("pay.processing"));
    try {
      const r = await authFetch("/api/payments/blik/create", {
        method: "POST",
        body: JSON.stringify({ ride_id, blik_code: code }),
      });
      const data = await r.json();
      if (!r.ok) {
        setStatus(t("common.error") + ": " + (data.detail || ""));
        setBusy(false);
        return;
      }
      setStatus(t("pay.blik_confirm_in_app"));
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const sr = await authFetch(`/api/payments/${ride_id}/status`);
          const sd = await sr.json();
          if (sd.status === "succeeded") {
            clearInterval(interval);
            setStatus(t("pay.success"));
            setTimeout(() => router.replace({ pathname: "/passenger/receipt", params: { ride_id: ride_id! } }), 1200);
          } else if (["canceled", "requires_payment_method"].includes(sd.status) || attempts > 30) {
            clearInterval(interval);
            setStatus(t("pay.blik_fail"));
            setBusy(false);
          }
        } catch {}
      }, 2000);
    } catch (e: any) {
      setStatus(t("common.error") + ": " + e.message);
      setBusy(false);
    }
  };

  const skipToReceipt = () => {
    router.replace({ pathname: "/passenger/receipt", params: { ride_id: ride_id! } });
  };

  if (!ride) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator color="#0F0F0F" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/passenger/home")} style={styles.back}>
          <Ionicons name="close" size={26} color="#0F0F0F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("pay.blik_title")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>{t("pay.amount")}</Text>
          <Text style={styles.amount}>{ride.price_pln?.toFixed(2)} {t("common.pln")}</Text>
          <Text style={styles.from}>{ride.pickup_address} → {ride.dest_address}</Text>
        </View>

        <View style={styles.blikCard}>
          <View style={styles.blikRow}>
            <View style={styles.blikLogo}>
              <Text style={styles.blikLogoText}>BLIK</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.blikTitle}>{t("pay.blik_enter")}</Text>
              <Text style={styles.blikSub}>{t("pay.blik_sub")}</Text>
            </View>
          </View>

          <TextInput
            testID="blik-code-input"
            value={code}
            onChangeText={(tt) => setCode(tt.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="123 456"
            placeholderTextColor="#A3A3A3"
            keyboardType="number-pad"
            maxLength={6}
            editable={!busy}
            style={styles.codeInput}
          />

          {status && (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          )}

          <TouchableOpacity
            testID="pay-blik-btn"
            style={[styles.payBtn, (code.length !== 6 || busy) && { opacity: 0.4 }]}
            disabled={code.length !== 6 || busy}
            onPress={pay}
          >
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.payBtnText}>{t("pay.pay_with_amount").replace("{amount}", ride.price_pln?.toFixed(2))}</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.skipBtn} onPress={skipToReceipt}>
          <Text style={styles.skipText}>{t("pay.skip_cash")}</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>{t("pay.stripe_note")}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingTop: Platform.OS === "ios" ? 56 : 40, paddingBottom: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "900", color: "#0F0F0F" },
  scroll: { padding: 20, paddingBottom: 60 },
  amountBox: { backgroundColor: "#FFD600", padding: 24, borderRadius: 18, alignItems: "center", marginBottom: 20 },
  amountLabel: { fontSize: 11, color: "#0F0F0F", letterSpacing: 1.6, fontWeight: "800" },
  amount: { fontSize: 42, fontWeight: "900", color: "#0F0F0F", marginTop: 4, letterSpacing: -1 },
  from: { fontSize: 13, color: "#0F0F0F", fontWeight: "600", marginTop: 8, textAlign: "center" },
  blikCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "#E5E5E5" },
  blikRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  blikLogo: { backgroundColor: "#0F0F0F", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  blikLogoText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16, letterSpacing: 1 },
  blikTitle: { fontSize: 17, fontWeight: "900", color: "#0F0F0F" },
  blikSub: { fontSize: 12, color: "#525252", marginTop: 2 },
  codeInput: { backgroundColor: "#FAFAFA", borderWidth: 2, borderColor: "#E5E5E5", borderRadius: 14, padding: 18, fontSize: 28, fontWeight: "900", color: "#0F0F0F", textAlign: "center", letterSpacing: 8, marginBottom: 14 },
  statusBox: { padding: 12, backgroundColor: "#FAFAFA", borderRadius: 10, marginBottom: 14 },
  statusText: { color: "#0F0F0F", fontSize: 13, fontWeight: "600", textAlign: "center" },
  payBtn: { height: 56, backgroundColor: "#0F0F0F", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  payBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  skipBtn: { alignItems: "center", paddingVertical: 16, marginTop: 8 },
  skipText: { color: "#525252", fontWeight: "700", fontSize: 13 },
  footer: { textAlign: "center", color: "#A3A3A3", fontSize: 11, marginTop: 16, fontWeight: "500" },
});
