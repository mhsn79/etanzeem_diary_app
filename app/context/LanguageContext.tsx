import React, { createContext, useState, useContext, useEffect } from 'react';
import { I18nManager } from 'react-native';
import * as Font from 'expo-font';

import i18n from '../i18n';
import { mmkvStorage } from '../store/mmkvStorage';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  isFontLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('ur');
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  /* -------------------------------------------------------------
     Load persisted language + fonts on first mount
  -------------------------------------------------------------- */
  useEffect(() => {
    const init = async () => {
      try {
        const storedLang = await mmkvStorage.getItem('userLanguage');
        const lang = storedLang ?? 'ur';

        i18n.locale = lang;
        setCurrentLanguage(lang);

        // Handle RTL dynamically
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(lang === 'ur');

        await Font.loadAsync({
          JameelNooriNastaleeq: require('../../assets/fonts/JameelNooriNastaleeq.ttf'),
          'noori-kasheed': require('../../assets/fonts/noori-kasheed.ttf'),
        });

        setIsFontLoaded(true);
      } catch (e) {
        console.error('[LanguageProvider] init error:', e);
      }
    };

    init();
  }, []);

  /* -------------------------------------------------------------
     Change language on demand
  -------------------------------------------------------------- */
  const changeLanguage = async (languageCode: string) => {
    try {
      await mmkvStorage.setItem('userLanguage', languageCode);
      i18n.locale = languageCode;
      setCurrentLanguage(languageCode);
      I18nManager.forceRTL(languageCode === 'ur');
    } catch (e) {
      console.error('[LanguageProvider] changeLanguage error:', e);
    }
  };

  if (!isFontLoaded) return null;           // or a splash/loading component

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isFontLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
};

/* ---------- Public hook -------------------------------------------------- */
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};

export { LanguageProvider };
export default LanguageProvider;
