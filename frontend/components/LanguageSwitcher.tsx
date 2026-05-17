import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";

interface Props {
  variant?: "light" | "dark";
  compact?: boolean;
}

export function LanguageSwitcher({ variant = "light", compact = false }: Props) {
  const { lang, setLang } = useLanguage();
  const isDark = variant === "dark";

  const baseColors = isDark
    ? { bg: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.2)", text: "#FFFFFF", activeBg: "#FFD600", activeText: "#0F0F0F" }
    : { bg: "#F5F5F5", border: "#E5E5E5", text: "#525252", activeBg: "#0F0F0F", activeText: "#FFD600" };

  const padH = compact ? 8 : 12;
  const padV = compact ? 4 : 6;
  const fontSize = compact ? 11 : 12;

  return (
    <View style={[styles.container, { backgroundColor: baseColors.bg, borderColor: baseColors.border }]} testID="language-switcher">
      <Pressable
        onPress={() => setLang("pl")}
        style={[
          styles.option,
          { paddingHorizontal: padH, paddingVertical: padV },
          lang === "pl" && { backgroundColor: baseColors.activeBg },
        ]}
        testID="lang-pl"
      >
        <Text style={[styles.label, { fontSize, color: lang === "pl" ? baseColors.activeText : baseColors.text }]}>🇵🇱 PL</Text>
      </Pressable>
      <Pressable
        onPress={() => setLang("en")}
        style={[
          styles.option,
          { paddingHorizontal: padH, paddingVertical: padV },
          lang === "en" && { backgroundColor: baseColors.activeBg },
        ]}
        testID="lang-en"
      >
        <Text style={[styles.label, { fontSize, color: lang === "en" ? baseColors.activeText : baseColors.text }]}>🇬🇧 EN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    padding: 2,
    gap: 2,
    alignSelf: "flex-start",
  },
  option: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
