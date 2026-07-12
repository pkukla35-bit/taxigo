import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { TRIPS } from "../../data/trips";
import { localizeTrip } from "../../data/trips_en";
import { useLanguage } from "../../contexts/LanguageContext";
import LegalFooter from "../../components/LegalFooter";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

export default function WycieczkiIndex() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isTablet = width >= 640 && width < 900;
  const cardsPerRow = isDesktop ? 3 : isTablet ? 2 : 1;
  const cardWidth = isDesktop || isTablet ? `${100 / cardsPerRow - 2}%` as any : "100%";

  const localized = TRIPS.map((trip) => localizeTrip(trip, lang));

  const sorted = [...localized].sort((a, b) => {
    if (a.badge.includes("NUMBER")) return -1;
    if (b.badge.includes("NUMBER")) return 1;
    if (a.badge.includes("BESTSELLER")) return 1;
    if (b.badge.includes("BESTSELLER")) return -1;
    return 0;
  });

  const WHY_FEATURES = [
    { icon: "🎯", name: t("trips.why_small_groups_name"), desc: t("trips.why_small_groups_desc") },
    { icon: "🚗", name: t("trips.why_driver_name"), desc: t("trips.why_driver_desc") },
    { icon: "📍", name: t("trips.why_pickup_name"), desc: t("trips.why_pickup_desc") },
    { icon: "🎫", name: t("trips.why_tickets_name"), desc: t("trips.why_tickets_desc") },
    { icon: "💵", name: t("trips.why_payment_name"), desc: t("trips.why_payment_desc") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#fafafa" }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: TRIPS[2].heroImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.push("/" as any)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.brandPill}>
                <Text style={styles.brandPillText}>TAXI<Text style={{ color: "#1c1c1e" }}>GO</Text> Trips</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <LanguageSwitcher compact />
                <TouchableOpacity onPress={() => router.push("/wycieczki/admin" as any)} style={styles.backBtn} testID="open-admin">
                  <Ionicons name="settings-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
          <View style={[styles.heroContent, isDesktop && { maxWidth: 1200, alignSelf: "center", width: "100%", left: 0, right: 0, paddingHorizontal: 32 }]}>
            <Text style={[styles.heroTitle, isDesktop && { fontSize: 48, lineHeight: 54 }]}>{t("trips.hero_title")}</Text>
            <Text style={[styles.heroSubtitle, isDesktop && { fontSize: 16, marginTop: 14, maxWidth: 600 }]}>{t("trips.hero_subtitle")}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statNum}>5</Text><Text style={styles.statLabel}>{t("trips.stat_trips")}</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>2</Text><Text style={styles.statLabel}>{t("trips.stat_countries")}</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>100%</Text><Text style={styles.statLabel}>{t("trips.stat_personal")}</Text></View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>{t("trips.section_title")}</Text>
          <Text style={styles.sectionSubtitle}>{t("trips.section_subtitle")}</Text>
          <View style={[styles.cardsGrid, (isDesktop || isTablet) && styles.cardsGridRow]}>
          {sorted.map((trip) => (
            <TouchableOpacity
              key={trip.slug}
              activeOpacity={0.85}
              style={[styles.tripCard, (isDesktop || isTablet) && { width: cardWidth, marginBottom: 20 }]}
              onPress={() => router.push(`/wycieczki/${trip.slug}` as any)}
            >
              <View style={styles.cardImageWrap}>
                <Image source={{ uri: trip.heroImage }} style={styles.cardImage} />
                <View style={styles.cardImageOverlay} />
                <View style={[styles.badge, { backgroundColor: trip.badgeColors[0] }]}>
                  <Text style={styles.badgeText}>{trip.badge}</Text>
                </View>
                <View style={styles.flagMini}>
                  <Text style={styles.flagMiniText}>{trip.flag === "PL" ? "🇵🇱 PL" : "🇸🇰 SK"}</Text>
                </View>
                <View style={styles.cardImageContent}>
                  <Text style={styles.cardTitle}>
                    {trip.title.replace(" z Krakowa", "").replace(" from Krakow", "")}
                  </Text>
                  <Text style={styles.cardSubtitle}>{trip.subtitle}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardInfoText}>⏱️ {trip.duration}</Text>
                  <Text style={styles.cardInfoText}>📍 {trip.attractionsCount} {t("trips.card_attractions")}</Text>
                  <Text style={styles.cardInfoText}>👥 {t("trips.card_max_people")} {trip.maxPeople} {t("trips.card_people_short")}</Text>
                </View>
                <View style={styles.cardPrice}>
                  <Text style={[styles.cardPriceValue, { color: trip.accent }]}>{trip.price} zł</Text>
                  <Text style={styles.cardPriceUnit}>{t("trips.card_per_car")}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          </View>
        </View>

        <View style={styles.whyUs}>
          <Text style={styles.whyTitle}>{t("trips.why_title")}</Text>
          {WHY_FEATURES.map((f, i) => (
            <View key={i} style={styles.feature}>
              <View style={styles.featureIcon}><Text style={{ fontSize: 18 }}>{f.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureName}>{f.name}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
        <LegalFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 340, position: "relative" },
  heroImage: { width: "100%", height: "100%", position: "absolute" },
  heroOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  brandPill: { backgroundColor: "rgba(255,255,255,0.95)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  brandPillText: { color: "#FFD700", fontSize: 13, fontWeight: "700" },
  heroContent: { position: "absolute", bottom: 26, left: 22, right: 22, zIndex: 5 },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "900", lineHeight: 34 },
  heroSubtitle: { color: "rgba(255,255,255,0.95)", fontSize: 13, marginTop: 10 },
  stats: { flexDirection: "row", padding: 18, backgroundColor: "#fff", borderBottomWidth: 8, borderBottomColor: "#f5f5f7" },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800", color: "#2E7D32" },
  statLabel: { fontSize: 10, color: "#8e8e93", marginTop: 2, fontWeight: "600" },
  section: { padding: 20 },
  sectionDesktop: { maxWidth: 1200, alignSelf: "center", width: "100%", paddingHorizontal: 32 },
  cardsGrid: {},
  cardsGridRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4, color: "#1c1c1e" },
  sectionSubtitle: { fontSize: 13, color: "#6e6e73", marginBottom: 16 },
  tripCard: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  cardImageWrap: { position: "relative", height: 200 },
  cardImage: { width: "100%", height: "100%" },
  cardImageOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" },
  badge: { position: "absolute", top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  flagMini: { position: "absolute", top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.5)" },
  flagMiniText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardImageContent: { position: "absolute", bottom: 14, left: 16, right: 16 },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  cardSubtitle: { color: "rgba(255,255,255,0.95)", fontSize: 12 },
  cardBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  cardInfo: { flexDirection: "row", gap: 10, flexWrap: "wrap", flex: 1 },
  cardInfoText: { fontSize: 11, color: "#6e6e73" },
  cardPrice: { flexDirection: "row", alignItems: "baseline" },
  cardPriceValue: { fontSize: 18, fontWeight: "800" },
  cardPriceUnit: { fontSize: 11, color: "#8e8e93", marginLeft: 2 },
  whyUs: { backgroundColor: "#2E7D32", padding: 22 },
  whyTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 18 },
  feature: { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  featureName: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  featureDesc: { color: "rgba(255,255,255,0.9)", fontSize: 12 },
});
