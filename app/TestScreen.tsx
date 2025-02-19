import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, KeyboardAvoidingView, Platform, Button, TextInput, TextInputProps } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './i18n';
import CustomButton from './components/CustomButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles, { gStyles } from './_layout';

const TestScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.locale);
  const [direction, setDirection] = useState(currentLanguage === "ur" ? 'rtl' : 'ltr');

  const changeLanguage = async (languageCode: string) => {
    try {
      await AsyncStorage.setItem('userLanguage', languageCode);
      i18n.locale = languageCode;
      setCurrentLanguage(languageCode);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const changeDirection = async (dir: string) => {
    try {
      setDirection(dir);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  useEffect(() => {
    // Load saved language preference
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('userLanguage');
        if (savedLanguage) {
          i18n.locale = savedLanguage;
        }
        console.log('savedLanguage', i18n.locale)
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguagePreference();
  }, []);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingTop: insets.top }]}>
        {/* Top Line: Small logo + App name */}
        <View>
          <CustomButton
            text={(currentLanguage === "ur" ? "En" : "ار")}
            textStyle={[{ fontFamily: "Tahoma", fontSize: 16 }]}
            viewStyle={[{ marginTop: 0, width: 50, height: 50, padding: 5, opacity: 0.5, borderWidth: 1, borderColor: "black", direction: (currentLanguage === "ur" ? "rtl" : "ltr") }]}
            // , shadowColor: "black", shadowRadius: 1, shadowOpacity: 50, 
            onPress={() => {
              changeLanguage(currentLanguage === "ur" ? "en" : "ur");
              changeDirection(currentLanguage === "ur" ? "rtl" : "ltr");
            }}
          />
          <Text style={gStyles.heading1}>{i18n.t('heading1')}</Text>
          <Text style={gStyles.heading2}>{i18n.t('heading2')}</Text>
          <Text style={gStyles.heading3}>{i18n.t('heading3')}</Text>

          <Text style={gStyles.bodyText}>{i18n.t('bodyText')}</Text>
          <Text style={gStyles.smallText}>{i18n.t('smallText')}</Text>
          <Text style={gStyles.caption}>{i18n.t('caption')}</Text>

          <View style={[gStyles.primaryButton, gStyles.primaryButtonDefaultLight]}>
            <Button title={i18n.t('primary')}></Button>
          </View>
          <View style={[gStyles.secondaryButton, gStyles.secondaryButtonDefaultLight]}>
            <Button title={i18n.t('secondary')}></Button>
          </View>
          <View style={gStyles.tertiaryButton}>
            <Button title={i18n.t('tertiary')}></Button>
          </View>

          <View style={[gStyles.primaryButton, gStyles.primaryButtonPressedLight]}>
            <Button title={i18n.t('primary')}></Button>
          </View>
          <View style={[gStyles.secondaryButton, gStyles.secondaryButtonPressedLight]}>
            <Button title={i18n.t('secondary')}></Button>
          </View>
          <View style={gStyles.tertiaryButton}>
            <Button title={i18n.t('tertiary')}></Button>
          </View>

          <View style={[gStyles.primaryButton, gStyles.primaryButtonDisabledLight]}>
            <Button title={i18n.t('primary')}></Button>
          </View>
          <View style={[gStyles.secondaryButton, gStyles.secondaryButtonDisabledLight]}>
            <Button title={i18n.t('secondary')}></Button>
          </View>
          <View style={gStyles.tertiaryButton}>
            <Button title={i18n.t('tertiary')}></Button>
          </View>

          <TextInput style={[gStyles.inputField, gStyles.inputFieldDefault]}>{i18n.t('text-content')}</TextInput>
          <TextInput style={[gStyles.inputField, gStyles.inputFieldFocus]}>{i18n.t('text-content')}</TextInput>
          <TextInput style={[gStyles.inputField, gStyles.inputFieldError]}>{i18n.t('text-content')}</TextInput>

            <Text style={gStyles.errorText}>{i18n.t('text-content')}</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default TestScreen;
