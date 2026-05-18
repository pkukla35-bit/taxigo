import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BG = "https://images.unsplash.com/photo-1763865454099-0a3566bdc030?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjaXR5JTIwc3RyZWV0JTIwc3Vuc2V0fGVufDB8fHx8MTc3ODUxMzI1MHww&ixlib=rb-4.1.0&q=85";

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (loading) return;
    if (user && user.role) {
      router.replace(user.role === "passenger" ? "/passenger/home" : "/driver/home");
    }
  }, [user, loading, router]);

  const choose = async (role: "passenger" | "driver") => {
    await AsyncStorage.setItem("pending_role", role);
    router.push({ pathname: "/login", params: { role } });
  };

  return (
    <ImageBackground source={{ uri: BG }} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay}>
        <View style={styles.topRow}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>T</Text>
            </View>
            <Text style={styles.brand} testID="brand-title">TAXIGO</Text>
            <Text style={styles.tagline}>{t("index.tagline")}</Text>
          </View>
          <LanguageSwitcher variant="dark" />
        </View>

        <View style={styles.cardsWrap}>
          <Text style={styles.eyebrow}>{t("index.choose_role").toUpperCase()}</Text>

          <TouchableOpacity
            testID="trips-btn"
            activeOpacity={0.85}
            style={[styles.card, styles.cardTrips]}
            onPress={() => router.push("/wycieczki" as any)}
          >
            <View style={styles.iconCircleTrips}>
              <Ionicons name="map" size={26} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleLight}>🚐 Wycieczki turystyczne</Text>
              <Text style={styles.cardSubLight}>Pieniny • Słowacja • Zakopane + 2 więcej</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            testID="role-passenger-btn"
            activeOpacity={0.85}
            style={[styles.card, styles.cardPassenger]}
            onPress={() => choose("passenger")}
          >
            <View style={styles.iconCircleLight}>
              <Ionicons name="person" size={26} color="#0F0F0F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleDark}>{t("index.passenger")}</Text>
              <Text style={styles.cardSubDark}>{t("index.passenger_desc")}</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color="#0F0F0F" />
          </TouchableOpacity>

          <TouchableOpacity
            testID="role-driver-btn"
            activeOpacity={0.85}
            style={[styles.card, styles.cardDriver]}
            onPress={() => choose("driver")}
          >
            <View style={styles.iconCircleDark}>
              <Ionicons name="car-sport" size={26} color="#00E676" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleLight}>{t("index.driver")}</Text>
              <Text style={styles.cardSubLight}>{t("index.driver_desc")}</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            testID="share-app-btn"
            style={styles.shareBtn}
            onPress={() => router.push("/share")}
          >
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>{t("index.download_app")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 24, paddingTop: Platform.OS === "ios" ? 60 : 50, paddingBottom: 32, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  header: { alignItems: "flex-start", flex: 1 },
  logoBadge: { width: 56, height: 56, borderRadius: 14, backgroundColor: "#FFD600", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoBadgeText: { fontSize: 30, fontWeight: "900", color: "#0F0F0F" },
  brand: { fontSize: 44, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1 },
  tagline: { fontSize: 16, color: "rgba(255,255,255,0.85)", marginTop: 6 },
  cardsWrap: { gap: 14 },
  eyebrow: { color: "rgba(255,255,255,0.7)", letterSpacing: 2.4, fontSize: 11, fontWeight: "700", marginBottom: 8 },
  card: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 18, gap: 14 },
  cardPassenger: { backgroundColor: "#FFFFFF" },
  cardDriver: { backgroundColor: "#0A0A0A", borderWidth: 1, borderColor: "#262626" },
  cardTrips: { backgroundColor: "#2E7D32", borderWidth: 1, borderColor: "#43a047" },
  iconCircleLight: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFD600", alignItems: "center", justifyContent: "center" },
  iconCircleDark: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(0,230,118,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,230,118,0.4)" },
  iconCircleTrips: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  cardTitleDark: { color: "#0F0F0F", fontSize: 22, fontWeight: "900" },
  cardSubDark: { color: "#525252", fontSize: 13, marginTop: 2 },
  cardTitleLight: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  cardSubLight: { color: "#A3A3A3", fontSize: 13, marginTop: 2 },
  shareBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", marginTop: 6 },
  shareBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});
