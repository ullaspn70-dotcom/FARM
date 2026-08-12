import type { LocaleCode, TranslationDictionary } from "./types";
import en from "./locales/en";
import hi from "./locales/hi";
import kn from "./locales/kn";
import ml from "./locales/ml";
import ta from "./locales/ta";
import te from "./locales/te";

export type { LocaleCode } from "./types";

export const STORAGE_KEY = "agrisentinel_locale";

const dictionaries: Record<LocaleCode, TranslationDictionary> = {
  en,
  hi,
  kn,
  ml,
  ta,
  te,
};

export function isLocaleCode(value: string): value is LocaleCode {
  return value in dictionaries;
}

export function getDictionary(locale: LocaleCode): TranslationDictionary {
  return dictionaries[locale] ?? en;
}

export function translate(
  locale: LocaleCode,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = getDictionary(locale);
  let text = dict[key] ?? en[key] ?? key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(paramValue));
    });
  }

  return text;
}

export function suggestLocaleFromLocation(location: string): LocaleCode | null {
  const loc = location.toLowerCase();
  if (loc.includes("karnataka") || loc.includes("bengaluru") || loc.includes("bangalore")) return "kn";
  if (loc.includes("kerala") || loc.includes("kochi") || loc.includes("thiruvananthapuram")) return "ml";
  if (loc.includes("tamil") || loc.includes("chennai") || loc.includes("coimbatore")) return "ta";
  if (loc.includes("andhra") || loc.includes("telangana") || loc.includes("hyderabad")) return "te";
  if (loc.includes("jharkhand") || loc.includes("ranchi") || loc.includes("bokaro")) return "hi";
  return null;
}

export { en, hi, kn, ml, ta, te };
