import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ScrollView, View, StatusBar } from 'react-native';
import i18n from '../i18n';
import CustomDropdown from '../components/CustomDropdown';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
// import CustomTabbar from '../components/CustomTabbar';
import Spacer from '../components/Spacer';
import UrduText from '../components/UrduText';
import { COLORS, SPACING } from '../constants/theme';

interface Option {
  id: string;
  label: string;
  value: string;
}

export default function UnitSelection() {

  const handleSelection = (option: Option) => {
    console.log('Selected item:', option.value);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1 }]} style={styles.container}>
        <View style={styles.topContainer}>  
          <UrduText style={[styles.text, { fontSize: 28 ,marginBottom: SPACING.md}]}>یونٹ سیلیکشن برائے بالائی نظم۔</UrduText>
          <CustomDropdown
            options={[]} //TODO: fetch from directus
            onSelect={handleSelection}
            viewStyle={[styles.dropdown]}
            dropdownContainerStyle={styles.dropdownContainer}
            textStyle={[styles.dropdownText]}
            placeholder='ضلع:'
          />
          <CustomDropdown
            options={[]} //TODO: fetch from directus
            onSelect={handleSelection}
            viewStyle={[styles.dropdown]}
            textStyle={[styles.dropdownText]}
            dropdownContainerStyle={styles.dropdownContainer}

            placeholder='زون نمبر:'
          />
          <CustomDropdown
            options={[]} //TODO: fetch from directus
            onSelect={handleSelection}
            viewStyle={[styles.dropdown]}
            textStyle={[styles.dropdownText]}
            dropdownContainerStyle={styles.dropdownContainer}
            placeholder=' یوسی:'
          />
        </View>
        <View style={styles.bottomContainer}>
          <UrduText style={{ color: "#008CFF", fontSize: 24 }}>تفصیل کا عنوان</UrduText>
          <View style={styles.detailsContainer}>
            <View style={styles.detail}>
              <UrduText style={styles.detailText}>ارکان</UrduText>
              <UrduText style={styles.detailText}>50</UrduText>
            </View>
            <View style={styles.detail}>
              <UrduText style={styles.detailText}>ممبران</UrduText>
              <UrduText style={styles.detailText}>500</UrduText>
            </View>
            <View style={styles.detail}>
              <UrduText style={styles.detailText}>ووٹرز</UrduText>
              <UrduText style={styles.detailText}>5000</UrduText>
            </View>
            <View style={styles.detail}>
              <UrduText style={styles.detailText}>وارڈز جن میں نظم قائم ہے</UrduText>
              <UrduText style={styles.detailText}>4</UrduText>
            </View>
            <View style={styles.detail}>
              <UrduText style={styles.detailText}>بلاک کوڈز</UrduText>
              <UrduText style={styles.detailText}>10</UrduText>
            </View>
          </View>
        </View>
  
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  topContainer: {
    backgroundColor: '#008CFF',
    height: "40%",
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingLeft: 16,
    paddingRight: 16
  },
  text: {
    color: "white",
    fontFamily: "JameelNooriNastaleeq",
  },

  dropdown: {
    height: 55,
    marginBottom: SPACING.sm,
  },
  dropdownContainer: {
    width: "100%",
    height: 55,
    borderRadius: 10,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white
  },
  dropdownText: {
    fontSize: 20,
    fontFamily: "JameelNooriNastaleeq"
  },
  bottomContainer: {
    height: "50%",
    alignItems: 'flex-start',
    paddingTop: 24,
    padding: 16
  },
  detailsContainer: {
    marginTop: 20,
    padding: 10,
    width: "100%",
  },
  detailText: {
    fontSize: 20,
    fontFamily: "JameelNooriNastaleeq"
  },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomColor: "#EBEBEB",
    borderBottomWidth: 1,
    margin: 5
  }
});
