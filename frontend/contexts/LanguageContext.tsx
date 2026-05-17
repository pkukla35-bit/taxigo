import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { translations, type Lang, type TranslationKey } from "../i18n/translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, fallback?: string) => string;
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "taxigo_lang";

function detectInitialLang(): Lang {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    const browserLang = (navigator.language || (navigator as any).userLanguage || "").toLowerCase();
    if (browserLang.startsWith("pl")) return "pl";
    return "en"; // Default to English for international tourists
  }
  return "pl";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pl");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "pl" || stored === "en") {
          setLangState(stored);
        } else {
          setLangState(detectInitialLang());
        }
      } catch {
        setLangState(detectInitialLang());
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    AsyncStorage.setItem(STORAGE_KEY, newLang).catch(() => {});
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = translations[lang] as Record<string, string>;
    return dict[key] || translations.pl[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if used outside provider - return Polish defaults
    return {
      lang: "pl" as Lang,
      setLang: () => {},
      t: (key: TranslationKey, fallback?: string) =>
        (translations.pl as Record<string, string>)[key] || fallback || key,
      ready: true,
    };
  }
  return ctx;
}
