import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Text, View } from 'react-native';
import i18n from '../i18n';
import CustomButton from '../components/CustomButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, lightThemeStyles, darkThemeStyles } from '../_layout';
import { Appearance, useColorScheme } from 'react-native';
import CustomDropdown from '../components/CustomDropdown';
import { Ionicons } from '@expo/vector-icons'; // Import the Ionicons for the back arrow
import { router } from 'expo-router';
import CustomTabbar from '../components/CustomTabbar';

export default function UnitSelection() {
  const insets = useSafeAreaInsets();

  const handleSelection = (selectedItem: string) => {
    console.log('Selected item:', selectedItem);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingTop: insets.top }]} style={styles.container}>
        <Ionicons
          name="arrow-back" // The back arrow icon
          size={24}
          color="black" // You can customize the color here
          style={{ marginLeft: 15 }} // Adjust the position of the button
          onPress={() => router.back()} // Navigate to Home screen on press
        />
        <View>
          <Text>{i18n.t('unit_selection')}</Text>
          <View style={styles.ddcontainer}>
            <Text style={styles.ddheader}>{i18n.t('district')}</Text>
            <CustomDropdown
              options={[i18n.t('district') + ' 1', i18n.t('district') + ' 2', i18n.t('district') + ' 3']}
              onSelect={handleSelection} viewStyle={[]} textStyle={[]}            />
          </View>
          <View style={styles.ddcontainer}>
            <Text style={styles.ddheader}>{i18n.t('zone')}</Text>
            <CustomDropdown
              options={[i18n.t('zone') + ' 1', i18n.t('zone') + ' 2', i18n.t('zone') + ' 3']}
              onSelect={handleSelection} viewStyle={[]} textStyle={[]}            />
          </View>
          <View style={styles.ddcontainer}>
            <Text style={styles.ddheader}>{i18n.t('uc')}</Text>
            <CustomDropdown
              options={[i18n.t('uc') + ' 1', i18n.t('uc') + ' 2', i18n.t('uc') + ' 3']}
              onSelect={handleSelection} viewStyle={[]} textStyle={[]}            />
          </View>
          <CustomTabbar />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  ddcontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ddheader: {
    fontSize: 24,
    marginBottom: 20,
  },
});
