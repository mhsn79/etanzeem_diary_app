// Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import Dropdown from "../components/DropDown";
import CustomButton from '../components/CustomButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { routeToScreen } from 'expo-router/build/useScreens';
import UnitSelection from './UnitSelection';
import { router } from 'expo-router';

const Dashboard: React.FC = () => {
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

  const [durationOpen, setDurationOpen] = useState(false);
  const [durationValue, setDurationValue] = useState(null);
  const [durationItems, setDurationItems] = useState([
    { label: i18n.t('last_2_weeks'), value: 'last_2_weeks' },
    { label: i18n.t('last_4_weeks'), value: 'last_4_weeks' },
    { label: i18n.t('this_month'), value: 'this_month' },
    { label: i18n.t('last_month'), value: 'last_month' },
    { label: i18n.t('last_3_months'), value: 'last_3_months' },
    { label: i18n.t('last_6_months'), value: 'last_6_months' },
    { label: i18n.t('this_year'), value: 'this_year' },
    { label: i18n.t('last_year'), value: 'last_year' },
    { label: i18n.t('last_2_years'), value: 'last_2_years' },
  ]);

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
      <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingTop: insets.top }]} style={styles.container}>
        {/* Top Line: Small logo + App name */}
        <View style={styles.header}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.appName}>{i18n.t('appname')}</Text>
          {/* <View style={[{ position: "absolute", top: 20, right: 20 }]}> */}
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
          {/* </View> */}
        </View>

        {/* Blue Rounded Rectangle (User Info) */}
        <View style={styles.userInfoContainer}>
          <TouchableOpacity style={styles.arrowButton}>
            <Text style={styles.arrowText}>↑</Text>
          </TouchableOpacity>
          <View style={styles.userInfo}>
            {/* User Picture */}
            <Image source={require('../../assets/images/icon.png')} style={styles.userImage} />
            <View style={styles.userDetails}>
              <Text style={styles.locationName}>{i18n.t('location')}</Text>
              <View style={styles.detailsRow}>
                <Text style={styles.iconText}>🟡</Text>
                <Text style={styles.detailsText}>{i18n.t('address')}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.iconText}>🟡</Text>
                <Text style={styles.detailsText}>{i18n.t('username')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Light Gray Rounded Rectangle: Duration Dropdown + Generate Report */}
        <View style={styles.boxRow}>
          <View style={[styles.box, { position: 'static' }]}>
            <Dropdown
              data={durationItems}
              onChange={console.log}
              placeholder={i18n.t('select_duration')}
            />
          </View>

          <View style={styles.box}>
            <TouchableOpacity style={styles.reportButton}>
              <Text style={styles.reportButtonText}>{i18n.t('generate_report')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rows of Boxes (Dark Gray Background) */}
        <View style={styles.boxRow}>
          <View style={styles.box}>
            <TouchableOpacity onPress={() => router.push("/screens/Workforce")}>
              <Text style={styles.boxTitle}>{i18n.t('workforce')}</Text>
            </TouchableOpacity>
            <Text style={styles.boxContent}>{i18n.t('arkan')} 50</Text>
            <Text style={styles.boxContent}>{i18n.t('increase')} 5</Text>
            <Text style={styles.boxContent}>{i18n.t('target')} 10</Text>
          </View>
          <View style={styles.box}>            
            <TouchableOpacity onPress={() => router.push("/screens/UnitSelection")}>
              <Text style={styles.boxTitle}>{i18n.t('sub_units')}</Text>
            </TouchableOpacity>
            <Text style={styles.boxContent}>{i18n.t('wards')} 5</Text>
            <Text style={styles.boxContent}>-</Text>
            <Text style={styles.boxContent}>-</Text>
          </View>
        </View>
        <View style={styles.boxRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{i18n.t('activities')}</Text>
            <Text style={styles.boxContent}>{i18n.t('organizational')} 1</Text>
            <Text style={styles.boxContent}>{i18n.t('invitational')} 1</Text>
            <Text style={styles.boxContent}>{i18n.t('training')} 1</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{i18n.t('upper_management')}</Text>
            <Text style={styles.boxContent}>{i18n.t('activities')} 1</Text>
            <Text style={styles.boxContent}>{i18n.t('participation')} 1</Text>
            <Text style={styles.boxContent}>-</Text>
          </View>
        </View>
        <View style={styles.boxRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{i18n.t('visits')}</Text>
            <Text style={styles.boxContent}>{i18n.t('meetings')} 1</Text>
            <Text style={styles.boxContent}>-</Text>
            <Text style={styles.boxContent}>-</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>{i18n.t('money')}</Text>
            <Text style={styles.boxContent}>{i18n.t('income')} 0</Text>
            <Text style={styles.boxContent}>{i18n.t('expenses')} 0</Text>
            <Text style={styles.boxContent}>-</Text>
          </View>
        </View>

        {/* Full Width White Button */}
        <TouchableOpacity style={styles.bottomButton}>
          <Text style={styles.bottomButtonText}></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  triggerStyle: {
    height: 40,
    backgroundColor: 'gray', // colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 100,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  triggerText: {
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfoContainer: {
    backgroundColor: '#1E90FF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  arrowButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
  },
  arrowText: {
    color: '#1E90FF',
    fontSize: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userDetails: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  locationName: {
    color: '#fff',
    fontSize: 18,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconText: {
    color: 'yellow',
    marginRight: 5,
  },
  detailsText: {
    color: '#fff',
  },
  reportContainer: {
    backgroundColor: '#d3d3d3',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  picker: {
    marginBottom: 10,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  reportButton: {
    backgroundColor: '#1E90FF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  box: {
    backgroundColor: '#333',
    width: '48%',
    borderRadius: 10,
    padding: 15,
  },
  boxTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  boxContent: {
    color: '#fff',
    fontSize: 14,
  },
  bottomButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E90FF',
    marginTop: 30,
  },
  bottomButtonText: {
    color: '#1E90FF',
    fontSize: 16,
  },
  languageButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  selectedLanguage: {
    backgroundColor: '#007AFF',
  },
  languageText: {
    fontSize: 16,
  },
  selectedLanguageText: {
    color: 'white',
  },
});

export default Dashboard;
