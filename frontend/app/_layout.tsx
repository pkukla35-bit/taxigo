import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import VoiceTranslator from "../components/VoiceTranslator";

// Only render the translator FAB for authenticated users (drivers OR passengers),
// so it never overlaps the login/role picker.
function TranslatorGate() {
  const { user } = useAuth();
  if (!user) return null;
  return <VoiceTranslator />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
          <TranslatorGate />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
