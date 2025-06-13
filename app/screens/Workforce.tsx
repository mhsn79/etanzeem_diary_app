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
  ActivityIndicator
} from 'react-native';
import Modal from 'react-native-modal';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// SVG Icons
import EditIcon from '../../assets/images/edit-icon.svg';
import PlusIcon from '../../assets/images/plus-icon.svg';
import MinusIcon from '../../assets/images/minus-icon.svg';
import ModalCloseIcon from '../../assets/images/modal-close-icon.svg';

// Components
import CustomButton from '../components/CustomButton';
import UrduText from '../components/UrduText';
import Header from '../components/Header';

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
  fetchStrengthTypes,
  fetchStrengthRecords,
  selectStrengthTypes,
  selectStrengthRecords,
  selectStrengthLoading,
  selectStrengthError,
  selectStrengthRecordsLoading,
  selectStrengthRecordsError,
  selectStrengthByGender,
  selectLatestStrengthRecordsByType,
  selectTotalStrengthValue
} from '@/app/features/strength/strengthSlice';
import { AppDispatch } from '@/app/store';

// Theme and constants
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SIZES, SHADOWS, Z_INDEX } from '../constants/theme';
import i18n from '../i18n';

// Types
interface EditModalProps extends ModalProps {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  type: string;
  currentValue: number;
  setValue: React.Dispatch<React.SetStateAction<number>>;
}

interface WorkforceItemProps extends AccessibilityProps {
  label: string;
  value: number;
  onEdit: () => void;
}

/**
 * EditModal Component
 * 
 * A modal for editing workforce numbers with increment/decrement functionality
 */
function EditModal({ 
  visible, 
  setVisible, 
  title, 
  type, 
  currentValue, 
  setValue
}: EditModalProps) {
  const [addedValue, setAddedValue] = useState(0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  // Calculate total after changes
  const totalValue = useMemo(() => currentValue + addedValue, [currentValue, addedValue]);
  
  // Increment/decrement handlers with memoization
  const handleIncrement = useCallback(() => {
    setAddedValue(prev => prev + 5);
  }, []);
  
  const handleDecrement = useCallback(() => {
    setAddedValue(prev => prev === 0 ? 0 : prev - 5);
  }, []);
  
  // Save changes and close modal
  const handleUpdate = useCallback(() => {
    setValue(totalValue);
    setAddedValue(0);
    setVisible(false);
  }, [totalValue, setValue, setVisible]);
  
  // Close modal without saving
  const handleClose = useCallback(() => {
    setAddedValue(0);
    setVisible(false);
  }, [setVisible]);

  return (
    <Modal
      isVisible={visible}
      animationIn="zoomIn"
      animationOut="zoomOut"
      useNativeDriver={true}
      coverScreen={true}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      statusBarTranslucent={true}
      backdropOpacity={0.5}
      deviceHeight={Dimensions.get('screen').height}
      style={styles.modalContainer}
    >
      <View style={[
        styles.modal, 
        { 
          width: width * 0.85,
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.lg,
          paddingHorizontal: SPACING.lg,
        }
      ]}>
        <Pressable 
          onPress={handleClose} 
          style={styles.modalCloseIcon}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('close')}
          accessibilityHint={i18n.t('close_modal_without_saving')}
        >
          <ModalCloseIcon />
        </Pressable>
        
        <UrduText style={styles.modalTitle}>{title}</UrduText>
        
        {/* Current Value */}
        <View style={styles.modalField}>
          <UrduText style={styles.fieldLabel}>موجودہ {type}</UrduText>
          <Text style={styles.fieldValue}>{currentValue}</Text>
        </View>
        
        {/* New Value with Controls */}
        <View style={styles.modalFieldEdit}>
          <UrduText style={styles.fieldLabel}>نئے شامل کردہ {type}</UrduText>
          
          <View style={styles.controlsContainer}>
            <Pressable 
              onPress={handleDecrement} 
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('decrease')}
            >
              <MinusIcon />
            </Pressable>
            
            <Text style={styles.counterValue}>{addedValue}</Text>
            
            <Pressable 
              onPress={handleIncrement} 
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('increase')}
            >
              <PlusIcon />
            </Pressable>
          </View>
        </View>
        
        {/* Total Value */}
        <View style={styles.modalField}>
          <UrduText style={styles.fieldLabel}>کل {type}</UrduText>
          <Text style={styles.fieldValue}>{totalValue}</Text>
        </View>
        
        {/* Update Button */}
        <CustomButton
          text={'اپڈیٹ کریں'}
          viewStyle={styles.updateButton}
          onPress={handleUpdate}
          accessibilityLabel={i18n.t('update')}
          accessibilityHint={i18n.t('save_changes_and_close')}
        />
      </View>
    </Modal>
  );
}

/**
 * WorkforceItem Component
 * 
 * A reusable component for displaying workforce items with edit functionality
 */
