import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";

// TypeScript shims for browser SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Lang = "pl" | "en";

type Turn = {
  id: string;
  from: Lang;
  to: Lang;
  original: string;
  translated: string;
  at: number;
};

const LANG_LABEL: Record<Lang, { flag: string; name: string; bcp47: string }> = {
  pl: { flag: "🇵🇱", name: "Polski", bcp47: "pl-PL" },
  en: { flag: "🇬🇧", name: "English", bcp47: "en-US" },
};

function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_LABEL[lang].bcp47;
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {}
}

export default function VoiceTranslator() {
  const { authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [busyLang, setBusyLang] = useState<Lang | null>(null); // which side is recording
  const [translating, setTranslating] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const supported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const stopRecording = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    setBusyLang(null);
  }, []);

  const translateNow = async (text: string, from: Lang, to: Lang) => {
    setTranslating(true);
    setError(null);
    try {
      const r = await authFetch("/api/translate", {
        method: "POST",
        body: JSON.stringify({ text, source_lang: from, target_lang: to }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const turn: Turn = {
        id: `t_${Date.now()}`,
        from,
        to,
        original: text,
        translated: data.translated,
        at: Date.now(),
      };
      setTurns((prev) => [turn, ...prev].slice(0, 30));
      // Auto-speak translation
      speak(data.translated, to);
    } catch (e: any) {
      setError(e?.message || "Translation error");
    } finally {
      setTranslating(false);
      setTranscript("");
    }
  };

  const startRecording = (lang: Lang) => {
    setError(null);
    setTranscript("");
    if (!supported) {
      setError("Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome na Android/iOS.");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = LANG_LABEL[lang].bcp47;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      setTranscript(finalText + interim);
    };
    rec.onerror = (e: any) => {
      setError(e.error === "not-allowed" ? "Brak zgody na mikrofon — zezwól w ustawieniach przeglądarki" : `Błąd mikrofonu: ${e.error}`);
      setBusyLang(null);
      recognitionRef.current = null;
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setBusyLang(null);
      const text = finalText.trim();
      if (text) {
        const to: Lang = lang === "pl" ? "en" : "pl";
        translateNow(text, lang, to);
      }
    };
    recognitionRef.current = rec;
    setBusyLang(lang);
    try { rec.start(); } catch {}
  };

  const toggleRecord = (lang: Lang) => {
    if (busyLang === lang) {
      stopRecording();
    } else {
      if (busyLang) stopRecording();
      startRecording(lang);
    }
  };

  useEffect(() => {
    return () => { stopRecording(); };
  }, [stopRecording]);

  // Only render on web (Speech API doesn't exist on native)
  if (Platform.OS !== "web") return null;

  return (
    <>
      {/* Floating action button */}
      <TouchableOpacity
        testID="voice-translator-fab"
        style={styles.fab}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="language" size={22} color="#0F0F0F" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>🌍 Tłumacz PL ↔ EN</Text>
              <TouchableOpacity onPress={() => { stopRecording(); setOpen(false); }} testID="translator-close">
                <Ionicons name="close" size={26} color="#0F0F0F" />
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              Naciśnij i mów w swoim języku — tłumaczenie pojawi się i zostanie wypowiedziane głosowo.
            </Text>

            {/* Two big record buttons */}
            <View style={styles.recRow}>
              {(["pl", "en"] as Lang[]).map((lg) => (
                <TouchableOpacity
                  key={lg}
                  testID={`rec-${lg}`}
                  style={[styles.recBtn, busyLang === lg && styles.recBtnActive]}
                  onPress={() => toggleRecord(lg)}
                  disabled={translating}
                  activeOpacity={0.85}
                >
                  <Text style={styles.recFlag}>{LANG_LABEL[lg].flag}</Text>
                  <Text style={styles.recLangName}>{LANG_LABEL[lg].name}</Text>
                  <View style={styles.recIcon}>
                    <Ionicons name={busyLang === lg ? "stop" : "mic"} size={22} color={busyLang === lg ? "#FF3B30" : "#0F0F0F"} />
                  </View>
                  <Text style={styles.recCue}>
                    {busyLang === lg ? "Nagrywam…" : lg === "pl" ? "Mów po polsku" : "Speak English"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {transcript ? (
              <View style={styles.transcript}>
                <Text style={styles.transcriptLabel}>Słyszę…</Text>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </View>
            ) : null}

            {translating ? (
              <View style={styles.translating}>
                <ActivityIndicator color="#FFD600" />
                <Text style={styles.translatingText}>Tłumaczę…</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Conversation history */}
            <ScrollView style={styles.history} contentContainerStyle={{ paddingBottom: 12 }}>
              {turns.map((turn) => (
                <View key={turn.id} style={styles.turn}>
                  <View style={styles.turnOriginal}>
                    <Text style={styles.turnLangLabel}>{LANG_LABEL[turn.from].flag} {LANG_LABEL[turn.from].name}</Text>
                    <Text style={styles.turnOriginalText}>{turn.original}</Text>
                  </View>
                  <View style={styles.turnArrow}>
                    <Ionicons name="arrow-down" size={16} color="#A3A3A3" />
                  </View>
                  <View style={styles.turnTranslated}>
                    <View style={styles.turnHeader}>
                      <Text style={styles.turnLangLabelYellow}>{LANG_LABEL[turn.to].flag} {LANG_LABEL[turn.to].name}</Text>
                      <TouchableOpacity onPress={() => speak(turn.translated, turn.to)} style={styles.speakBtn}>
                        <Ionicons name="volume-medium" size={16} color="#0F0F0F" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.turnTranslatedText}>{turn.translated}</Text>
                  </View>
                </View>
              ))}
              {turns.length === 0 && !translating ? (
                <Text style={styles.emptyText}>Historia rozmów pojawi się tutaj.</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    bottom: 90,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFD600",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "88%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { color: "#0F0F0F", fontSize: 20, fontWeight: "900" },
  hint: { color: "#525252", fontSize: 12, marginBottom: 16, lineHeight: 16 },
  recRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  recBtn: { flex: 1, backgroundColor: "#F5F5F5", borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  recBtnActive: { backgroundColor: "#FFF3D6", borderColor: "#FFD600" },
  recFlag: { fontSize: 28, marginBottom: 4 },
  recLangName: { color: "#0F0F0F", fontSize: 12, fontWeight: "800", marginBottom: 8 },
  recIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFD600", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  recCue: { color: "#525252", fontSize: 11, fontWeight: "700" },
  transcript: { backgroundColor: "#FFF8E1", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#FFD600" },
  transcriptLabel: { color: "#B37F00", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  transcriptText: { color: "#0F0F0F", fontSize: 14, fontWeight: "700", marginTop: 4 },
  translating: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  translatingText: { color: "#525252", fontSize: 13, fontWeight: "700" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,59,48,0.1)", borderWidth: 1, borderColor: "#FF3B30", borderRadius: 10, padding: 10, marginBottom: 8 },
  errorText: { color: "#FF3B30", fontSize: 12, fontWeight: "700", flex: 1 },
  history: { maxHeight: 320 },
  turn: { marginBottom: 14 },
  turnOriginal: { backgroundColor: "#F5F5F5", borderRadius: 10, padding: 10 },
  turnLangLabel: { color: "#525252", fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  turnLangLabelYellow: { color: "#0F0F0F", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  turnOriginalText: { color: "#0F0F0F", fontSize: 13, fontWeight: "600" },
  turnArrow: { alignItems: "center", paddingVertical: 4 },
  turnTranslated: { backgroundColor: "#FFD600", borderRadius: 10, padding: 10 },
  turnHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  speakBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(15,15,15,0.1)", alignItems: "center", justifyContent: "center" },
  turnTranslatedText: { color: "#0F0F0F", fontSize: 14, fontWeight: "800" },
  emptyText: { color: "#A3A3A3", fontSize: 12, fontStyle: "italic", textAlign: "center", marginTop: 20 },
});
