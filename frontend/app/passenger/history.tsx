import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

const STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: "Zakończony", color: "#00E676" },
  cancelled: { label: "Anulowany", color: "#FF3B30" },
  pending: { label: "W trakcie", color: "#FFD600" },
  accepted: { label: "Zaakceptowany", color: "#FFD600" },
  in_progress: { label: "W trakcie", color: "#FFD600" },
};

export default function History() {
  const router = useRouter();
  const { authFetch } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await authFetch("/api/rides/mine");
    if (r.ok) setRides(await r.json());
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="hist-back-btn" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#0F0F0F" />
        </TouchableOpacity>
        <Text style={styles.title}>Historia</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        {rides.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color="#A3A3A3" />
            <Text style={styles.emptyText}>Brak historii przejazdów</Text>
          </View>
        ) : (
          rides.map((r) => (
            <TouchableOpacity
              key={r.ride_id}
              style={styles.card}
              testID={`ride-${r.ride_id}`}
              activeOpacity={r.status === "completed" ? 0.7 : 1}
              onPress={() => {
                if (r.status === "completed") {
                  router.push({ pathname: "/passenger/receipt", params: { ride_id: r.ride_id } });
                }
              }}
            >
              <View style={styles.rowTop}>
                <Text style={styles.date}>{new Date(r.created_at).toLocaleString("pl-PL")}</Text>
                <View style={[styles.badge, { backgroundColor: (STATUS[r.status]?.color || "#A3A3A3") + "33" }]}>
                  <Text style={[styles.badgeText, { color: STATUS[r.status]?.color || "#A3A3A3" }]}>{STATUS[r.status]?.label || r.status}</Text>
                </View>
              </View>
              <View style={styles.route}>
                <View style={styles.dotA} />
                <Text style={styles.routeText} numberOfLines={1}>{r.pickup_address}</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.route}>
                <View style={styles.dotB} />
                <Text style={styles.routeText} numberOfLines={1}>{r.dest_address}</Text>
              </View>
              <View style={styles.bottom}>
                <Text style={styles.km}>{r.distance_km?.toFixed?.(1)} km</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.price}>{r.price_pln?.toFixed(2)} zł</Text>
                  {r.status === "completed" && <Ionicons name="receipt-outline" size={16} color="#525252" />}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 56 : 40, paddingBottom: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "900", color: "#0F0F0F" },
  empty: { alignItems: "center", padding: 60, gap: 16 },
  emptyText: { color: "#525252", fontSize: 15, fontWeight: "600" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E5E5" },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  date: { color: "#525252", fontSize: 12, fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  route: { flexDirection: "row", alignItems: "center", gap: 12 },
  routeText: { flex: 1, color: "#0F0F0F", fontWeight: "600", fontSize: 14 },
  line: { width: 1, height: 12, backgroundColor: "#E5E5E5", marginLeft: 6, marginVertical: 2 },
  dotA: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#FFD600", borderWidth: 2, borderColor: "#0F0F0F" },
  dotB: { width: 12, height: 12, borderRadius: 2, backgroundColor: "#0F0F0F" },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F5F5F5" },
  km: { color: "#525252", fontSize: 13, fontWeight: "700" },
  price: { color: "#0F0F0F", fontSize: 18, fontWeight: "900" },
});
