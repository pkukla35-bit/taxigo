import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function DriverLogin() {
  const router = useRouter();
  const { signInWithPassword } = useAuth();
  const { lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError(lang === "en" ? "Please enter email and password" : "Wprowadź email i hasło");
      return;
    }
    setLoading(true);
    try {
      const res = await signInWithPassword(email, password);
      if (res.ok) {
        router.replace("/driver/home");
      } else {
        const msg = res.error === "Invalid email or password"
          ? (lang === "en" ? "Wrong email or password" : "Nieprawidłowy email lub hasło")
          : res.error?.includes("locked")
          ? (lang === "en" ? "Account locked for 15 minutes after 5 failed attempts" : "Konto zablokowane na 15 minut po 5 nieudanych próbach")
          : (res.error || (lang === "en" ? "Login failed" : "Logowanie nieudane"));
        setError(msg);
      }
    } catch (e: any) {
      setError(e?.message || (lang === "en" ? "Network error" : "Błąd sieci"));
    } finally {
      setLoading(false);
    }
  };

  const contactAdmin = () => {
    const msg = lang === "en"
      ? "To get a driver account, contact the admin (pkukla35@gmail.com)."
      : "Aby otrzymać konto kierowcy, skontaktuj się z administratorem:\n\npkukla35@gmail.com";
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(msg);
    } else {
      Alert.alert(lang === "en" ? "Driver account" : "Konto kierowcy", msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0A0A0A" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.replace("/")} testID="back-to-role">
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          <Text style={styles.backText}>{lang === "en" ? "Back" : "Wróć"}</Text>
        </TouchableOpacity>

        <View style={styles.brandBadge}>
          <Ionicons name="car-sport" size={22} color="#0A0A0A" />
          <Text style={styles.brandText}>TAXIGO PRO</Text>
        </View>

        <Text style={styles.title}>{lang === "en" ? "Driver login" : "Logowanie kierowcy"}</Text>
        <Text style={styles.subtitle}>
          {lang === "en"
            ? "Sign in with the email & password provided by the admin."
            : "Zaloguj się emailem i hasłem otrzymanym od administratora."}
        </Text>

        <View style={styles.field}>
          <Ionicons name="mail" size={20} color="#A3A3A3" />
          <TextInput
            testID="driver-email-input"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="kierowca@taxigo.pl"
            placeholderTextColor="#525252"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Ionicons name="lock-closed" size={20} color="#A3A3A3" />
          <TextInput
            testID="driver-password-input"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={lang === "en" ? "Password" : "Hasło"}
            placeholderTextColor="#525252"
            secureTextEntry={!showPass}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPass((v) => !v)} disabled={loading}>
            <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color="#A3A3A3" />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox} testID="driver-login-error">
            <Ionicons name="alert-circle" size={18} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          testID="driver-login-btn"
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={onLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <>
              <Ionicons name="log-in" size={20} color="#0A0A0A" />
              <Text style={styles.submitBtnText}>{lang === "en" ? "Sign in" : "Zaloguj się"}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={contactAdmin} disabled={loading}>
          <Text style={styles.linkText}>
            {lang === "en" ? "Don't have an account? Contact admin" : "Nie masz konta? Skontaktuj się z administratorem"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, minHeight: "100%" },
  back: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 24, alignSelf: "flex-start" },
  backText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  brandBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFD600", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 20 },
  brandText: { color: "#0A0A0A", fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#FFFFFF", fontSize: 30, fontWeight: "900", marginBottom: 6 },
  subtitle: { color: "#A3A3A3", fontSize: 14, marginBottom: 28, lineHeight: 20 },
  field: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#171717", borderRadius: 12, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: "#262626", marginBottom: 12 },
  input: { flex: 1, color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,59,48,0.12)", borderWidth: 1, borderColor: "#FF3B30", borderRadius: 10, padding: 12, marginTop: 4, marginBottom: 12 },
  errorText: { color: "#FF3B30", fontSize: 13, fontWeight: "700", flex: 1 },
  submitBtn: { backgroundColor: "#FFD600", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 56, borderRadius: 14, marginTop: 8 },
  submitBtnText: { color: "#0A0A0A", fontSize: 16, fontWeight: "900" },
  link: { marginTop: 24, alignItems: "center" },
  linkText: { color: "#FFD600", fontSize: 13, fontWeight: "700" },
});
