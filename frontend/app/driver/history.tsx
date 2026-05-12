import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

const STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: "Zakończony", color: "#00E676" },
  cancelled: { label: "Anulowany", color: "#FF3B30" },
  accepted: { label: "W trakcie", color: "#FFD600" },
  in_progress: { label: "W trakcie", color: "#FFD600" },
};

export default function DriverHistory() {
  const router = useRouter();
  const { authFetch, user } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await authFetch("/api/rides/mine");
    if (r.ok) setRides(await r.json());
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  const totalEarned = rides.filter(r => r.status === "completed").reduce((s, r) => s + (r.price_pln || 0), 0);
  const completedCount = rides.filter(r => r.status === "completed").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="dh-back" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Historia</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl tintColor="#00E676" refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ZAROBKI</Text>
            <Text style={styles.statVal}>{totalEarned.toFixed(2)} zł</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>KURSY</Text>
            <Text style={styles.statVal}>{completedCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>OCENA</Text>
            <Text style={styles.statVal}>{(user?.rating_avg ?? 5).toFixed(1)} ⭐</Text>
          </View>
        </View>

        {rides.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color="#A3A3A3" />
            <Text style={styles.emptyText}>Brak historii przejazdów</Text>
          </View>
        ) : (
          rides.map((r) => (
            <View key={r.ride_id} style={styles.card} testID={`d-ride-${r.ride_id}`}>
              <View style={styles.rowTop}>
                <Text style={styles.date}>{new Date(r.created_at).toLocaleString("pl-PL")}</Text>
                <View style={[styles.badge, { backgroundColor: (STATUS[r.status]?.color || "#A3A3A3") + "22" }]}>
                  <Text style={[styles.badgeText, { color: STATUS[r.status]?.color || "#A3A3A3" }]}>{STATUS[r.status]?.label || r.status}</Text>
                </View>
              </View>
              <Text style={styles.passenger}>{r.passenger_name}</Text>
              <View style={styles.route}>
                <View style={styles.dotG} />
                <Text style={styles.routeText} numberOfLines={1}>{r.pickup_address}</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.route}>
                <View style={styles.dotW} />
                <Text style={styles.routeText} numberOfLines={1}>{r.dest_address}</Text>
              </View>
              <View style={styles.bottom}>
                <Text style={styles.km}>{r.distance_km?.toFixed?.(1)} km</Text>
                <Text style={styles.price}>+{r.price_pln?.toFixed(2)} zł</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 56 : 40, paddingBottom: 12, backgroundColor: "#0A0A0A", borderBottomWidth: 1, borderBottomColor: "#262626" },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "900", color: "#FFFFFF" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: "#171717", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#262626" },
  statLabel: { color: "#A3A3A3", fontSize: 9, letterSpacing: 1.4, fontWeight: "700" },
  statVal: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 6 },
  empty: { alignItems: "center", padding: 60, gap: 16 },
  emptyText: { color: "#A3A3A3", fontSize: 15, fontWeight: "600" },
  card: { backgroundColor: "#171717", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#262626" },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  date: { color: "#A3A3A3", fontSize: 12, fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  passenger: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", marginBottom: 8 },
  route: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeText: { flex: 1, color: "#FFFFFF", fontWeight: "500", fontSize: 13 },
  line: { width: 1, height: 12, backgroundColor: "#262626", marginLeft: 5, marginVertical: 2 },
  dotG: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#00E676" },
  dotW: { width: 10, height: 10, borderRadius: 2, backgroundColor: "#FFFFFF" },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#262626" },
  km: { color: "#A3A3A3", fontSize: 13, fontWeight: "700" },
  price: { color: "#00E676", fontSize: 18, fontWeight: "900" },
});
