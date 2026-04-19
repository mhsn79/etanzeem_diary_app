import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, FlatList, View, Text, Image, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../../i18n';
import { RootStackParamList } from '@/src/types/RootStackParamList';
import { COLORS } from '@/app/constants/theme';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPersonsByUnit,
  fetchPersonsByUnitId,
  fetchPersonsByMultipleUnits,
  selectAllPersons,
  selectPersonsStatus,
  selectPersonsError,
  fetchContactTypes,
  selectContactTypes,
  selectContactTypesStatus,
  selectContactTypesError
} from '@/app/features/persons/personSlice';
import { Person } from '@/app/models/Person';
import { AppDispatch } from '@/app/store';
import {
  selectDashboardSelectedUnit,
  selectDashboardSelectedUnitId,
  selectUserUnitDetails,
  selectAllAccessibleUnitIds,
} from '@/app/features/tanzeem/tanzeemSlice';
import RukunCard from '@/app/components/RukunCard';
import CustomButton from '@/app/components/CustomButton';
import CustomTextInput from '@/app/components/CustomTextInput';
import UrduText from '@/app/components/UrduText';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, router, useLocalSearchParams } from 'expo-router';
import { TabGroup } from '@/app/components/Tab';
import UnitSelectorBar from '@/app/components/UnitSelectorBar';
import NoUnitMessage from '@/app/components/NoUnitMessage';
import { selectAllTanzeemiUnits } from '@/app/features/tanzeem/tanzeemSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Arkan() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { contactType: contactTypeParam } = useLocalSearchParams<{ contactType?: string }>();

  // Redux state
  const persons = useSelector(selectAllPersons);
  const status = useSelector(selectPersonsStatus);
  const error = useSelector(selectPersonsError);
  const contactTypes = useSelector(selectContactTypes);
  const contactTypesStatus = useSelector(selectContactTypesStatus);
  const contactTypesError = useSelector(selectContactTypesError);

  // Get selected unit for dashboard
  const selectedUnit = useSelector(selectDashboardSelectedUnit);
  const selectedUnitId = useSelector(selectDashboardSelectedUnitId);
  const userUnit = useSelector(selectUserUnitDetails);

  // Use selected unit if available, otherwise fall back to user unit
  const displayUnit = selectedUnit || userUnit;
  const displayUnitId = selectedUnitId || userUnit?.id;

  // All accessible unit IDs (for collective persons view) — stabilize reference
  const allAccessibleIdsRaw = useSelector(selectAllAccessibleUnitIds);
  const allAccessibleIdsKey = useMemo(() => allAccessibleIdsRaw.join(','), [allAccessibleIdsRaw]);
  const allAccessibleUnitIds = useMemo(() => allAccessibleIdsRaw, [allAccessibleIdsKey]);
  const allTanzeemiUnits = useSelector(selectAllTanzeemiUnits);

  // Unit IDs to filter contacts by — selected unit + all its descendants
  const contactUnitIds = useMemo(() => {
    const ids = new Set<number>();
    if (!displayUnitId) return ids;
    ids.add(displayUnitId);
    const addDescendants = (parentId: number) => {
      allTanzeemiUnits.forEach(u => {
        const pid = Number(u.Parent_id || u.parent_id);
        if (pid === parentId && !ids.has(u.id)) {
          ids.add(u.id);
          addDescendants(u.id);
        }
      });
    };
    addDescendants(displayUnitId);
    return ids;
  }, [displayUnitId, allTanzeemiUnits]);

  // Local state
  const [filteredData, setFilteredData] = useState<Person[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<number>(0);

  // Define tabs with badges in custom order
  const tabs = useMemo(() => {
    const activePersons = persons.filter(person => {
      if (person.status === 'archived') return false;
      if (contactUnitIds.size > 0) {
        const rawUnit = person.Tanzeemi_Unit;
        const unitId = typeof rawUnit === 'object' && rawUnit !== null ? Number((rawUnit as any).id) : Number(rawUnit);
        if (isNaN(unitId) || !contactUnitIds.has(unitId)) return false;
      }
      return true;
    });
    const typeCounts = (contactTypes || []).reduce((acc, type) => {
      acc[type.id] = activePersons.filter(person => person.contact_type === type.id).length;
      return acc;
    }, {} as Record<number, number>);

    // Define the desired order of contact types (rightmost to leftmost)
    const desiredOrder = ['rukun', 'umeedwar', 'karkun', 'others'];
    
    // Create ordered contact types array
    const orderedContactTypes = desiredOrder
      .map(typeString => contactTypes?.find(type => type.type === typeString))
      .filter((type): type is NonNullable<typeof type> => Boolean(type)); // Remove undefined values with type guard

    const tabs = orderedContactTypes.map(type => ({
      label: i18n.t(type.type) || type.type,
      value: type.id,
      badge: typeCounts[type.id]?.toString() || '0'
    }));

    // Set initial tab to first available tab if current selection is invalid
    if (tabs.length > 0 && (selectedTab === 0 || !tabs.find(tab => tab.value === selectedTab))) {
      setSelectedTab(tabs[0].value);
    }

    return tabs;
  }, [persons, contactTypes, i18n, selectedTab, contactUnitIds]);

  // Fetch persons and contact types on component mount
  useEffect(() => {
    if (contactTypesStatus === 'idle') {
      dispatch(fetchContactTypes());
    }
  }, [dispatch, contactTypesStatus]);

  // Set the selected tab when navigated with a contactType param (e.g. from Workforce)
  useEffect(() => {
    if (contactTypeParam && contactTypes.length > 0) {
      const ct = contactTypes.find(type => type.type === contactTypeParam);
      if (ct) {
        setSelectedTab(ct.id);
      }
    }
  }, [contactTypeParam, contactTypes]);

  // Fetch persons when accessible units are available and user is authenticated
  const isAuthenticated = useSelector((state: any) => !!state.auth?.tokens?.accessToken);
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!displayUnitId || typeof displayUnitId !== 'number') return;
    if (allAccessibleUnitIds.length === 0) return;

    if (allAccessibleUnitIds.length > 1) {
      dispatch(fetchPersonsByMultipleUnits(allAccessibleUnitIds));
    } else {
      const unitId = allAccessibleUnitIds[0] || displayUnitId;
      if (unitId && typeof unitId === 'number') {
        dispatch(fetchPersonsByUnitId(unitId));
      }
    }
  }, [allAccessibleIdsKey, displayUnitId, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter persons based on unit selection, search query and selected tab
  const filteredPersons = useMemo(() => {
    // First, exclude archived persons and filter by selected unit + descendants
    const activePersons = persons.filter(person => {
      if (person.status === 'archived') return false;
      if (contactUnitIds.size > 0) {
        const rawUnit = person.Tanzeemi_Unit;
        const unitId = typeof rawUnit === 'object' && rawUnit !== null ? Number((rawUnit as any).id) : Number(rawUnit);
        if (isNaN(unitId) || !contactUnitIds.has(unitId)) return false;
      }
      return true;
    });

    // Then filter by tab selection
    let tabFilteredPersons = activePersons;
    
    // If a specific tab is selected, filter by that contact type
    if (selectedTab !== 0 && tabs.find(tab => tab.value === selectedTab)) {
      tabFilteredPersons = activePersons.filter(person => person.contact_type === selectedTab);
    }
    
    // Then apply search query filter if needed
    if (!searchQuery.trim()) return tabFilteredPersons;

    const query = searchQuery.toLowerCase().trim();
    return tabFilteredPersons.filter(person => {
      const nameMatch = person.Name?.toLowerCase().includes(query);
      const addressMatch = person.Address?.toLowerCase().includes(query);
      const phoneMatch = person.Phone_Number?.includes(query);
      return nameMatch || addressMatch || phoneMatch;
    });
  }, [persons, searchQuery, selectedTab, tabs, contactUnitIds]);

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
      const promises: Promise<any>[] = [dispatch(fetchContactTypes()).unwrap()];

      if (allAccessibleUnitIds.length > 1) {
        promises.push(dispatch(fetchPersonsByMultipleUnits(allAccessibleUnitIds)).unwrap());
      } else if (displayUnitId && typeof displayUnitId === 'number') {
        promises.push(dispatch(fetchPersonsByUnitId(displayUnitId)).unwrap());
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, allAccessibleUnitIds, displayUnitId]);

  // Check if the active tab is 'rukun' (rukun can only be added by admin)
  const isRukunTab = useMemo(() => {
    const activeContactType = contactTypes?.find(ct => ct.id === selectedTab);
    return activeContactType?.type === 'rukun';
  }, [selectedTab, contactTypes]);

  // Handle adding a new person - pass current tab's contact type
  const handleAddNewRukun = useCallback(() => {
    const activeTab = tabs.find(tab => tab.value === selectedTab);
    const activeContactType = activeTab ? contactTypes.find(ct => ct.id === activeTab.value) : null;
    // Don't pre-select 'rukun' type (rukun can only be added by admin)
    const contactTypeId = activeContactType && activeContactType.type !== 'rukun' ? activeContactType.id : undefined;
    navigation.navigate('screens/RukunAddEdit', { contactTypeId });
  }, [navigation, tabs, selectedTab, contactTypes]);

  // Get the contact type label for a person
  const getContactTypeLabel = useCallback((person: Person) => {
    if (!person.contact_type || !contactTypes.length) {
      return '';
    }

    const contactType = contactTypes.find(type => type.id === person.contact_type);
    if (contactType) {
      return contactType.label_singular || i18n.t(contactType.type) || contactType.type;
    }

    return '';
  }, [contactTypes]);

  // Handle card press to show detailed view
  const handleCardPress = useCallback((item: Person) => {
    const contactTypeLabel = getContactTypeLabel(item);
    navigation.navigate('screens/RukunView', { 
      rukun: item, 
      contactTypeLabel 
    });
  }, [navigation, getContactTypeLabel]);

  // No unit assigned
  if (!displayUnitId) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <NoUnitMessage />
      </SafeAreaView>
    );
  }

  // Render loading state
  if ((status === 'loading' || contactTypesStatus === 'loading') && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
          translucent={Platform.OS === 'android'}
        />
        <View style={[styles.keyboardAvoidingContainer, styles.centerContent]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{i18n.t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if ((status === 'failed' && error) || (contactTypesStatus === 'failed' && contactTypesError)) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
          translucent={Platform.OS === 'android'}
        />
        <View style={[styles.keyboardAvoidingContainer, styles.centerContent]}>
          <Text style={styles.errorText}>
            {error?.includes('{') ? i18n.t('api_error') : error || contactTypesError}
          </Text>
          <CustomButton
            text={i18n.t('try_again')}
            onPress={() => {
              if (allAccessibleUnitIds.length > 1) {
                dispatch(fetchPersonsByMultipleUnits(allAccessibleUnitIds));
              } else if (displayUnitId && typeof displayUnitId === 'number') {
                dispatch(fetchPersonsByUnitId(displayUnitId));
              }
              dispatch(fetchContactTypes());
            }}
            style={styles.retryButton}
            viewStyle={styles.retryButtonView}
            textStyle={styles.retryButtonText}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
        translucent={Platform.OS === 'android'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <FlatList
          removeClippedSubviews={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 10,
            paddingHorizontal: 20,
            paddingBottom: 20,
            direction: i18n.locale === 'ur' ? 'rtl' : 'ltr',
          }}
          data={filteredData}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <RukunCard item={item} onCardPress={handleCardPress} contactTypes={contactTypes} />}
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
                  <Text style={styles.headerCount}>{filteredData.length}</Text>
                  <UrduText style={styles.headerTitle}>
                    {selectedTab === 0 
                      ? i18n.t('total_members') 
                      : i18n.t((contactTypes || []).find(type => type.id === selectedTab)?.type || '')}
                  </UrduText>
                </View>
                <View style={styles.headerButtonsContainer}>
                  <CustomButton
                    text={i18n.t('initial_info')}
                    onPress={() => router.push('/screens/Workforce')}
                    style={styles.addButton}
                    viewStyle={styles.workforceButtonView}
                    textStyle={styles.workforceButtonText}
                  />
                  {!isRukunTab && (
                    <CustomButton
                      text={i18n.t('add_new')}
                      onPress={handleAddNewRukun}
                      style={styles.addButton}
                      viewStyle={styles.addButtonView}
                      textStyle={styles.addButtonText}
                    />
                  )}
                </View>
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
                  textAlign='right'
                  style={styles.searchInput}
                />
              </View>
              <UnitSelectorBar />
              {contactTypes && contactTypes.length > 0 && (
                <View style={styles.tabSection}>
                  <TabGroup tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `${i18n.t('no_search_results_for')} "${searchQuery}"`
                  : selectedTab === 0
                    ? i18n.t('no_persons_found_in_units')
                    : i18n.t('no_persons_found_for_type')}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  keyboardAvoidingContainer: {
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
    fontFamily: 'JameelNooriNastaleeq',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'JameelNooriNastaleeq',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  workforceButtonView: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  workforceButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'JameelNooriNastaleeq',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'JameelNooriNastaleeq',
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
    fontFamily: 'JameelNooriNastaleeq',
  },
  tabSection: {
    marginBottom: 15,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: 'JameelNooriNastaleeq',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    fontFamily: 'JameelNooriNastaleeq',
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
    fontFamily: 'JameelNooriNastaleeq',
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
    fontFamily: 'JameelNooriNastaleeq',
  },
});