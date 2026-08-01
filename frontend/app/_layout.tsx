import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import VoiceTranslator from "../components/VoiceTranslator";

// Only render the translator FAB globally (all pages, even public ones like /wycieczki).
// Endpoint /api/translate is public so it works without login too.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
          <VoiceTranslator />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
