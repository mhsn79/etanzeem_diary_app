import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SIZES, SHADOWS } from '../../constants/theme';
import { useNavigation } from 'expo-router';
import ReportCard from './components/ReportCard';
import FilterModal from '../../components/FilterModal';

interface ReportItem {
  id: string;
  title: string;
  sumbitDateText: string;
  location: string;
  status: string;
  statusColor: string;
}

// Static report data
const REPORTS_DATA: ReportItem[] = [
  {
    id: '1',
    title: 'ماہانہ کارکردگی رپورٹ ۔  ماہ مارچ 2025ء',
    sumbitDateText: 'جمع کروانے کی تاریخ – جنوری 2024',
    location: 'یوسی 12 - گلزار ٹاؤن',
    status: 'جمع شدہ',
    statusColor: COLORS.success,
  },
  {
    id: '2',
    title: 'ماہانہ کارکردگی رپورٹ ۔  ماہ مارچ 2025ء',
    sumbitDateText: 'جمع کروانے کی تاریخ – جنوری 2024',
    location: 'یوسی 12 - گلزار ٹاؤن',
    status: 'جمع شدہ',
    statusColor: COLORS.error,
  },
  {
    id: '3',
    title: 'ماہانہ کارکردگی رپورٹ ۔  ماہ مارچ 2025ء',
    sumbitDateText: 'جمع کروانے کی تاریخ – جنوری 2024',
    location: 'یوسی 12 - گلزار ٹاؤن',
    status: 'جمع شدہ',
    statusColor: COLORS.success,
  },
  {
    id: '4',
    title: 'ماہانہ کارکردگی رپورٹ ۔  ماہ مارچ 2025ء',
    sumbitDateText: 'جمع کروانے کی تاریخ – جنوری 2024',
    location: 'یوسی 12 - گلزار ٹاؤن',
    status: 'جمع شدہ',
    statusColor: COLORS.success,
  },
  {
    id: '5',
    title: 'ماہانہ کارکردگی رپورٹ ۔  ماہ مارچ 2025ء',
    sumbitDateText: 'جمع کروانے کی تاریخ – جنوری 2024',
    location: 'یوسی 12 - گلزار ٹاؤن',
    status: 'جمع شدہ',
    statusColor: COLORS.error,
  },
  {
    id: '6',
    title: 'ماہانہ کارکردگی رپورٹ ۔  ماہ مارچ 2025ء',
    sumbitDateText: 'جمع کروانے کی تاریخ – جنوری 2024',
    location: 'یوسی 12 - گلزار ٹاؤن',
    status: 'جمع شدہ',
    statusColor: COLORS.success,
  },
];

const AllReportsScreen = () => {
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useLanguage();
  const navigation = useNavigation();
  const isRTL = currentLanguage === 'ur';
  const [searchText, setSearchText] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const handleCloseFilter = () => {
    setIsFilterModalVisible(false);
  };

  const handleApplyFilter = (selectedTime: string, startDate: Date, endDate: Date) => {
    // Handle filter application here
    console.log('Applying filter:', { selectedTime, startDate, endDate });
  };

  // Memoized render item function
  const renderReportCard = useCallback(({ item }: { item: ReportItem }) => (
    <ReportCard
      title={item.title}
      sumbitDateText={item.sumbitDateText}
      location={item.location}
      status={item.status}
      statusColor={item.statusColor}
    />
  ), []);

  // Memoized key extractor
  const keyExtractor = useCallback((item: ReportItem) => item.id, []);

  // Memoized item separator
  const ItemSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Static Header Section */}
      <View style={[styles.headerSection, { paddingTop: insets.top }]}>
        <Header
          title="تمام رپورٹس دیکھیں"
          onBack={handleBack}
          borderRadius={BORDER_RADIUS.md}
          containerStyle={{ backgroundColor: COLORS.primary }}
        />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TouchableOpacity style={styles.searchIcon}>
              <Ionicons name="search" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="ماہ یا یوسی نمبر سے تلاش کریں"
              placeholderTextColor={COLORS.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              textAlign={isRTL ? 'right' : 'left'}
            />
            <TouchableOpacity style={styles.filterIcon} onPress={handleFilterPress}>
              <MaterialCommunityIcons name="tune-vertical-variant" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* FlatList for Report Cards */}
      <FlatList<ReportItem>
        data={REPORTS_DATA}
        renderItem={renderReportCard}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={5}
      />

      <FilterModal
        visible={isFilterModalVisible}
        onClose={handleCloseFilter}
        onApplyFilter={handleApplyFilter}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSection: {
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.sm,
    height: 48,
    ...SHADOWS.small,
  },
  searchIcon: {
    padding: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.black,
    fontFamily: TYPOGRAPHY.fontFamily.kasheeda,
    paddingHorizontal: SPACING.sm,
  },
  filterIcon: {
    padding: SPACING.xs,
  },
  listContent: {
    padding: SPACING.md,
  },
  separator: {
    height: SPACING.sm,
  },
});

export default AllReportsScreen; 