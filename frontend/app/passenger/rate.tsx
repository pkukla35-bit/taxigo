import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

export default function Rate() {
  const router = useRouter();
  const { ride_id } = useLocalSearchParams<{ ride_id: string }>();
  const { authFetch } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const send = async () => {
    const r = await authFetch(`/api/rides/${ride_id}/rate`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    });
    if (r.ok) router.replace("/passenger/home");
    else Alert.alert("Błąd", "Nie udało się wysłać oceny.");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>TAXIGO</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.checkmark}>
          <Ionicons name="checkmark" size={48} color="#0F0F0F" />
        </View>
        <Text style={styles.title}>Dziękujemy{"\n"}za przejazd!</Text>
        <Text style={styles.sub}>Jak oceniasz swojego kierowcę?</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              testID={`star-${n}`}
              onPress={() => setRating(n)}
              style={styles.starBtn}
            >
              <Ionicons
                name={n <= rating ? "star" : "star-outline"}
                size={42}
                color={n <= rating ? "#FFD600" : "#A3A3A3"}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          testID="comment-input"
          value={comment}
          onChangeText={setComment}
          placeholder="Dodaj komentarz (opcjonalnie)"
          placeholderTextColor="#A3A3A3"
          multiline
          style={styles.input}
        />

        <TouchableOpacity testID="submit-rating-btn" style={styles.cta} onPress={send}>
          <Text style={styles.ctaText}>Wyślij ocenę</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/passenger/home")}>
          <Text style={styles.skip}>Pomiń</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { paddingTop: Platform.OS === "ios" ? 56 : 40, paddingHorizontal: 24, paddingBottom: 12 },
  brand: { fontSize: 24, fontWeight: "900", color: "#0F0F0F", letterSpacing: -0.5 },
  content: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  checkmark: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#FFD600", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 34, fontWeight: "900", color: "#0F0F0F", textAlign: "center", letterSpacing: -1 },
  sub: { fontSize: 16, color: "#525252", marginTop: 12, marginBottom: 28 },
  starsRow: { flexDirection: "row", gap: 6, marginBottom: 24 },
  starBtn: { padding: 4 },
  input: { width: "100%", minHeight: 90, borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 14, padding: 14, color: "#0F0F0F", backgroundColor: "#FFFFFF", marginBottom: 16, textAlignVertical: "top" },
  cta: { width: "100%", height: 56, backgroundColor: "#0F0F0F", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  skip: { color: "#525252", marginTop: 16, fontWeight: "600" },
});
