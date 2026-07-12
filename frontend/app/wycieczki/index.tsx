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
  const isDesktop = width >= 1100;
  const isTablet = width >= 640 && width < 1100;
  const cardsPerRow = isDesktop ? 4 : isTablet ? 2 : 2;
  const gap = 16;
  const cardWidth = width >= 640 ? `${100 / cardsPerRow - 2}%` as any : "48%";

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
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
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
          <View style={styles.cardsGridRow}>
          {sorted.map((trip) => (
            <TouchableOpacity
              key={trip.slug}
              activeOpacity={0.85}
              style={[styles.tripCard, { width: cardWidth }]}
              onPress={() => router.push(`/wycieczki/${trip.slug}` as any)}
            >
              <View style={styles.cardImageWrap}>
                <Image source={{ uri: trip.heroImage }} style={styles.cardImage} />
                <View style={[styles.badge, { backgroundColor: trip.badgeColors[0] }]}>
                  <Text style={styles.badgeText}>{trip.badge}</Text>
                </View>
                <View style={styles.flagMini}>
                  <Text style={styles.flagMiniText}>{trip.flag === "PL" ? "🇵🇱" : "🇸🇰"}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {trip.title.replace(" z Krakowa", "").replace(" from Krakow", "").toUpperCase()}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>{trip.subtitle}</Text>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMetaText}>⏱️ {trip.duration}</Text>
                  <Text style={styles.cardMetaText}>👥 max {trip.maxPeople}</Text>
                </View>
                <View style={styles.cardPriceRow}>
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
  heroDesktop: { height: 600 },
  heroImage: { width: "100%", height: "100%", position: "absolute" },
  heroOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" },
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
  tripCard: { backgroundColor: "#fff", borderRadius: 8, marginBottom: 24, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardImageWrap: { position: "relative", aspectRatio: 3/4, width: "100%" },
  cardImage: { width: "100%", height: "100%" },
  cardImageOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0)" },
  badge: { position: "absolute", top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  flagMini: { position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  flagMiniText: { fontSize: 16 },
  cardImageContent: { display: "none" },
  cardTitle: { color: "#1c1c1e", fontSize: 15, fontWeight: "800", marginBottom: 6, letterSpacing: 0.3, lineHeight: 20 },
  cardSubtitle: { color: "#8e8e93", fontSize: 12, lineHeight: 16, marginBottom: 10 },
  cardBody: { padding: 16, backgroundColor: "#fff" },
  cardInfo: { display: "none" },
  cardInfoText: { display: "none" as any },
  cardMetaRow: { flexDirection: "row", gap: 12, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  cardMetaText: { fontSize: 11, color: "#6e6e73", fontWeight: "500" },
  cardPriceRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  cardPrice: { flexDirection: "row", alignItems: "baseline" },
  cardPriceValue: { fontSize: 22, fontWeight: "800" },
  cardPriceUnit: { fontSize: 12, color: "#8e8e93", marginLeft: 2, fontWeight: "500" },
  whyUs: { backgroundColor: "#2E7D32", padding: 22 },
  whyTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 18 },
  feature: { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  featureName: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  featureDesc: { color: "rgba(255,255,255,0.9)", fontSize: 12 },
});
