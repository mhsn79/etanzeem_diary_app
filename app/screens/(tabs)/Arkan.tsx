import React, { useEffect, useState, useCallback } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Text, View, TouchableOpacity, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import i18n from '../../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RukunCard from '@/app/components/RukunCard';
import CustomButton from '@/app/components/CustomButton';
import CustomTextInput from '@/app/components/CustomTextInput';
import { RukunData } from '@/app/models/RukunData';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/src/types/RootStackParamList";
import { COLORS } from '@/app/constants/theme';
import UrduText from '@/app/components/UrduText';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchPersons, 
  selectAllPersons, 
  selectPersonsStatus, 
  selectPersonsError,

} from '@/app/features/persons/personSlice';
import { Person } from '@/app/models/Person';
import { AppDispatch } from '@/app/store';

export default function Arkan() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
      dispatch(fetchPersons());
    }
  }, [dispatch, status]);

  // Update filtered data when persons change or search query changes
  useEffect(() => {
    filterData(searchQuery);
  }, [persons, searchQuery]);

  // Filter function
  const filterData = (query: string) => {
    if (!query.trim()) {
      setFilteredData(persons);
      return;
    }
    
    const filtered = persons.filter(item => {
      const nameMatch = item.name && item.name.toLowerCase().includes(query.toLowerCase());
      const idMatch = item.id.toString().includes(query);
      
      return nameMatch || idMatch;
    });
    
    setFilteredData(filtered);
  };

  // Handle search input change
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchPersons());
    setRefreshing(false);
  }, [dispatch]);

  // Handle adding a new person
  const handleAddNewRukun = () => {
    let r: RukunData = {
      id: 0,
      name: '',
      address: '',
      phone: '',
      whatsApp: '',
      sms: '',
      picture: '',
      parent: undefined,
      dob: undefined,
      cnic: undefined,
      unit: undefined,
      status: undefined,
      email: undefined
    };
    navigation.navigate('screens/RukunAddEdit', { rukun: r });
  };

  // Render loading state
  if (status === 'loading' && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{i18n.t('loading')}</Text>
      </View>
    );
  }
console.log('=======================',status,error);

  // Render error state
  if (status === 'failed' && error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>
          {typeof error === 'string' 
            ? error.includes('{') 
              ? 'API Error: Permission denied or field does not exist'
              : error 
            : 'An error occurred'}
        </Text>
        <CustomButton
          text={i18n.t('try_again')}
          onPress={() => dispatch(fetchPersons())}
          style={{ marginTop: 20 }}
          viewStyle={[styles.retryButton]}
          textStyle={[styles.retryButtonText]}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={{ 
          flexGrow: 1, 
          paddingTop: insets.top, 
          direction: i18n.locale === 'ur' ? 'rtl' : 'ltr',
          paddingHorizontal: 20,
          paddingBottom: 20
        }}
        style={styles.container}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.headerTextContainer}>
                <Image source={require('@/assets/images/multiple-users.png')} style={styles.headerIcon} />
                <Text style={styles.headerCount}>{' ' + (persons ? persons.length : 0) + ' '}</Text>
                <UrduText style={styles.headerTitle}>کل ارکان</UrduText>
              </View>
              <CustomButton
                text={i18n.t('add_new_rukun')}
                style={styles.addButton}
                viewStyle={[styles.addButtonView]}
                textStyle={[styles.addButtonText]}
                iconImage={require('@/assets/images/add-icon.png')}
                onPress={handleAddNewRukun}
              />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Image source={require('@/assets/images/magnifier.png')} style={styles.searchIcon} />
              <CustomTextInput
                placeholder={i18n.t('search_by_name_or_id')}
                placeholderTextColor={"#2D2327"}
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchInput}
              />
            </View>
          </>
        }
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <RukunCard item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim() 
                ? i18n.t('no_search_results') 
                : i18n.t('no_persons_found')}
            </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 10,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 44,
    height: 44,
  },
  headerCount: {
    fontSize: 22,
    paddingStart: 10,
  },
  headerTitle: {
    fontSize: 18,
    paddingEnd: 10,
  },
  addButton: {
    marginStart: 10,
    borderColor: '#008CFF',
    borderRadius: 50,
  },
  addButtonView: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#008CFF',
    borderRadius: 50,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    paddingStart: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    borderRadius: 50,
    height: 48,
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray2
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginStart: 10,
    marginEnd: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 2,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error || 'red',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
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
    color: COLORS.textSecondary || '#666',
    textAlign: 'center',
  },
});
