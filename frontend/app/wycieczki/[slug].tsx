import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, StatusBar, Modal, Dimensions, Pressable, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTripBySlug } from "../../data/trips";
import { localizeTrip } from "../../data/trips_en";
import { useLanguage } from "../../contexts/LanguageContext";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export default function TripDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const slug = (params.slug as string) || "";
  const { lang, t } = useLanguage();
  const { width: winW } = useWindowDimensions();
  const isDesktop = winW >= 900;
  const baseTrip = getTripBySlug(slug);
  const trip = baseTrip ? localizeTrip(baseTrip, lang) : undefined;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!trip) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>{t("trip.not_found")}</Text>
        <TouchableOpacity onPress={() => router.push("/wycieczki" as any)}>
          <Text style={{ color: "#2E7D32", marginTop: 12 }}>{t("trip.back_list")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleReserve = () => {
    router.push(`/wycieczki/${trip.slug}/rezerwacja` as any);
  };

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const showPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + trip.gallery.length) % trip.gallery.length);
  };
  const showNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % trip.gallery.length);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fafafa" }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, isDesktop && { height: 320 }]}>
          <Image source={{ uri: trip.heroImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <LanguageSwitcher compact />
                <View style={styles.flagBig}>
                  <Text style={styles.flagBigText}>{trip.flag === "PL" ? t("trip.poland") : t("trip.slovakia")}</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
          <View style={styles.heroContent}>
            <View style={[styles.badge, { backgroundColor: trip.badgeColors[0] }]}>
              <Text style={styles.badgeText}>{trip.badge}</Text>
            </View>
            <Text style={styles.heroTitle}>{trip.title}</Text>
            <Text style={styles.heroSubtitle}>{trip.subtitle}</Text>
          </View>
        </View>

        <View style={[styles.priceBar, isDesktop && styles.wideCenter]}>
          <View>
            <Text style={styles.priceLabel}>{fmt(t("trip.price_label"), { n: trip.maxPeople || 4 })}</Text>
            <Text style={[styles.priceValue, { color: trip.accent }]}>{trip.price} zł</Text>
          </View>
          <View style={[styles.durationPill, { backgroundColor: trip.bgAccent }]}>
            <Text style={[styles.durationText, { color: trip.accent }]}>⏱️ {trip.duration}</Text>
          </View>
        </View>

        <View style={[styles.transportBadge, isDesktop && { maxWidth: 1200, alignSelf: "center", width: "100%", marginHorizontal: 0 }]}>
          <Ionicons name="car-sport" size={18} color="#1565c0" />
          <View style={{ flex: 1 }}>
            <Text style={styles.transportTitle}>{t("trip.transport_title")}</Text>
            <Text style={styles.transportSub}>{fmt(t("trip.transport_sub"), { n: trip.maxPeople })}</Text>
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>{t("trip.about_title")}</Text>
          {trip.description.split("\n\n").map((para, i) => (
            <Text key={i} style={styles.descPara}>{para}</Text>
          ))}
          {trip.highlights && trip.highlights.length > 0 && (
            <View style={[styles.highlightsBox, { backgroundColor: trip.bgAccent, borderColor: trip.accent }]}>
              <Text style={[styles.highlightsTitle, { color: trip.accent }]}>{t("trip.in_short_title")}</Text>
              {trip.highlights.map((h, i) => (
                <Text key={i} style={styles.highlightItem}>{h}</Text>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>{fmt(t("trip.gallery_title"), { n: trip.gallery.length })}</Text>
          <Text style={styles.galleryHint}>{t("trip.gallery_hint")}</Text>
          <View style={styles.gallery}>
            {trip.gallery.map((url, i) => (
              <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => openLightbox(i)} style={[styles.galleryItem, isDesktop && { width: "32%", aspectRatio: 4/3, marginBottom: 8 }, !isDesktop && { width: "49%", aspectRatio: 4/3 }]}>
                <Image source={{ uri: url }} style={styles.galleryImg} />
                <View style={styles.galleryZoomBadge}>
                  <Ionicons name="expand" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>{t("trip.plan_title")}</Text>
          <View style={styles.timeline}>
            <View style={[styles.timelineLine, { backgroundColor: "#e5e5ea" }]} />
            {trip.timeline.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={[styles.stepDot, { borderColor: trip.accent }]} />
                <View style={{ flex: 1, marginLeft: 22 }}>
                  <Text style={[styles.stepTime, { color: trip.accent }]}>{step.time}</Text>
                  <Text style={styles.stepTitle}>{step.icon} {step.title}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>{t("trip.map_title")}</Text>
          <Image source={{ uri: trip.mapImage }} style={[styles.mapImage, isDesktop && { height: 400 }]} resizeMode="cover" />
          <Text style={styles.mapLegend}>{trip.mapLegend}</Text>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>{t("trip.character_title")}</Text>
          <Text style={styles.climateSubtitle}>{trip.climateSubtitle}</Text>
          {trip.climateList.map((item, i) => (
            <Text key={i} style={styles.climateItem}>• {item}</Text>
          ))}
          <View style={[styles.climateHighlight, { backgroundColor: trip.bgAccent }]}>
            <Text style={[styles.climateHighlightText, { color: trip.accent }]}>🍂 {trip.climateHighlight}</Text>
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>{fmt(t("trip.included_title"), { price: trip.price })}</Text>
          <View style={styles.includedBox}>
            {trip.included.map((item, i) => (
              <Text key={i} style={styles.includedItem}>✅ {item}</Text>
            ))}
          </View>
          <View style={styles.excludedBox}>
            {trip.excluded.map((item, i) => (
              <Text key={i} style={styles.excludedItem}>⚠️ {item}</Text>
            ))}
            <Text style={styles.excludedNote}>{trip.ctaNote}</Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.ctaBar}>
        <TouchableOpacity activeOpacity={0.85} style={[styles.ctaBtn, { backgroundColor: trip.accent }]} onPress={handleReserve}>
          <Ionicons name="calendar" size={18} color="#fff" />
          <Text style={styles.ctaBtnText}>{fmt(t("trip.cta_reserve"), { price: trip.price })}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* LIGHTBOX MODAL */}
      <Modal
        visible={lightboxIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={closeLightbox}
        statusBarTranslucent
      >
        <View style={styles.lightboxBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeLightbox} />

          {lightboxIndex !== null && (
            <>
              <Image
                source={{ uri: trip.gallery[lightboxIndex] }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />

              <SafeAreaView edges={["top"]} style={styles.lightboxTopBar} pointerEvents="box-none">
                <View style={styles.lightboxCounter}>
                  <Text style={styles.lightboxCounterText}>
                    {lightboxIndex + 1} / {trip.gallery.length}
                  </Text>
                </View>
                <TouchableOpacity onPress={closeLightbox} style={styles.lightboxCloseBtn}>
                  <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </SafeAreaView>

              {trip.gallery.length > 1 && (
                <>
                  <TouchableOpacity onPress={showPrev} style={[styles.lightboxNavBtn, styles.lightboxNavLeft]}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={showNext} style={[styles.lightboxNavBtn, styles.lightboxNavRight]}>
                    <Ionicons name="chevron-forward" size={28} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 360, position: "relative" },
  heroImage: { width: "100%", height: "100%", position: "absolute" },
  heroOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  flagBig: { backgroundColor: "rgba(255,255,255,0.95)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  flagBigText: { color: "#1c1c1e", fontSize: 12, fontWeight: "700" },
  heroContent: { position: "absolute", bottom: 24, left: 20, right: 20, zIndex: 5 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 8 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800", lineHeight: 28, marginBottom: 6 },
  heroSubtitle: { color: "rgba(255,255,255,0.95)", fontSize: 13 },
  priceBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  priceLabel: { fontSize: 12, color: "#8e8e93" },
  priceValue: { fontSize: 26, fontWeight: "800" },
  priceUnit: { fontSize: 13, color: "#8e8e93", fontWeight: "500" },
  durationPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  durationText: { fontSize: 13, fontWeight: "700" },
  transportBadge: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: "#e3f2fd", marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: "#bbdefb" },
  transportTitle: { fontSize: 14, fontWeight: "700", color: "#1565c0" },
  transportSub: { fontSize: 11, color: "#1976d2", marginTop: 2 },
  section: { padding: 20, backgroundColor: "#fff", borderTopWidth: 8, borderTopColor: "#f5f5f7" },
  sectionDesktop: { maxWidth: 1200, alignSelf: "center", width: "100%", paddingHorizontal: 40, paddingVertical: 32 },
  wideCenter: { maxWidth: 1200, alignSelf: "center", width: "100%", paddingHorizontal: 32 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14, color: "#1c1c1e" },
  timeline: { position: "relative", paddingLeft: 12 },
  timelineLine: { position: "absolute", left: 18, top: 8, bottom: 8, width: 2 },
  step: { flexDirection: "row", paddingVertical: 10, alignItems: "flex-start" },
  stepDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#FFD700", borderWidth: 3, marginTop: 4 },
  stepTime: { fontSize: 13, fontWeight: "700" },
  stepTitle: { fontSize: 15, fontWeight: "600", marginVertical: 2, color: "#1c1c1e" },
  stepDesc: { fontSize: 13, color: "#6e6e73" },
  mapImage: { width: "100%", height: 220, borderRadius: 12 },
  mapLegend: { marginTop: 10, fontSize: 11, color: "#8e8e93", textAlign: "center" },
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
  galleryItem: { width: "49%", aspectRatio: 4/3, position: "relative", marginBottom: 8 },
  galleryImg: { width: "100%", height: "100%", borderRadius: 10 },
  galleryZoomBadge: { position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 10, padding: 4 },
  galleryHint: { fontSize: 12, color: "#8e8e93", marginBottom: 10, marginTop: -8 },
  descPara: { fontSize: 14, color: "#3a3a3c", lineHeight: 22, marginBottom: 12 },
  highlightsBox: { marginTop: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  highlightsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  highlightItem: { fontSize: 13, color: "#1c1c1e", paddingVertical: 3, lineHeight: 19 },
  lightboxBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)", alignItems: "center", justifyContent: "center" },
  lightboxImage: { width: SCREEN_W, height: SCREEN_H * 0.85 },
  lightboxTopBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8 },
  lightboxCounter: { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  lightboxCounterText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  lightboxCloseBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  lightboxNavBtn: { position: "absolute", top: "50%", marginTop: -24, width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  lightboxNavLeft: { left: 12 },
  lightboxNavRight: { right: 12 },
  climateSubtitle: { fontSize: 13, color: "#1c1c1e", marginBottom: 12, lineHeight: 18 },
  climateItem: { fontSize: 13, color: "#6e6e73", marginVertical: 2, lineHeight: 19 },
  climateHighlight: { padding: 12, borderRadius: 10, marginTop: 14 },
  climateHighlightText: { fontSize: 13, fontWeight: "600" },
  includedBox: { backgroundColor: "#d4edda", padding: 12, borderRadius: 10, marginBottom: 10 },
  includedItem: { fontSize: 13, color: "#155724", paddingVertical: 3 },
  excludedBox: { backgroundColor: "#fff3cd", padding: 12, borderRadius: 10 },
  excludedItem: { fontSize: 13, color: "#856404", paddingVertical: 3 },
  excludedNote: { marginTop: 8, fontSize: 11, color: "#856404", opacity: 0.85 },
  ctaBar: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e5ea", padding: 14, paddingHorizontal: 20 },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14 },
  ctaBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
