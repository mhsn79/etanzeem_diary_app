import React from 'react';
import { useNavigation } from 'expo-router';
import ScreenLayout from '../../components/ScreenLayout';
import { COLORS } from '@/app/constants/theme';
import UrduText from '@/app/components/UrduText';
import { View, StyleSheet } from 'react-native';

const CreateReportScreen = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScreenLayout
      title="رپورٹ بنائیں"
      onBack={handleBack}

    >
        <View style={styles.container}>
            <UrduText>Hello</UrduText>
        </View>
      {/* Add your screen content here */}
    </ScreenLayout>
  );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
  
  });
export default CreateReportScreen; 