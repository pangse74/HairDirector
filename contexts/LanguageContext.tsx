import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, TranslationType, detectLanguage, saveLanguage, getTranslation, isRTL, LANGUAGES } from '../locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationType;
  isRTL: boolean;
  languages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => detectLanguage());
  const [t, setT] = useState<TranslationType>(() => getTranslation(detectLanguage()));

  useEffect(() => {
    const detected = detectLanguage();
    setLanguageState(detected);
    setT(getTranslation(detected));
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setT(getTranslation(lang));
    saveLanguage(lang);

    // RTL 지원
    if (isRTL(lang)) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      isRTL: isRTL(language),
      languages: LANGUAGES,
    }}>
      {children}
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
