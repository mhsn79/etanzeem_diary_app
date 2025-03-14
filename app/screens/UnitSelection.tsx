import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ScrollView, View, StatusBar } from 'react-native';
import i18n from '../i18n';
import CustomDropdown from '../components/CustomDropdown';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
// import CustomTabbar from '../components/CustomTabbar';
import Spacer from '../components/Spacer';
import UrduText from '../components/UrduText';

export default function UnitSelection() {

  const handleSelection = (selectedItem: string) => {
    console.log('Selected item:', selectedItem);
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent"/> {/*fix... */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[{ flexGrow: 1 }]} style={styles.container}>
          <View style={styles.topContainer}>
            <UrduText style={[styles.text, { fontSize: 20 }]}>تنظیمی ہیئت</UrduText>
            <Spacer height={40}/>
            <UrduText style={[styles.text, { fontSize: 28 }]}>یونٹ سیلیکشن برائے بالائی نظم۔</UrduText>
            <CustomDropdown
              options={[]} //TODO: fetch from directus
              onSelect={handleSelection}
              viewStyle={[styles.dropdown]}
              textStyle={[styles.dropdownText]}
              placeholder='ضلع:'
            />
            <CustomDropdown
              options={[]} //TODO: fetch from directus
              onSelect={handleSelection}
              viewStyle={[styles.dropdown]}
              textStyle={[styles.dropdownText]}
              placeholder='زون نمبر:'
            />
            <CustomDropdown
              options={[]} //TODO: fetch from directus
              onSelect={handleSelection}
              viewStyle={[styles.dropdown]}
              textStyle={[styles.dropdownText]}
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
          <View style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              onPress={() => router.back()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backButton: {
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 50,
    left: 15,
    width: 47,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  topContainer: {
    backgroundColor: '#008CFF',
    height: "50%",
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    alignItems: 'center',
    paddingTop: 62,
    paddingLeft: 16,
    paddingRight: 16
  },
  text: {
    color: "white",
    fontFamily: "JameelNooriNastaleeq",
  },
  dropdown: {
    height: 55,
    marginBottom: 0
  },
  dropdownText: {
    fontSize: 20,
    fontFamily: "JameelNooriNastaleeq"
  },
  bottomContainer: {
    height: "50%",
    alignItems: 'flex-end',
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
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomColor: "#EBEBEB",
    borderBottomWidth: 1,
    margin: 5
  }
});
