import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, StatusBar } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTripBySlug } from "../../data/trips";

export default function TripDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const slug = (params.slug as string) || "";
  const trip = getTripBySlug(slug);

  if (!trip) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Wycieczka nie znaleziona</Text>
        <TouchableOpacity onPress={() => router.push("/wycieczki" as any)}>
          <Text style={{ color: "#2E7D32", marginTop: 12 }}>Powrót do listy</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleReserve = () => {
    Alert.alert(
      "🚧 Wkrótce dostępne",
      `Rezerwacja "${trip.title}" za ${trip.price} zł/os.\n\nKalendarz dostępności, miejsce odbioru i płatność Stripe BLIK będą dostępne w kolejnej aktualizacji.`,
      [{ text: "OK", style: "default" }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fafafa" }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: trip.heroImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.flagBig}>
                <Text style={styles.flagBigText}>{trip.flag === "PL" ? "🇵🇱 POLSKA" : "🇸🇰 SŁOWACJA"}</Text>
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

        <View style={styles.priceBar}>
          <View>
            <Text style={styles.priceLabel}>Cena od osoby</Text>
            <Text style={[styles.priceValue, { color: trip.accent }]}>{trip.price} zł <Text style={styles.priceUnit}>/os</Text></Text>
          </View>
          <View style={[styles.durationPill, { backgroundColor: trip.bgAccent }]}>
            <Text style={[styles.durationText, { color: trip.accent }]}>⏱️ {trip.duration}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Galeria ({trip.gallery.length} zdjęć)</Text>
          <View style={styles.gallery}>
            {trip.gallery.map((url, i) => (
              <Image key={i} source={{ uri: url }} style={styles.galleryImg} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Plan dnia</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Trasa na mapie</Text>
          <Image source={{ uri: trip.mapImage }} style={styles.mapImage} resizeMode="cover" />
          <Text style={styles.mapLegend}>{trip.mapLegend}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Charakter wycieczki</Text>
          <Text style={styles.climateSubtitle}>{trip.climateSubtitle}</Text>
          {trip.climateList.map((item, i) => (
            <Text key={i} style={styles.climateItem}>• {item}</Text>
          ))}
          <View style={[styles.climateHighlight, { backgroundColor: trip.bgAccent }]}>
            <Text style={[styles.climateHighlightText, { color: trip.accent }]}>🍂 {trip.climateHighlight}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Co w cenie ({trip.price} zł/os)</Text>
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
          <Text style={styles.ctaBtnText}>Zarezerwuj teraz — {trip.price} zł/os</Text>
        </TouchableOpacity>
      </SafeAreaView>
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
  section: { padding: 20, backgroundColor: "#fff", borderTopWidth: 8, borderTopColor: "#f5f5f7" },
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
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  galleryImg: { width: "32.5%", aspectRatio: 1, borderRadius: 8 },
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
