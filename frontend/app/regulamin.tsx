import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { TERMS, TERMS_UPDATED, COMPANY } from "../data/legal";

export default function TermsPage() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1c1c1e" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Regulamin</Text>
            <Text style={s.headerSub}>Aktualizacja: {TERMS_UPDATED}</Text>
          </View>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.intro}>
          <Ionicons name="document-text" size={32} color="#0d47a1" />
          <Text style={s.introText}>Regulamin świadczenia usług przewozowych i organizacji wycieczek przez {COMPANY.name}.</Text>
        </View>
        <RichText text={TERMS} />
        <View style={s.contactBox}>
          <Text style={s.contactTitle}>📞 Reklamacje i kontakt</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${COMPANY.email}`)}>
            <Text style={s.link}>✉️ {COMPANY.email}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${COMPANY.phoneIntl}`)}>
            <Text style={s.link}>📞 {COMPANY.phoneIntl}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function RichText({ text }: { text: string }) {
  const lines = text.trim().split("\n");
  return (
    <View>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={i} style={{ height: 6 }} />;
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return <Text key={i} style={s.h}>{trimmed.replace(/\*\*/g, "")}</Text>;
        }
        return <Text key={i} style={s.p}>{trimmed}</Text>;
      })}
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1c1c1e" },
  headerSub: { fontSize: 11, color: "#8e8e93", marginTop: 1 },
  scroll: { padding: 18, paddingBottom: 40 },
  intro: { flexDirection: "row", gap: 12, backgroundColor: "#e3f2fd", padding: 14, borderRadius: 12, marginBottom: 16, alignItems: "center" },
  introText: { flex: 1, fontSize: 13, color: "#1c1c1e", lineHeight: 18 },
  h: { fontSize: 15, fontWeight: "800", color: "#1c1c1e", marginTop: 18, marginBottom: 8, lineHeight: 22 },
  p: { fontSize: 13.5, color: "#3c3c43", lineHeight: 20, marginBottom: 4 },
  contactBox: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginTop: 24, borderWidth: 1, borderColor: "#eee" },
  contactTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10, color: "#1c1c1e" },
  link: { fontSize: 14, color: "#0d47a1", paddingVertical: 6, fontWeight: "600" },
});
