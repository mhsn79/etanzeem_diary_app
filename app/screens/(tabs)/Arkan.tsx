import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, FlatList, View, Text, Image, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import i18n from '../../i18n';
import { RootStackParamList } from '@/src/types/RootStackParamList';
import { COLORS } from '@/app/constants/theme';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPersonsByUnit, selectAllPersons, selectPersonsStatus, selectPersonsError } from '@/app/features/persons/personSlice';
import { Person } from '@/app/models/Person';
import { AppDispatch } from '@/app/store';
import RukunCard from '@/app/components/RukunCard';
import CustomButton from '@/app/components/CustomButton';
import CustomTextInput from '@/app/components/CustomTextInput';
import UrduText from '@/app/components/UrduText';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from 'expo-router';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Arkan() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const persons = useSelector(selectAllPersons);
  const status = useSelector(selectPersonsStatus);
  const error = useSelector(selectPersonsError);

  // Local state
  const [filteredData, setFilteredData] = useState<Person[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch persons on component mount
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPersonsByUnit());
    }
  }, [dispatch, status]);

  // Filter persons based on search query
  const filteredPersons = useMemo(() => {
    if (!searchQuery.trim()) return persons;

    const query = searchQuery.toLowerCase().trim();
    return persons.filter(person => {
      const nameMatch = person.name?.toLowerCase().includes(query);
      const addressMatch = person.address?.toLowerCase().includes(query) || person.Address?.toLowerCase().includes(query);
      const phoneMatch = person.phone?.includes(query) || person.Phone_Number?.includes(query);
      return nameMatch || addressMatch || phoneMatch;
    });
  }, [persons, searchQuery]);

  // Update filtered data
  useEffect(() => {
    setFilteredData(filteredPersons);
  }, [filteredPersons]);

  // Handle search input
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchPersonsByUnit()).unwrap();
    } catch (error) {
      console.error('Error refreshing persons:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Handle adding a new person
  const handleAddNewRukun = useCallback(() => {
    const rukun: Person = {
      id: 0,
      name: '',
      address: '',
      phone: '',
      picture: '',
      status: 'draft',
    };
    navigation.navigate('screens/RukunAddEdit', { rukun });
  }, [navigation]);

  // Render loading state
  if (status === 'loading' && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{i18n.t('loading')}</Text>
      </View>
    );
  }

  // Render error state
  if (status === 'failed' && error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>
          {error.includes('{') ? i18n.t('api_error') : error}
        </Text>
        <CustomButton
          text={i18n.t('try_again')}
          onPress={() => dispatch(fetchPersonsByUnit())}
          style={styles.retryButton}
          viewStyle={styles.retryButtonView}
          textStyle={styles.retryButtonText}
        />
      </View>
    );
  }

  const safeTop = insets.top > 0 ? insets.top : 10;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <FlatList
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: safeTop,
          paddingHorizontal: 20,
          paddingBottom: 20,
          direction: i18n.locale === 'ur' ? 'rtl' : 'ltr',
        }}
        data={filteredData}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <RukunCard item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.headerContainer}>
              <View style={styles.headerTextContainer}>
                <Image
                  source={require('@/assets/images/multiple-users.png')}
                  style={styles.headerIcon}
                />
                <Text style={styles.headerCount}>{persons.length}</Text>
                <UrduText style={styles.headerTitle}>{i18n.t('total_members')}</UrduText>
              </View>
              <CustomButton
                text={i18n.t('add_new')}
                onPress={handleAddNewRukun}
                style={styles.addButton}
                viewStyle={styles.addButtonView}
                textStyle={styles.addButtonText}
              />
            </View>
            <View style={styles.searchContainer}>
              <Image
                source={require('@/assets/images/magnifier.png')}
                style={styles.searchIcon}
              />
              <CustomTextInput
                placeholder={i18n.t('search_by_name_address_phone')}
                placeholderTextColor={COLORS.textSecondary}
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchInput}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? `${i18n.t('no_search_results_for')} "${searchQuery}"`
                : i18n.t('no_persons_found_in_units')}
            </Text>
            {!searchQuery.trim() && (
              <CustomButton
                text={i18n.t('refresh')}
                onPress={onRefresh}
                style={styles.retryButton}
                viewStyle={styles.retryButtonView}
                textStyle={styles.retryButtonText}
              />
            )}
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 44,
    height: 44,
  },
  headerCount: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    borderRadius: 25,
  },
  addButtonView: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 25,
    height: 48,
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
  },
  retryButtonView: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});