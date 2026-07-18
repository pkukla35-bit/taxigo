import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isPushSupported, getSubscriptionStatus, subscribeToPush, unsubscribeFromPush } from "../src/utils/webpush";

type Props = {
  role?: "owner" | "driver" | "passenger";
  label?: string;
  compact?: boolean;
};

export default function PushToggle({ role = "owner", label = "", compact = false }: Props) {
  const [status, setStatus] = useState<"granted" | "denied" | "default" | "unsupported">("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    getSubscriptionStatus().then(setStatus);
  }, []);

  if (Platform.OS !== "web") return null;
  if (!isPushSupported()) return null;

  const enable = async () => {
    setBusy(true);
    const res = await subscribeToPush(role, label);
    setBusy(false);
    if (res.ok) {
      setStatus("granted");
      if (typeof window !== "undefined") window.alert("✅ Powiadomienia włączone! Będziesz dostawać push kiedy pojawi się nowa rezerwacja.");
    } else {
      if (typeof window !== "undefined") window.alert("❌ " + (res.error || "Nie udało się"));
    }
  };

  const disable = async () => {
    setBusy(true);
    await unsubscribeFromPush();
    setStatus("default");
    setBusy(false);
  };

  const on = status === "granted";
  const denied = status === "denied";

  if (denied) {
    return (
      <View style={compact ? styles.pillCompact : styles.pill}>
        <Ionicons name="notifications-off" size={16} color="#FF3B30" />
        <Text style={styles.pillTextDenied}>Zablokowane w przeglądarce</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[compact ? styles.pillCompact : styles.pill, on && styles.pillOn, busy && { opacity: 0.6 }]}
      onPress={on ? disable : enable}
      disabled={busy}
      testID="push-toggle"
    >
      <Ionicons name={on ? "notifications" : "notifications-outline"} size={16} color={on ? "#0F0F0F" : "#FFF"} />
      {!compact && (
        <Text style={[styles.pillText, on && styles.pillTextOn]}>
          {busy ? "..." : on ? "Powiadomienia ON" : "Włącz powiadomienia"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0F0F0F", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  pillCompact: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.6)" },
  pillOn: { backgroundColor: "#00E676", borderColor: "#00E676" },
  pillText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  pillTextOn: { color: "#0F0F0F" },
  pillTextDenied: { color: "#FF3B30", fontSize: 12, fontWeight: "700" },
});
