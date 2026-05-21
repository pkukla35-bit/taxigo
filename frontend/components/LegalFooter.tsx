import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { COMPANY } from "../data/legal";
import { useLanguage } from "../contexts/LanguageContext";

export default function LegalFooter() {
  const router = useRouter();
  const { t } = useLanguage();
  return (
    <View style={s.footer}>
      <View style={s.linksRow}>
        <TouchableOpacity onPress={() => router.push("/regulamin" as any)}>
          <Text style={s.link}>{t("footer.terms")}</Text>
        </TouchableOpacity>
        <Text style={s.dot}>•</Text>
        <TouchableOpacity onPress={() => router.push("/polityka-prywatnosci" as any)}>
          <Text style={s.link}>{t("footer.privacy")}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 10, alignItems: "center" }}>
        <Text style={s.companyName}>{COMPANY.name}</Text>
        <Text style={s.companyLine}>{COMPANY.address}</Text>
        <Text style={s.companyLine}>NIP: {COMPANY.nip}</Text>
        <View style={s.contactRow}>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${COMPANY.phoneIntl}`)}>
            <Text style={s.contactLink}>📞 {COMPANY.phoneIntl}</Text>
          </TouchableOpacity>
          <Text style={s.dot}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${COMPANY.email}`)}>
            <Text style={s.contactLink}>✉️ {COMPANY.email}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.copyright}>© {new Date().getFullYear()} TAXIGO. {t("footer.rights")}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  footer: { paddingHorizontal: 16, paddingVertical: 22, backgroundColor: "#f5f5f7", borderTopWidth: 1, borderTopColor: "#e5e5ea" },
  linksRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  link: { fontSize: 13, color: "#2E7D32", fontWeight: "600", textDecorationLine: "underline" },
  dot: { color: "#999", fontSize: 12 },
  companyName: { fontSize: 12, fontWeight: "700", color: "#1c1c1e", marginBottom: 4 },
  companyLine: { fontSize: 11, color: "#6e6e73", marginBottom: 2, textAlign: "center" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap", justifyContent: "center" },
  contactLink: { fontSize: 11, color: "#2E7D32", fontWeight: "500" },
  copyright: { fontSize: 10, color: "#999", marginTop: 10 },
});
