import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  isLocaleCode,
  STORAGE_KEY,
  suggestLocaleFromLocation,
  translate,
  type LocaleCode,
} from "../i18n";
import { LOCALE_OPTIONS } from "../i18n/types";

interface LocaleContextValue {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
  languageMode: LanguageMode;
  setLanguageMode: (mode: LanguageMode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  suggestedLocale: LocaleCode | null;
  localeOptions: typeof LOCALE_OPTIONS;
  suggestFromFarmLocation: (location: string) => void;
}
const LANGUAGE_MODE_KEY = "agrisentinel_language_mode";
type LanguageMode = "auto" | "manual";
const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): LocaleCode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isLocaleCode(stored)) return stored;
  return "en";
}

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<LocaleCode>(readStoredLocale);
  const [suggestedLocale, setSuggestedLocale] = useState<LocaleCode | null>(null);

  const [languageMode, setLanguageModeState] = useState<LanguageMode>(() => {
    const stored = localStorage.getItem(LANGUAGE_MODE_KEY);
    return stored === "auto" ? "auto" : "manual";
  });
  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
    setLanguageModeState("manual");
    localStorage.setItem(STORAGE_KEY, code);
    localStorage.setItem(LANGUAGE_MODE_KEY, "manual");
    document.documentElement.lang = code;
  }, []);
  const setLanguageMode = useCallback((mode: LanguageMode) => {
    setLanguageModeState(mode);
    localStorage.setItem(LANGUAGE_MODE_KEY, mode);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const suggestFromFarmLocation = useCallback((location: string) => {
    const suggested = suggestLocaleFromLocation(location);
    setSuggestedLocale(suggested);

    if (languageMode === "auto" && suggested) {
      setLocaleState(suggested);
      document.documentElement.lang = suggested;
    }
  }, [languageMode]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      languageMode,
      setLanguageMode,
      t,
      suggestedLocale,
      localeOptions: LOCALE_OPTIONS,
      suggestFromFarmLocation,
    }),
    [locale, setLocale, languageMode, setLanguageMode, t, suggestedLocale, suggestFromFarmLocation]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useTranslation() {
  const {
    t,
    locale,
    setLocale,
    languageMode,
    setLanguageMode,
    suggestedLocale,
    localeOptions,
  } = useLocale();
  return {
    t,
    locale,
    setLocale,
    languageMode,
    setLanguageMode,
    suggestedLocale,
    localeOptions,
  };
}