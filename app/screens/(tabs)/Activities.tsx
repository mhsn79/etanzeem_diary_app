import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ActivityCard from '../../components/ActivityCard';
import ScreenLayout from '../../components/ScreenLayout';
import { TabGroup } from '@/app/components/Tab';
import { COLORS, SHADOWS, SPACING } from '@/app/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Activities() {
  const insets = useSafeAreaInsets();
  const router = useRouter();  // Router is imported here
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { label: 'شیڈول', value: 0 },
    { label: 'سرگرمی', value: 1 },
  ];

  const activities = [
    {
      id: '1',
      title: 'ماہانہ کارکردگی سرگرمی ۔ ماہ مارچ 2025ء',
      location: 'وارڈ نمبر 3',
      status: '% 50 مکمل',
      daysRemaining: '3 دن باقی ہیں',
    },
    {
      id: '2',
      title: 'ماہانہ کارکردگی سرگرمی ۔ ماہ اپریل 2025ء',
      location: 'وارڈ نمبر 4',
      status: '% 75 مکمل',
      daysRemaining: '2 دن باقی ہیں',
    },
    {
      id: '3',
      title: 'ماہانہ کارکردگی سرگرمی ۔ ماہ مئی 2025ء',
      location: 'وارڈ نمبر 5',
      status: '% 25 مکمل',
      daysRemaining: '5 دن باقی ہیں',
    },
    {
      id: '4',
      title: 'ماہانہ کارکردگی سرگرمی ۔ ماہ جون 2025ء',
      location: 'وارڈ نمبر 6',
      status: '% 90 مکمل',
      daysRemaining: '1 دن باقی ہیں',
    },
  ];

  const handleCreateActivity = () => {
    // Use router.push to navigate to the screen
    router.push('/screens/ScheduleActivitiesScreen');  // This is where we navigate
  };

  return (
    <ScreenLayout title="سرگرمیاں" onBack={() => router.back()}>
      <ScrollView style={styles.container}>
        <TabGroup
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />
        <View style={styles.content}>
          <FlatList
            data={activities} // The array of activity objects
            keyExtractor={(item) => item.id} // Unique key for each item
            renderItem={({ item }) => (
              <ActivityCard
                key={item.id}
                title={item.title}
                location={item.location}
                status={item.status}
                daysRemaining={item.daysRemaining}
                handleLeft={() => {}}
                handleMiddle={() => {}}
                handleRight={() => {}}
              />
            )}
          />
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.overlayButton} onPress={handleCreateActivity}>
        <Ionicons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  content: {
    paddingBottom: 20,
  },
  overlayButton: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    zIndex: 1,
  },
});
