import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  ScrollView, 
  View, 
  Text, 
  Image, 
  Pressable, 
  ModalProps, 
  Dimensions,
  AccessibilityProps,
  useWindowDimensions,
  StatusBar,
  ActivityIndicator,
  Animated,
  TextInput
} from 'react-native';
import Modal from 'react-native-modal';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// We'll use Vibration API from React Native instead of external packages
import { Vibration } from 'react-native';

// SVG Icons
import EditIcon from '../../assets/images/edit-icon.svg';
import PlusIcon from '../../assets/images/plus-icon.svg';
import MinusIcon from '../../assets/images/minus-icon.svg';
import ModalCloseIcon from '../../assets/images/modal-close-icon.svg';

// Components
import CustomButton from '../components/CustomButton';
import UrduText from '../components/UrduText';

// Redux
import { 
  fetchPersonsByUnit, 
  selectAllPersons, 
  selectPersonsStatus, 
  selectPersonsError,
  fetchContactTypes,
  selectContactTypes,
  selectContactTypesStatus,
  selectContactTypesError
} from '@/app/features/persons/personSlice';
import {
  refreshStrengthData,
  setUserUnitId,
  selectStrengthTypes,
  selectStrengthByCategory,
  selectLatestStrengthRecordsByType,
  createStrengthRecord,
  selectUserUnitId
} from '@/app/features/strength/strengthSlice';
import { AppDispatch, RootState } from '@/app/store';

// Theme and constants
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SIZES, SHADOWS, Z_INDEX, ANIMATION } from '../constants/theme';
import i18n from '../i18n';

// Types
interface EditModalProps extends ModalProps {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  type: string;
  currentValue: number;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  typeId?: number;
}

interface WorkforceItemProps extends AccessibilityProps {
  label: string;
  value: number;
  onEdit: () => void;
  typeId?: number; // Kept for compatibility with existing code
}

/**
 * EditModal Component
 * 
 * A modal for editing workforce numbers with direct input and change type selection
 * Redesigned for improved visual appeal and user experience
 */
