import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { TextStyle, I18nManager } from 'react-native';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  getTextStyle: (baseStyle?: TextStyle) => TextStyle;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('ur');

  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        // Always set Urdu as default
        i18n.locale = 'ur';
        setCurrentLanguage('ur');
        await AsyncStorage.setItem('userLanguage', 'ur');
      } catch (error) {
        console.error('Error setting language preference:', error);
      }
    };

    loadLanguagePreference();
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

  const getTextStyle = (baseStyle: TextStyle = {}): TextStyle => {
    return {
      ...baseStyle,
      fontFamily: 'JameelNooriNastaleeq',
      writingDirection: 'rtl',
      textAlign: 'right',
    };
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, getTextStyle }}>
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