const WorkforceItem = ({ label, value, onEdit, ...accessibilityProps }: WorkforceItemProps) => {
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
  const strengthRecords = useSelector(selectStrengthRecords);
  const strengthLoading = useSelector(selectStrengthLoading);
  const strengthError = useSelector(selectStrengthError);
  const strengthByGender = useSelector(selectStrengthByGender);
  const latestStrengthRecordsByType = useSelector(selectLatestStrengthRecordsByType);
  const totalStrengthValue = useSelector(selectTotalStrengthValue);
  
  // Fetch persons and contact types on component mount
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPersonsByUnit());
    }
    if (contactTypesStatus === 'idle') {
      dispatch(fetchContactTypes());
    }
  }, [dispatch, status, contactTypesStatus]);
  
  // Fetch strength data and log it
  useEffect(() => {
    // Fetch strength types and records
    dispatch(fetchStrengthTypes());
    dispatch(fetchStrengthRecords());
  }, [dispatch]);
  
  // Log strength data whenever it changes
  useEffect(() => {
    // Log strength types
    console.log('Strength Types:', JSON.stringify(strengthTypes, null, 2));
    
    // Log strength records
    console.log('Strength Records:', JSON.stringify(strengthRecords, null, 2));
    
    // Log strength by gender
    console.log('Strength By Gender:', JSON.stringify(strengthByGender, null, 2));
    
    // Log latest strength records by type
    console.log('Latest Strength Records By Type:', JSON.stringify(latestStrengthRecordsByType, null, 2));
    
    // Log total strength value
    console.log('Total Strength Value:', totalStrengthValue);
  }, [strengthTypes, strengthRecords, strengthByGender, latestStrengthRecordsByType, totalStrengthValue]);
  
  // Legacy state for modal functionality
  const [menKarkunan, setMenKarkunan] = useState(50);
  const [menMembers, setMenMembers] = useState(500);
  const [womenArkan, setWomenArkan] = useState(50);
  const [womenKarkunan, setWomenKarkunan] = useState(500);
  const [womenMembers, setWomenMembers] = useState(50);
  const [womenYouthMembers, setWomenYouthMembers] = useState(500);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    type: "",
    currentValue: 0,
    setValue: setMenKarkunan
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
    setValue: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setModalConfig({
      title,
      type,
      currentValue,
      setValue
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
          contentContainerStyle={[{ flexGrow: 1 }]} 
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
        />

        {/* Top Container with Stats */}
        <View style={styles.topContainer}>
          <View style={styles.quwatContainer}>
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
          </View>
          
          <Link href="/screens/Arkan" style={styles.arkanLink}>
            {i18n.t('view_list_of_arkan') || "View List of Arkan"}
          </Link>
        </View>

        {/* Bottom Container with Sections */}
        <View style={styles.bottomContainer}>
          {/* Men Section */}
          <UrduText style={styles.blueHeading}>مرد امیدواران کی تعداد</UrduText>
          
          <WorkforceItem 
            label="کارکنان کی تعداد"
            value={menKarkunan}
            onEdit={() => showModal('کارکنان کی تعداد', 'کارکنان', menKarkunan, setMenKarkunan)}
          />
          
          <WorkforceItem 
            label="ممبران کی تعداد"
            value={menMembers}
            onEdit={() => showModal('ممبران کی تعداد', 'ممبران', menMembers, setMenMembers)}
          />
          
          {/* Women Section */}
          <UrduText style={styles.blueHeading}>خواتین امیدواران کی تعداد</UrduText>
          
          <WorkforceItem 
            label="ارکان"
            value={womenArkan}
            onEdit={() => showModal('ارکان', 'ارکان', womenArkan, setWomenArkan)}
          />
          
          <WorkforceItem 
            label="کارکنان"
            value={womenKarkunan}
            onEdit={() => showModal('کارکنان', 'کارکنان', womenKarkunan, setWomenKarkunan)}
          />
          
          <WorkforceItem 
            label="ممبران"
            value={womenMembers}
            onEdit={() => showModal('ممبران', 'ممبران', womenMembers, setWomenMembers)}
          />
          
          <WorkforceItem 
            label="یوتھ ممبران"
            value={womenYouthMembers}
            onEdit={() => showModal('یوتھ ممبران', 'یوتھ ممبران', womenYouthMembers, setWomenYouthMembers)}
          />
        </View>
        
        {/* Debug indicator for strength data logging */}
        {strengthTypes.length > 0 && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Strength data logged to console ({strengthTypes.length} types, {strengthRecords.length} records)
            </Text>
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
    height: "28%",
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
    gap: SPACING.lg,
    marginBottom: SPACING.xs
  },
  quwatBox: {
    padding: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    width: "30%",
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
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
    padding: SPACING.lg
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
  
  // Modal styles
  modalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.medium
  },
  modalCloseIcon: {
    position: "absolute",
    left: 0,
    padding: SPACING.md,
    zIndex: Z_INDEX.modal
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontFamily: "JameelNooriNastaleeq",
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  modalField: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#E7E7E7",
    borderRadius: BORDER_RADIUS.xs,
    padding: SPACING.md,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFieldEdit: {
    flexDirection: "row",
    alignItems: 'center',
    width: "100%",
    backgroundColor: "#F7F7F7",
    borderRadius: BORDER_RADIUS.xs,
    padding: SPACING.md,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: "JameelNooriNastaleeq"
  },
  fieldValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: SPACING.sm,
  },
  counterValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginHorizontal: SPACING.sm,
    minWidth: 30,
    textAlign: 'center',
  },
  updateButton: {
    marginTop: SPACING.sm,
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
  // Debug styles
  debugContainer: {
    padding: 10,
    margin: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  }
});