function EditModal({ 
  visible, 
  setVisible, 
  title, 
  type, 
  currentValue, 
  setValue,
  typeId
}: EditModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [changeType, setChangeType] = useState<'plus' | 'minus'>('plus');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const userUnitId = useSelector(selectUserUnitId);
  
  // Animation values
  const [scaleAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [inputRef, setInputRef] = useState<TextInput | null>(null);
  
  // Calculate numeric value from input
  const numericValue = useMemo(() => {
    const parsed = parseInt(inputValue, 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [inputValue]);
  
  // Calculate total after changes
  const totalValue = useMemo(() => {
    if (changeType === 'plus') {
      return currentValue + numericValue;
    } else {
      return Math.max(0, currentValue - numericValue);
    }
  }, [currentValue, numericValue, changeType]);
  
  // Handle input change with validation
  const handleInputChange = useCallback((text: string) => {
    // Only allow numeric input
    if (/^\d*$/.test(text)) {
      setInputValue(text);
      
      // Add vibration feedback on supported platforms
      if (text && Platform.OS !== 'web') {
        Vibration.vibrate(5); // Very short vibration
      }
    }
  }, []);
  
  // Toggle change type between plus and minus
  const toggleChangeType = useCallback((type: 'plus' | 'minus') => {
    if (changeType !== type) {
      setChangeType(type);
      
      // Add vibration feedback on supported platforms
      if (Platform.OS !== 'web') {
        Vibration.vibrate(10); // Short vibration
      }
      
      // Animate the change
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION.duration.fast / 2,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION.duration.fast,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [changeType, fadeAnim]);
  
  // Reset the form when modal becomes visible
  useEffect(() => {
    if (visible) {
      setInputValue('');
      setChangeType('plus');
      
      // Animate fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION.duration.normal,
        useNativeDriver: true,
      }).start();
      
      // Focus the input field after a short delay
      setTimeout(() => {
        if (inputRef) {
          inputRef.focus();
        }
      }, 300);
    }
  }, [visible, fadeAnim]);
  
  // Save changes and close modal
  const handleUpdate = useCallback(() => {
    // Only proceed if we have valid data
    if (typeId && userUnitId && numericValue > 0) {
      // Calculate the new total based on the change type
      const newTotal = totalValue;
      
      // Update the local state with the new total immediately for responsive UI
      setValue(newTotal);
      
      // Prepare the record data
      const recordData = {
        Type: typeId,
        Value: numericValue,
        change_type: changeType,
        new_total: newTotal,
        Reporting_Time: new Date().toISOString()
      };
      
      console.log('Creating strength record with data:', JSON.stringify(recordData, null, 2));
      
      // Create a new strength record
      dispatch(createStrengthRecord(recordData))
        .unwrap() // Properly handle the Promise from createAsyncThunk
        .then((result) => {
          console.log('Strength record created successfully:', JSON.stringify(result, null, 2));
          
          // Refresh the data to show the updated values
          dispatch(refreshStrengthData());
          
          // Show success feedback (could add a toast notification here)
          console.log(`Successfully updated ${type} to ${newTotal}`);
          
          // Add success vibration feedback on supported platforms
          if (Platform.OS !== 'web') {
            Vibration.vibrate([0, 50, 50, 50]); // Success pattern
          }
        })
        .catch(error => {
          console.error('Failed to create strength record:', error);
          
          // Could add error handling UI feedback here
          // For now, we'll keep the UI updated with the new value anyway
          
          // Add error vibration feedback on supported platforms
          if (Platform.OS !== 'web') {
            Vibration.vibrate([0, 100, 50, 100]); // Error pattern
          }
        });
    } else {
      // Log appropriate warnings
      if (!typeId) {
        console.warn('No type ID provided, cannot create strength record');
      } else if (!userUnitId) {
        console.warn('No user unit ID available, cannot create strength record');
      } else if (numericValue === 0) {
        console.log('No change in value, skipping record creation');
      }
      
      // Still update the UI value if needed
      if (numericValue > 0) {
        setValue(totalValue);
      }
    }
    
    // Reset and close
    setInputValue('');
    setVisible(false);
  }, [totalValue, setValue, setVisible, typeId, userUnitId, numericValue, changeType, dispatch, type]);
  
  // Close modal without saving
  const handleClose = useCallback(() => {
    setInputValue('');
    setVisible(false);
  }, [setVisible]);

  // Determine if update button should be disabled
  const isUpdateDisabled = numericValue === 0;

  return (
    <Modal
      isVisible={visible}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={ANIMATION.duration.normal}
      animationOutTiming={ANIMATION.duration.normal}
      useNativeDriver={true}
      coverScreen={true}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      statusBarTranslucent={true}
      backdropOpacity={0.6}
      deviceHeight={Dimensions.get('screen').height}
      style={styles.modalContainer}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ width: width * 0.9 }}
      >
        <Animated.View 
          style={[
            styles.modalCard, 
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Header with title and close button */}
          <View style={styles.modalHeader}>
            <UrduText style={styles.modalTitle}>{title}</UrduText>
            <Pressable 
              onPress={handleClose} 
              style={styles.modalCloseButton}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('close')}
              accessibilityHint={i18n.t('close_modal_without_saving')}
            >
              <ModalCloseIcon height={30} width={30} color={COLORS.white} />
            </Pressable>
          </View>
          
          <View style={styles.modalContent}>
            {/* Current Value */}
            <View style={styles.fieldContainer}>
              <UrduText style={styles.fieldLabel}>موجودہ {type}</UrduText>
              <View style={styles.fieldValueContainer}>
                <Text style={styles.currentValue}>{currentValue}</Text>
              </View>
            </View>
            
            {/* Change Type Selection */}
            <View style={styles.fieldContainer}>
              <UrduText style={styles.fieldLabel}>تبدیلی کی قسم</UrduText>
              <View style={styles.changeTypeContainer}>
                <Pressable 
                  onPress={() => toggleChangeType('plus')}
                  style={({pressed}) => [
                    styles.changeTypeButton,
                    {
                      backgroundColor: changeType === 'plus' ? COLORS.success : COLORS.white,
                      borderColor: changeType === 'plus' ? COLORS.success : COLORS.lightGray2,
                    },
                    pressed && styles.buttonPressed
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: changeType === 'plus' }}
                  accessibilityLabel={i18n.t('increase')}
                >
                  <View style={styles.changeTypeIcon}>
                    <PlusIcon width={20} height={20} color={changeType === 'plus' ? COLORS.white : COLORS.success} />
                  </View>
                  <UrduText style={[
                    styles.changeTypeText,
                    { color: changeType === 'plus' ? COLORS.white : COLORS.textSecondary }
                  ]}>اضافہ</UrduText>
                </Pressable>
                
                <Pressable 
                  onPress={() => toggleChangeType('minus')}
                  style={({pressed}) => [
                    styles.changeTypeButton,
                    {
                      backgroundColor: changeType === 'minus' ? COLORS.error : COLORS.white,
                      borderColor: changeType === 'minus' ? COLORS.error : COLORS.lightGray2,
                    },
                    pressed && styles.buttonPressed
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: changeType === 'minus' }}
                  accessibilityLabel={i18n.t('decrease')}
                >
                  <View style={styles.changeTypeIcon}>
                    <MinusIcon width={20} height={20} color={changeType === 'minus' ? COLORS.white : COLORS.error} />
                  </View>
                  <UrduText style={[
                    styles.changeTypeText,
                    { color: changeType === 'minus' ? COLORS.white : COLORS.textSecondary }
                  ]}>کمی</UrduText>
                </Pressable>
              </View>
            </View>
            
            {/* Value Input */}
            <View style={styles.fieldContainer}>
              <UrduText style={styles.fieldLabel}>تعداد</UrduText>
              <View style={styles.inputWrapper}>
               
                
                <TextInput
                  ref={ref => setInputRef(ref)}
                  style={styles.valueInput}
                  value={inputValue}
                  onChangeText={handleInputChange}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  maxLength={4}
                  accessibilityLabel={i18n.t('enter_value')}
                  accessibilityHint={i18n.t('enter_numeric_value')}
                />
                 <Animated.View style={[
                  styles.inputPrefix,
                  { opacity: fadeAnim }
                ]}>
                  <Text style={[
                    styles.inputPrefixText,
                    changeType === 'plus' ? styles.positiveValue : styles.negativeValue
                  ]}>
                    {changeType === 'plus' ? '+' : '-'}
                  </Text>
                </Animated.View>
              </View>
            </View>
            
            {/* New Total */}
            <View style={styles.fieldContainer}>
              <UrduText style={styles.fieldLabel}>نیا کل {type}</UrduText>
              <View style={styles.totalValueContainer}>
                <Text style={styles.totalValue}>{totalValue}</Text>
              </View>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <CustomButton
              text={'منسوخ کریں'}
              viewStyle={styles.cancelButton}
              textStyle={styles.cancelButtonText}
              onPress={handleClose}
              accessibilityLabel={i18n.t('cancel')}
              accessibilityHint={i18n.t('close_without_saving')}
            />
            
            <CustomButton
              text={'اپڈیٹ کریں'}
              viewStyle={[
                styles.updateButton,
                isUpdateDisabled && styles.updateButtonDisabled
              ]}
              textStyle={styles.updateButtonText}
              onPress={handleUpdate}
              disabled={isUpdateDisabled}
              accessibilityLabel={i18n.t('update')}
              accessibilityHint={i18n.t('save_changes_and_close')}
              accessibilityState={{ disabled: isUpdateDisabled }}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * WorkforceItem Component
 * 
 * A reusable component for displaying workforce items with edit functionality
 */
const WorkforceItem = ({ label, value, onEdit, typeId, ...accessibilityProps }: WorkforceItemProps) => {
  return (
    <View style={styles.detailBox}>
      <UrduText style={styles.detailText}>{label}</UrduText>
      <Text style={styles.detailNum}>{value}</Text>
      <Pressable 
        style={styles.editIcon} 
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`${i18n.t('edit')} ${label}`}
        {...accessibilityProps}
      >
        <EditIcon />
      </Pressable>
    </View>
  );
};

/**
 * StrengthTypeItem Component
 * 
 * A component for displaying and editing strength type items
 */
interface StrengthTypeItemProps {
  type: any;
  latestRecord: any | null;
  latestStrengthRecordsByType: any;
  showModal: (title: string, type: string, currentValue: number, setValue: React.Dispatch<React.SetStateAction<number>>, typeId?: number) => void;
}

const StrengthTypeItem = ({ type, latestRecord, latestStrengthRecordsByType, showModal }: StrengthTypeItemProps) => {
  const currentValue = latestRecord?.new_total || latestStrengthRecordsByType[type.id]?.new_total || 0;
  const [typeValue, setTypeValue] = useState(currentValue);
  
  // Update the local state when the latest record changes
  useEffect(() => {
    const newValue = latestRecord?.new_total || latestStrengthRecordsByType[type.id]?.new_total || 0;
    if (newValue !== typeValue) {
      setTypeValue(newValue);
    }
  }, [latestRecord, latestStrengthRecordsByType, type.id]);
  
  return (
    <WorkforceItem 
      key={type.id}
      label={type.Name_Plural}
      value={typeValue}
      typeId={type.id} // Pass the type ID for debugging
      onEdit={() => showModal(type.Name_Plural, type.Name_Singular, typeValue, setTypeValue, type.id)}
    />
  );
};

/**
 * Workforce Screen Component
 * 
 * Displays and allows editing of workforce statistics
 */
export default function Workforce() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const persons = useSelector(selectAllPersons);
  const status = useSelector(selectPersonsStatus);
  const error = useSelector(selectPersonsError);
  const contactTypes = useSelector(selectContactTypes);
  const contactTypesStatus = useSelector(selectContactTypesStatus);
  const contactTypesError = useSelector(selectContactTypesError);
  
  // Strength slice state
  const strengthTypes = useSelector(selectStrengthTypes);

  const strengthByCategory = useSelector(selectStrengthByCategory);
  const latestStrengthRecordsByType = useSelector(selectLatestStrengthRecordsByType);
  
  // Fetch persons and contact types on component mount
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPersonsByUnit());
    }
    if (contactTypesStatus === 'idle') {
      dispatch(fetchContactTypes());
    }
  }, [dispatch, status, contactTypesStatus]);
  
  // Get the user's unit details from the tanzeem slice
  const userUnitDetails = useSelector((state: RootState) => state.tanzeem.userUnitDetails);
  
  // Fetch strength data
  useEffect(() => {
    // Set the user's unit ID in the strength slice if available
    if (userUnitDetails?.id) {
      dispatch(setUserUnitId(userUnitDetails.id));
    }
    
    // Refresh strength data (this will fetch types and records)
    dispatch(refreshStrengthData());
  }, [dispatch, userUnitDetails?.id]);
  
  // Modal state management

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    type: "",
    currentValue: 0,
    setValue: (() => {}) as React.Dispatch<React.SetStateAction<number>>,
    typeId: undefined as number | undefined
  });

  // Calculate counts based on contact types
  const counts = useMemo(() => {
    if (!persons.length || !contactTypes.length) {
      return {
        rukun: 0,
        karkun: 0,
        umeedwar: 0,
        others: 0,
        total: 0
      };
    }
    
    const result = {
      rukun: 0,
      karkun: 0,
      umeedwar: 0,
      others: 0,
      total: persons.length
    };
    
    contactTypes.forEach(type => {
      const count = persons.filter(person => person.contact_type === type.id).length;
      if (type.type === 'rukun' || type.type === 'karkun' || type.type === 'umeedwar') {
        result[type.type] = count;
      } else {
        result.others += count;
      }
    });
    
    return result;
  }, [persons, contactTypes]);

  // Calculate total members for display
  const totalMembers = useMemo(() => {
    return counts.total;
  }, [counts]);

  // Calculate total change (placeholder for actual calculation)
  const totalChange = useMemo(() => {
    // This would be calculated based on previous values vs current values
    return 13;
  }, []);

  // Get category labels from strength types
  const getCategoryLabel = useCallback((category: string) => {
    if (!strengthTypes.length) {
      // Fallback to hardcoded labels if no strength types available
      switch (category) {
        case 'workforce':
          return 'قوت کی تفصیل';
        case 'place':
          return 'مقامات کی تفصیل';
        case 'magazine':
          return 'رسائل کی تفصیل';
        default:
          return category;
      }
    }
    
    // Find strength types for this category
    const categoryTypes = strengthTypes.filter(type => type.Category === category);
    
    if (categoryTypes.length === 0) {
      // Fallback to hardcoded labels if no types found for this category
      switch (category) {
        case 'workforce':
          return 'قوت کی تفصیل';
        case 'place':
          return 'مقامات کی تفصیل';
        case 'magazine':
          return 'رسائل کی تفصیل';
        default:
          return category;
      }
    }
    
    // Use the Name_Plural from the first type in this category
    const firstType = categoryTypes[0];
    return `${firstType.Name_Plural} کی تفصیل`;
  }, [strengthTypes]);

  // Calculate annual target (placeholder for actual calculation)
  const annualTarget = useMemo(() => {
    // This would be fetched from API or calculated
    return 2341;
  }, []);

  // Show modal with specific configuration
  const showModal = useCallback((
    title: string, 
    type: string, 
    currentValue: number, 
    setValue: React.Dispatch<React.SetStateAction<number>>,
    typeId?: number
  ) => {
    setModalConfig({
      title,
      type,
      currentValue,
      setValue,
      typeId
    });
    setModalVisible(true);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Render loading state
  if ((status === 'loading' || contactTypesStatus === 'loading') && !modalVisible) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
          translucent={Platform.OS === 'android'}
        />
        <View style={[styles.centerContent]}>
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
        <View style={[styles.centerContent]}>
          <Text style={styles.errorText}>
            {error?.includes('{') ? i18n.t('api_error') : error || contactTypesError}
          </Text>
          <CustomButton
            text={i18n.t('try_again')}
            onPress={() => {
              dispatch(fetchPersonsByUnit());
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
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Status Bar */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.primary} 
        translucent={true} 
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[
            { 
              flexGrow: 1,
              paddingBottom: 100, // Add extra padding at the bottom to prevent content from being hidden
            }
          ]} 
          style={styles.container}
        >
        {/* Edit Modal */}
        <EditModal
          visible={modalVisible}
          setVisible={setModalVisible}
          title={modalConfig.title}
          type={modalConfig.type}
          currentValue={modalConfig.currentValue}
          setValue={modalConfig.setValue}
          typeId={modalConfig.typeId}
        />
        
        {/* Top Container with Stats */}
        <View style={styles.topContainer}>
          <View style={styles.quwatContainer}>
             {/* Karkun Count */}
             <View style={styles.quwatBox}>
              <Image 
                source={require('../../assets/images/red-target-icon.png')} 
                style={styles.quwatIcon}
                accessibilityLabel={i18n.t('karkun_icon')}
              />
              <Text style={styles.quwatValue}>{counts.karkun}</Text>
              <UrduText style={styles.quwatText}>{i18n.t('karkun')}</UrduText>
            </View>
         
              {/* Umeedwar Count */}
              <View style={styles.quwatBox}>
              <Image 
                source={require('../../assets/images/yellow-arkan-icon.png')} 
                style={styles.quwatIcon}
                accessibilityLabel={i18n.t('umeedwar_icon')}
              />
              <Text style={styles.quwatValue}>{counts.umeedwar}</Text>
              <UrduText style={styles.quwatText}>{i18n.t('umeedwar')}</UrduText>
            </View>
                       {/* Rukun Count */}

            <View style={styles.quwatBox}>
              <Image 
                source={require('../../assets/images/green-arkan-icon.png')} 
                style={styles.quwatIcon}
                accessibilityLabel={i18n.t('rukun_icon')}
              />
              <Text style={styles.quwatValue}>{counts.rukun}</Text>
              <UrduText style={styles.quwatText}>{i18n.t('rukun')}</UrduText>
            </View>
          
          </View>
          
          <Link href="/screens/Arkan" style={styles.arkanLink}>
            {i18n.t('view_list_of_arkan') || "View List of Arkan"}
          </Link>
        </View>

      
        
        {/* Strength Data by Category */}
        {strengthTypes.length > 0 && (
          <View style={styles.strengthDataContainer}>
            {/* Display categories in the specified order: workforce, place, magazine */}
            {Object.entries(strengthByCategory).map(([category, types]) => (
              <React.Fragment key={category}>
                {/* Only render the category if it has types */}
                {types.length > 0 && (
                  <>
                    {/* Category Heading */}
                    <UrduText style={styles.blueHeading}>
                      {getCategoryLabel(category)}
                    </UrduText>
                    
                    {/* All Types Combined (regardless of gender) */}
                    {types.map(type => (
                      <StrengthTypeItem
                        key={`type-${type.id}`}
                        type={type}
                        latestRecord={null} // We'll use latestStrengthRecordsByType instead
                        latestStrengthRecordsByType={latestStrengthRecordsByType}
                        showModal={showModal}
                      />
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header styles
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    zIndex: Z_INDEX.header,
    ...SHADOWS.medium,
  },
  header: {
    backgroundColor: 'transparent',
  },
  
  // Main container
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  
  // Top section with stats
  topContainer: {
    backgroundColor: COLORS.primary,
    height: "22%",
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius:BORDER_RADIUS.lg,
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.medium
  },
  quwatContainer: {
    height: "75%",
    flexDirection: "row-reverse",
    gap: SPACING.lg,  },
  quwatBox: {
    padding: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    width: "30%",
    height:160,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small
  },
  quwatIcon: {
    width: 50,
    height: 50
  },
  quwatValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: 'bold',
  },
  quwatText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
  },
  arkanLink: {
    color: COLORS.white,
    textDecorationLine: "underline",
    fontSize: TYPOGRAPHY.fontSize.sm
  },
  
  // Bottom section with workforce details
  bottomContainer: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg
  },
  // Strength data container
  strengthDataContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.md
  },
  blueHeading: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    textAlign:'left',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm
  },
  
  // Detail items
  detailBox: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: COLORS.lightGray,
    borderBottomWidth: 1,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.xs
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: "JameelNooriNastaleeq"
  },
  detailNum: {
    marginLeft: "auto",
    fontSize: TYPOGRAPHY.fontSize.md,
    margin: SPACING.sm
  },
  editIcon: {
    padding: SPACING.sm,
  },
  
  // Modal styles - Redesigned with consistent heights and improved UI
  modalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    width: '100%',
    ...SHADOWS.large
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
    height: SPACING.xxl*2,
    lineHeight:60,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.white,
    fontFamily: "JameelNooriNastaleeq",
    textAlign: 'center',
    flex: 1,
  },
  modalCloseButton: {
    position: "absolute",
    right: SPACING.sm,
    padding: SPACING.sm,
    zIndex: Z_INDEX.modal,
  },
  modalContent: {
    padding: SPACING.md,
  },
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: "JameelNooriNastaleeq",
    marginBottom: SPACING.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  fieldValueContainer: {
    height: 60,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
    ...SHADOWS.small
  },
  totalValueContainer: {
    height: 60,
    backgroundColor: COLORS.lightPrimary,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.small
  },
  currentValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  changeTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 60,
  },
  changeTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
    height: '100%',
    ...SHADOWS.small
  },
  changeTypeButtonSelected: {
    borderColor: COLORS.primary,
  },
  changeTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: SPACING.sm,
  },
  changeTypeText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: "JameelNooriNastaleeq",
    color: COLORS.textSecondary,
  },
  changeTypeTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
    height: 60,
    ...SHADOWS.small
  },
  inputPrefix: {
    width: 50,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.lightGray,
  },
  inputPrefixText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
  },
  valueInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
    height: '100%',
    color: COLORS.textPrimary,
  },
  positiveValue: {
    color: COLORS.success,
  },
  negativeValue: {
    color: COLORS.error,
  },
  neutralValue: {
    color: COLORS.textSecondary,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }]
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  updateButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
    height: 50,
  },
  updateButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  updateButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    lineHeight:30
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.warning,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    lineHeight:30
  },
  // Loading and error styles
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  // Removed unused strength data styles
  unitLevelGroup: {
    marginBottom: 20,
    backgroundColor: COLORS.lightPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: 15,
    ...SHADOWS.small,
  },
  unitLevelGroupHeading: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingBottom: 5,
  },
  genderSection: {
    marginBottom: 15,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  genderHeading: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  strengthTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    marginBottom: 5,
    borderRadius: BORDER_RADIUS.sm,
  },
  strengthTypeLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  strengthTypeValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  // Removed unused recent changes styles
});
