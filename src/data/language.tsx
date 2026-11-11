import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { translator, type Language, type Translate } from '../domain/ui-language';

const preferenceKey = 'nutrikitchen.language';

type LanguageValue = { language: Language; setLanguage?: (language: Language) => void; t: Translate };

const LanguageContext = createContext<LanguageValue>({ language: 'zh', t: translator('zh') });

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, set] = useState<Language>('zh');

  useEffect(() => {
    let active = true;
    void readLanguage().then((saved) => {
      if (active && saved === 'en') set('en');
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en-US';
  }, [language]);

  const value = useMemo<LanguageValue>(() => ({
    language,
    t: translator(language),
    setLanguage(next) {
      set(next);
      void saveLanguage(next).catch(() => undefined);
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

async function readLanguage() {
  if (Platform.OS === 'web') return localStorage.getItem(preferenceKey);
  const { default: storage } = await import('expo-sqlite/kv-store');
  return storage.getItem(preferenceKey);
}

async function saveLanguage(language: Language) {
  if (Platform.OS === 'web') {
    localStorage.setItem(preferenceKey, language);
    return;
  }
  const { default: storage } = await import('expo-sqlite/kv-store');
  await storage.setItem(preferenceKey, language);
}
