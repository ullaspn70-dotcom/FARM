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
  t: (key: string, params?: Record<string, string | number>) => string;
  suggestedLocale: LocaleCode | null;
  localeOptions: typeof LOCALE_OPTIONS;
  suggestFromFarmLocation: (location: string) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): LocaleCode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isLocaleCode(stored)) return stored;
  return "en";
}

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<LocaleCode>(readStoredLocale);
  const [suggestedLocale, setSuggestedLocale] = useState<LocaleCode | null>(null);

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const suggestFromFarmLocation = useCallback((location: string) => {
    const suggested = suggestLocaleFromLocation(location);
    setSuggestedLocale(suggested);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      suggestedLocale,
      localeOptions: LOCALE_OPTIONS,
      suggestFromFarmLocation,
    }),
    [locale, setLocale, t, suggestedLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useTranslation() {
  const { t, locale, setLocale, suggestedLocale, localeOptions } = useLocale();
  return { t, locale, setLocale, suggestedLocale, localeOptions };
}
