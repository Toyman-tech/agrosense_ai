'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, languages } from '../data/translations';

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  languages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('agrosense_language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ha' || savedLang === 'ig' || savedLang === 'yo')) {
      setLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agrosense_language', lang);
  };

  const t = (key: TranslationKey): string => {
    const translationSet = translations[language] || translations.en;
    return (translationSet[key] || translations.en[key] || key) as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {mounted ? children : <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading localization...</div>}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
