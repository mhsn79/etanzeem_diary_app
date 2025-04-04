import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { TextStyle, I18nManager } from 'react-native';
import * as Font from 'expo-font';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  isFontLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('ur');
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  useEffect(() => {
    const loadFontAndLanguage = async () => {
      try {
        // Set Urdu as default
        i18n.locale = 'ur';
        setCurrentLanguage('ur');
        await AsyncStorage.setItem('userLanguage', 'ur');
        
        // Force RTL for Urdu
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);

        // Load font
        await Font.loadAsync({
          'JameelNooriNastaleeq': require('../../assets/fonts/JameelNooriNastaleeq.ttf'),
          'noori-kasheed': require('../../assets/fonts/noori-kasheed.ttf'),
        });
        setIsFontLoaded(true);

      } catch (error) {
        console.error('Error in loadFontAndLanguage:', error);
      }
    };

    loadFontAndLanguage();
  }, []);

  const changeLanguage = async (languageCode: string) => {
    try {
      await AsyncStorage.setItem('userLanguage', languageCode);
      i18n.locale = languageCode;
      setCurrentLanguage(languageCode);
      // Update RTL setting based on language
      I18nManager.forceRTL(languageCode === 'ur');
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  if (!isFontLoaded) {
    return null; // Or a loading component
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isFontLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export { LanguageProvider };
export default LanguageProvider; 