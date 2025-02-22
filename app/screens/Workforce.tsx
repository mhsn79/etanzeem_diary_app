import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Text, View } from 'react-native';
import i18n from '../i18n';
import CustomButton from '../components/CustomButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, lightThemeStyles, darkThemeStyles } from '../_layout';
import { Appearance, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Workforce() {
  const insets = useSafeAreaInsets();

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
          <Text>{i18n.t('workforce')}</Text>
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
  }
});
