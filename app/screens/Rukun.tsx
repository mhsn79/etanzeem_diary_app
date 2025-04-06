import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Text, View } from 'react-native';
import i18n from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Rukun() {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingTop: insets.top }]} style={styles.container}>

    <View>
      <Text>{i18n.t('rukun')}</Text>
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
