import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";
import zhCNText from "./locales/zh-CN-text.json";

export const APP_LOCALE_STORAGE_KEY = "t3code:ui-locale:v1";
export const DEFAULT_LOCALE = "zh-CN" as const;
export const SUPPORTED_LOCALES = ["zh-CN", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type MessageKey = keyof typeof en;
export type MessageValues = Readonly<Record<string, string | number>>;

export function isLocale(value: unknown): value is Locale {
  return value === "zh-CN" || value === "en";
}

export function localeFromPreference(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function formatMessage(template: string, values?: MessageValues): string {
  if (!values) return template;
  return template.replace(/\{([^{}]+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

export function resolveMessage(locale: Locale, key: MessageKey, values?: MessageValues): string {
  const message = locale === "zh-CN" ? zhCN[key] : undefined;
  return formatMessage(message ?? en[key], values);
}

/** Translate a literal source phrase when a matching Simplified Chinese entry exists. */
export function resolveSourceMessage(
  locale: Locale,
  source: string,
  values?: MessageValues,
): string {
  const message = locale === "zh-CN" ? zhCNText[source as keyof typeof zhCNText] : undefined;
  return formatMessage(message ?? source, values);
}

// Keep a hook-free view of the active locale for the few settings helpers that
// are also exercised as plain element factories by the environment tests.
// React-rendered components should continue to prefer useI18n().
// Plain element-factory tests do not mount I18nProvider. Keep their source
// text stable until the real provider publishes the selected locale.
let activeLocale: Locale = "en";

export function resolveActiveSourceMessage(source: string, values?: MessageValues): string {
  return resolveSourceMessage(activeLocale, source, values);
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    return localeFromPreference(window.localStorage.getItem(APP_LOCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

interface I18nContextValue {
  readonly locale: Locale;
  readonly setLocale: (locale: Locale) => void;
  readonly t: (key: MessageKey, values?: MessageValues) => string;
  readonly tText: (source: string, values?: MessageValues) => string;
}

const defaultContext: I18nContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key, values) => resolveMessage(DEFAULT_LOCALE, key, values),
  tText: (source, values) => resolveSourceMessage(DEFAULT_LOCALE, source, values),
};

const I18nContext = createContext(defaultContext);

export function I18nProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setCurrentLocale] = useState(readStoredLocale);
  activeLocale = locale;

  const setLocale = useCallback((nextLocale: Locale) => {
    setCurrentLocale(nextLocale);
    try {
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // The in-memory preference still works when browser storage is unavailable.
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, values?: MessageValues) => resolveMessage(locale, key, values),
    [locale],
  );
  const tText = useCallback(
    (source: string, values?: MessageValues) => resolveSourceMessage(locale, source, values),
    [locale],
  );
  const value = useMemo(() => ({ locale, setLocale, t, tText }), [locale, setLocale, t, tText]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const syncLocale = (event: StorageEvent) => {
      if (event.key !== APP_LOCALE_STORAGE_KEY) return;
      setCurrentLocale(localeFromPreference(event.newValue));
    };
    window.addEventListener("storage", syncLocale);
    return () => window.removeEventListener("storage", syncLocale);
  }, []);

  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
