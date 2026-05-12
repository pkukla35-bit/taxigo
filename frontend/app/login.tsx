import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert, ImageBackground } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, Role } from "../contexts/AuthContext";

const BG = "https://images.unsplash.com/photo-1763865454099-0a3566bdc030?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjaXR5JTIwc3RyZWV0JTIwc3Vuc2V0fGVufDB8fHx8MTc3ODUxMzI1MHww&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: Role }>();
  const role: Role = (roleParam as Role) || "passenger";
  const { signInWithSession, user } = useAuth();
  const [busy, setBusy] = useState(false);

  const finalize = useCallback(
    async (url: string) => {
      const hash = url.includes("#") ? url.split("#")[1] : "";
      const query = url.includes("?") ? url.split("?")[1].split("#")[0] : "";
      const params = new URLSearchParams(hash || query);
      const sessionId = params.get("session_id");
      if (!sessionId) return false;
      setBusy(true);
      const u = await signInWithSession(sessionId, role);
      setBusy(false);
      if (u) {
        router.replace(u.role === "driver" || role === "driver" ? "/driver/home" : "/passenger/home");
        return true;
      }
      Alert.alert("Błąd logowania", "Nie udało się zalogować. Spróbuj ponownie.");
      return false;
    },
    [role, router, signInWithSession]
  );

  useEffect(() => {
    if (user && user.role) {
      router.replace(user.role === "driver" ? "/driver/home" : "/passenger/home");
    }
  }, [user, router]);

  useEffect(() => {
    (async () => {
      const initial = await Linking.getInitialURL();
      if (initial && initial.includes("session_id=")) finalize(initial);
    })();
    const sub = Linking.addEventListener("url", (ev) => {
      if (ev.url.includes("session_id=")) finalize(ev.url);
    });
    return () => sub.remove();
  }, [finalize]);

  const handleGoogle = async () => {
    try {
      setBusy(true);
      const redirectUrl =
        Platform.OS === "web"
          ? (typeof window !== "undefined" ? window.location.origin + "/" : "/")
          : Linking.createURL("/");
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      if (Platform.OS === "web") {
        // For web: simply redirect
        window.location.href = authUrl;
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type === "success" && result.url) {
        await finalize(result.url);
      } else {
        setBusy(false);
      }
    } catch {
      setBusy(false);
      Alert.alert("Błąd", "Nie udało się uruchomić logowania.");
    }
  };

  // Web cold-start: check hash on mount
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const url = window.location.href;
      if (url.includes("session_id=")) {
        finalize(url).then((ok) => {
          if (ok && typeof window !== "undefined") {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        });
      }
    }
  }, [finalize]);

  const isDriver = role === "driver";

  return (
    <ImageBackground source={{ uri: BG }} style={styles.bg} resizeMode="cover">
      <View style={[styles.overlay, isDriver && { backgroundColor: "rgba(0,0,0,0.75)" }]}>
        <TouchableOpacity testID="back-btn" style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.logoBadge, isDriver && { backgroundColor: "#00E676" }]}>
            <Text style={styles.logoBadgeText}>T</Text>
          </View>
          <Text style={styles.brand}>TAXIGO</Text>
          <Text style={styles.eyebrow}>{isDriver ? "PANEL KIEROWCY" : "PANEL PASAŻERA"}</Text>
          <Text style={styles.title}>Zaloguj się</Text>
          <Text style={styles.sub}>Aby kontynuować jako {isDriver ? "Kierowca" : "Pasażer"}, zaloguj się przez Google.</Text>

          <TouchableOpacity
            testID="google-login-btn"
            style={[styles.googleBtn, busy && { opacity: 0.7 }]}
            onPress={handleGoogle}
            disabled={busy}
            activeOpacity={0.9}
          >
            {busy ? (
              <ActivityIndicator color="#0F0F0F" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#0F0F0F" />
                <Text style={styles.googleBtnText}>Zaloguj się przez Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.legal}>
            Logując się akceptujesz Regulamin i Politykę Prywatności TAXIGO.
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 24, paddingTop: Platform.OS === "ios" ? 56 : 40 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, justifyContent: "center" },
  logoBadge: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#FFD600", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  logoBadgeText: { fontSize: 34, fontWeight: "900", color: "#0F0F0F" },
  brand: { fontSize: 36, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1 },
  eyebrow: { color: "rgba(255,255,255,0.7)", letterSpacing: 2.4, fontSize: 11, fontWeight: "700", marginTop: 16 },
  title: { fontSize: 32, fontWeight: "900", color: "#FFFFFF", marginTop: 4 },
  sub: { fontSize: 15, color: "rgba(255,255,255,0.8)", marginTop: 8, marginBottom: 32, lineHeight: 22 },
  googleBtn: { backgroundColor: "#FFFFFF", borderRadius: 14, height: 56, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  googleBtnText: { color: "#0F0F0F", fontSize: 16, fontWeight: "700" },
  legal: { textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 20, lineHeight: 18 },
});
