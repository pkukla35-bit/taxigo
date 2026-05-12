import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";

type DeferredPrompt = { prompt: () => void; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> } | null;

export default function ShareApp() {
  const router = useRouter();
  const url = (process.env.EXPO_PUBLIC_BACKEND_URL as string) || "https://taxigo.app";
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPrompt>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const ua = window.navigator.userAgent || "";
    const iOS = /iPhone|iPad|iPod/i.test(ua) && !(window as any).MSStream;
    setIsIOS(iOS);

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) setInstalled(true);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const installedHandler = () => setInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (Platform.OS !== "web") {
      Alert.alert("TAXIGO", "Już używasz aplikacji mobilnej 🎉");
      return;
    }
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      Alert.alert(
        "Instalacja",
        "Twoja przeglądarka nie pokazała przycisku instalacji. Otwórz menu przeglądarki (⋮) i wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”."
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="qr-back-btn" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0F0F0F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pobierz TAXIGO</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>ZAINSTALUJ NA TELEFONIE</Text>
        <Text style={styles.title}>TAXIGO{"\n"}w jednym tapnięciu</Text>

        {installed ? (
          <View style={styles.installedBox} testID="installed-box">
            <View style={styles.installedIcon}>
              <Ionicons name="checkmark" size={36} color="#0F0F0F" />
            </View>
            <Text style={styles.installedTitle}>Aplikacja zainstalowana!</Text>
            <Text style={styles.installedSub}>Znajdziesz ją na ekranie głównym telefonu.</Text>
          </View>
        ) : (
          <TouchableOpacity
            testID="install-app-btn"
            style={styles.installBtn}
            onPress={handleInstall}
            activeOpacity={0.9}
          >
            <View style={styles.installIcon}>
              <Ionicons name="download" size={22} color="#FFD600" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.installTitle}>Pobierz aplikację</Text>
              <Text style={styles.installSub}>
                {isIOS ? "Instrukcja dla iPhone/iPad" : (deferredPrompt ? "Zainstaluj na telefonie" : "Otwórz na telefonie")}
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="#FFD600" />
          </TouchableOpacity>
        )}

        {showIOSHelp && (
          <View style={styles.iosHelp} testID="ios-help-box">
            <Text style={styles.iosHelpTitle}>📱 Jak zainstalować na iPhone</Text>
            <View style={styles.iosStep}><Text style={styles.iosStepNum}>1.</Text><Text style={styles.iosStepText}>Otwórz tę stronę w przeglądarce <Text style={{ fontWeight: "900" }}>Safari</Text></Text></View>
            <View style={styles.iosStep}><Text style={styles.iosStepNum}>2.</Text><Text style={styles.iosStepText}>Naciśnij ikonę <Text style={{ fontWeight: "900" }}>Udostępnij</Text> (kwadrat ze strzałką ⬆️) na dole ekranu</Text></View>
            <View style={styles.iosStep}><Text style={styles.iosStepNum}>3.</Text><Text style={styles.iosStepText}>Wybierz <Text style={{ fontWeight: "900" }}>„Do ekranu początkowego”</Text></Text></View>
            <View style={styles.iosStep}><Text style={styles.iosStepNum}>4.</Text><Text style={styles.iosStepText}>Kliknij <Text style={{ fontWeight: "900" }}>„Dodaj”</Text> – ikona TAXIGO pojawi się na ekranie głównym</Text></View>
          </View>
        )}

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>LUB UDOSTĘPNIJ</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.qrCard} testID="qr-code-card">
          <View style={styles.qrInner}>
            <QRCode value={url} size={200} color="#0F0F0F" backgroundColor="#FFFFFF" />
          </View>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>TAXIGO</Text>
          </View>
          <Text style={styles.qrHint}>Zeskanuj aparatem telefonu</Text>
        </View>

        <Text style={styles.urlLabel}>Link do aplikacji</Text>
        <View style={styles.urlBox}>
          <Ionicons name="link" size={16} color="#525252" />
          <Text style={styles.urlText} numberOfLines={1} testID="app-url-text">{url}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 56 : 40, paddingBottom: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#0F0F0F" },
  scroll: { padding: 22, paddingBottom: 60 },
  eyebrow: { color: "#525252", letterSpacing: 2.4, fontSize: 11, fontWeight: "700", marginBottom: 8 },
  title: { fontSize: 30, fontWeight: "900", color: "#0F0F0F", letterSpacing: -1, marginBottom: 24 },
  installBtn: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#0F0F0F", padding: 18, borderRadius: 18 },
  installIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,214,0,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,214,0,0.4)" },
  installTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  installSub: { color: "#A3A3A3", fontSize: 12, marginTop: 2, fontWeight: "600" },
  installedBox: { backgroundColor: "#FFD600", borderRadius: 18, padding: 22, alignItems: "center", gap: 8 },
  installedIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  installedTitle: { color: "#0F0F0F", fontSize: 20, fontWeight: "900" },
  installedSub: { color: "#0F0F0F", fontSize: 13, fontWeight: "600", textAlign: "center" },
  iosHelp: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18, marginTop: 14, borderWidth: 1, borderColor: "#E5E5E5", gap: 10 },
  iosHelpTitle: { fontSize: 16, fontWeight: "900", color: "#0F0F0F", marginBottom: 4 },
  iosStep: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  iosStepNum: { color: "#FFD600", fontWeight: "900", fontSize: 16, width: 22 },
  iosStepText: { flex: 1, color: "#0F0F0F", fontSize: 14, lineHeight: 20, fontWeight: "500" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 24 },
  orLine: { flex: 1, height: 1, backgroundColor: "#E5E5E5" },
  orText: { color: "#A3A3A3", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  qrCard: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 24, alignItems: "center", borderWidth: 1, borderColor: "#E5E5E5" },
  qrInner: { padding: 10, backgroundColor: "#FFFFFF", borderRadius: 12 },
  brandBadge: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 6, backgroundColor: "#FFD600", borderRadius: 999 },
  brandBadgeText: { fontWeight: "900", color: "#0F0F0F", letterSpacing: 1 },
  qrHint: { color: "#525252", fontSize: 12, marginTop: 8, fontWeight: "600" },
  urlLabel: { fontSize: 12, color: "#525252", fontWeight: "700", letterSpacing: 1.5, marginTop: 24, marginBottom: 8 },
  urlBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#E5E5E5" },
  urlText: { color: "#0F0F0F", fontWeight: "600", flex: 1, fontSize: 12 },
});
