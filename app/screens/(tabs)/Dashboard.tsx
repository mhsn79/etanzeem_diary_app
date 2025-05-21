import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, StatusBar, useColorScheme, Pressable, ActivityIndicator, Modal, Dimensions } from 'react-native';
import i18n from '@/app/i18n';
import CustomDropdown from "@/app/components/CustomDropdown";
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import Spacer from '@/app/components/Spacer';
import SmallTarazu from "@/assets/images/small-tarazu.svg";
import LocationIcon from "@/assets/images/location-icon-yellow.svg";
import UserIcon from "@/assets/images/user-icon.svg";
import ReportIcon1 from "@/assets/images/report-icon-1.svg";
import LeftUpArrowWhite from "@/assets/images/left-up-arrow-white.svg";
import LeftUpArrowBlue from "@/assets/images/left-up-arrow-blue.svg";
import UrduText from '@/app/components/UrduText';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, TYPOGRAPHY } from '@/app/constants/theme';
import { AntDesign } from '@expo/vector-icons';
import Dialog from '@/app/components/Dialog';
import { 
  selectAllHierarchyUnits,
  selectUserUnitDetails, 
  selectUserUnitStatus, 
  selectUserUnitError,
  selectUserTanzeemiLevelDetails,
  selectUserTanzeemiLevelStatus
} from '@/app/features/tanzeem/tanzeemSlice';
import { selectNazimDetails } from '@/app/features/persons/personSlice';
import { 
  selectAllHierarchyUnits as selectAllCompleteHierarchyUnits,
  selectSubordinateUnits,
  selectParentUnits,
  selectUserUnit,
  selectHierarchyStatus,
  fetchCompleteTanzeemiHierarchy
} from '@/app/features/tanzeem/tanzeemHierarchySlice';
import { AppDispatch } from '@/app/store';
import { logout } from '@/app/features/auth/authSlice';
import { selectUserDetails } from '@/app/features/persons/personSlice';

// Helper function to convert hierarchyStatus to boolean for loading prop
const isLoading = (status: 'idle' | 'loading' | 'succeeded' | 'failed'): boolean => {
  return status === 'loading';
};

// Reusable components
const HeaderInfoItem = ({ 
  icon: Icon, 
  text, 
  onPress, 
  iconProps = {}, 
  textStyle = {}, 
  styles 
}: { 
  icon: React.FC<any>; 
  text: string; 
  onPress?: () => void; 
  iconProps?: any; 
  textStyle?: any;
  styles: any;
}) => {
  const isClickable = !!onPress;
  const Container = isClickable ? TouchableOpacity : View;
  const isLeftUpArrowWhite = Icon === LeftUpArrowWhite;
  
  return (
    <Container onPress={isClickable ? onPress : undefined}>
      <View style={styles.headerInfoItem}>
        {!isLeftUpArrowWhite && Icon && (
          <>
            <Icon {...iconProps} />
            <Spacer width={8} />
          </>
        )}
        <UrduText style={[styles.headerInfoText, textStyle]}>{text}</UrduText>
        {isLeftUpArrowWhite && (
          <>
            <Spacer width={8} />
            <Icon {...iconProps} />
          </>
        )}
        <Spacer height={10} width={isClickable ? "100%" : undefined} />
      </View>
    </Container>
  );
};

interface ScheduleItemProps {
  item: {
    eventName: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    type: string;
  };
  index: number;
  colorScheme: string | null | undefined;
  styles: any;
}

const ScheduleItem = ({ item, index, colorScheme, styles }: ScheduleItemProps) => {
  const textColor = { color: colorScheme === "dark" ? "white" : "black" };
  
  return (
    <TouchableOpacity key={index} onPress={() => console.log(item)}>
      <View style={styles.scheduleItemContainer}>
        <Text style={textColor}>{index + 1}</Text>
        <Text style={textColor}>{item.eventName}</Text>
        <Text style={textColor}>{item.startTime}</Text>
        <Text style={textColor}>{item.location}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface StatRowProps {
  label: string;
  value: string;
  styles: any;
}

const StatRow = ({ label, value, styles }: StatRowProps) => (
  <View style={styles.statRow}>
    <UrduText style={styles.boxContent}>{label}</UrduText>
    <UrduText style={styles.boxContent}>{value}</UrduText>
  </View>
);

interface DashboardBoxProps {
  title: string;
  stats: Array<{ label: string; value: string }>;
  onPress: () => void;
  isRtl: boolean;
  styles: any;
}

const DashboardBox = ({ title, stats, onPress, isRtl, styles }: DashboardBoxProps) => {
  return (
    <View style={styles.box}>
      <View style={styles.boxHeader}>
        <TouchableOpacity onPress={onPress}>
          <UrduText kasheedaStyle={true} style={styles.boxTitle}>{title}</UrduText>
        </TouchableOpacity>
        <LeftUpArrowBlue style={{ transform: [{ rotateY: isRtl ? "0deg" : "180deg" }] }} />
      </View>
      {stats.map((stat: { label: string; value: string }, index: number) => (
        <StatRow key={index} label={stat.label} value={stat.value} styles={styles} />
      ))}
    </View>
  );
};

// Unit Selection Modal Component
interface UnitSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  styles: any;
  isRtl: boolean;
}

interface Option {
  id: string;
  label: string;
  value: string;
}

const UnitSelectionModal = ({ visible, onClose, styles, isRtl }: UnitSelectionModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedUC, setSelectedUC] = useState<string | null>(null);
  
  // Options for dropdowns
  const [districtOptions, setDistrictOptions] = useState<Option[]>([]);
  const [zoneOptions, setZoneOptions] = useState<Option[]>([]);
  const [ucOptions, setUCOptions] = useState<Option[]>([]);
  
  // Redux selectors
  const completeHierarchyUnits = useSelector(selectAllCompleteHierarchyUnits);
  const subordinateUnits = useSelector(selectSubordinateUnits);
  const parentUnits = useSelector(selectParentUnits);
  const userHierarchyUnit = useSelector(selectUserUnit);
  const hierarchyStatus = useSelector(selectHierarchyStatus);
  const userDetails = useSelector(selectUserDetails);
  
  // Handle selection for each dropdown - improved implementation
  const handleDistrictSelection = (option: Option) => {
    try {
      console.log('Selected district:', option.value, option.label);
      
      // Only update if the selection has changed
      if (selectedDistrict !== option.value) {
        setSelectedDistrict(option.value);
        
        // Reset lower level selections
        setSelectedZone(null);
        setSelectedUC(null);
        
        // Find the selected district unit for reference
        const selectedUnit = completeHierarchyUnits.find(unit => unit.id.toString() === option.value);
        if (selectedUnit) {
          console.log('Selected district unit details:', {
            name: selectedUnit.Name || selectedUnit.name,
            level: selectedUnit.level,
            parent_id: selectedUnit.parent_id
          });
        }
      }
    } catch (error) {
      console.error('Error in handleDistrictSelection:', error);
    }
  };
  
  const handleZoneSelection = (option: Option) => {
    try {
      console.log('Selected zone:', option.value, option.label);
      
      // Only update if the selection has changed
      if (selectedZone !== option.value) {
        setSelectedZone(option.value);
        
        // Reset lower level selection
        setSelectedUC(null);
        
        // Find the selected zone unit for reference
        const selectedUnit = completeHierarchyUnits.find(unit => unit.id.toString() === option.value);
        if (selectedUnit) {
          console.log('Selected zone unit details:', {
            name: selectedUnit.Name || selectedUnit.name,
            level: selectedUnit.level,
            parent_id: selectedUnit.parent_id
          });
        }
      }
    } catch (error) {
      console.error('Error in handleZoneSelection:', error);
    }
  };
  
  const handleUCSelection = (option: Option) => {
    try {
      console.log('Selected UC:', option.value, option.label);
      
      // Only update if the selection has changed
      if (selectedUC !== option.value) {
        setSelectedUC(option.value);
        
        // Find the selected UC unit for reference
        const selectedUnit = completeHierarchyUnits.find(unit => unit.id.toString() === option.value);
        if (selectedUnit) {
          console.log('Selected UC unit details:', {
            name: selectedUnit.Name || selectedUnit.name,
            level: selectedUnit.level,
            parent_id: selectedUnit.parent_id
          });
        }
      }
    } catch (error) {
      console.error('Error in handleUCSelection:', error);
    }
  };
  
  // Helper function to check for self-referencing units (parent_id === id)
  const removeSelfReferencingUnits = useCallback((units: any[]) => {
    return units.filter(unit => unit.id !== unit.parent_id);
  }, []);
  
  // Helper function to get the label of a selected option
  const getSelectedLabel = useCallback((options: Option[], selectedValue: string | null): string => {
    if (!selectedValue) return '';
    const selectedOption = options.find(opt => opt.value === selectedValue);
    return selectedOption?.label || '';
  }, []);

  // Fetch complete hierarchy when modal opens
  useEffect(() => {
    if (visible) {
      const userEmail = userDetails?.email || '';
      console.log('Fetching complete hierarchy for user:', userEmail);
      
      // Dispatch the action to fetch the complete hierarchy
      dispatch(fetchCompleteTanzeemiHierarchy(userEmail))
        .unwrap()
        .then((result: { hierarchyUnits: any[]; hierarchyIds: number[]; userUnitId: number }) => {
          console.log('Complete hierarchy fetch succeeded:', result);
        })
        .catch((error: unknown) => {
          console.error('Complete hierarchy fetch failed:', error);
          
          // Check if the error is an authentication error
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('Authentication expired')) {
            console.log('Authentication expired, redirecting to login...');
            dispatch(logout())
              .then(() => {
                router.replace('/screens/LoginScreen');
              })
              .catch((err) => {
                console.error('Error during logout:', err);
                router.replace('/screens/LoginScreen');
              });
          }
        });
    }
  }, [visible, dispatch, userDetails]);
  
  // Process hierarchy data when it changes - improved implementation
  useEffect(() => {
    if (hierarchyStatus === 'succeeded' && completeHierarchyUnits.length > 0) {
      console.log('Complete hierarchy units:', completeHierarchyUnits);
      
      try {
        // Find the district (level 1)
        const districts = completeHierarchyUnits.filter(unit => unit.level === 1);
        console.log('Districts found:', districts.length);
        
        // If no districts found, try to find the highest level units
        if (districts.length === 0) {
          // Get all unique levels
          const levels = [...new Set(completeHierarchyUnits.map(unit => unit.level))].sort();
          
          if (levels.length > 0) {
            // Use the highest level as districts
            const highestLevel = levels[0];
            const highestLevelUnits = completeHierarchyUnits.filter(unit => unit.level === highestLevel);
            
            if (highestLevelUnits.length > 0) {
              console.log(`No districts found, using level ${highestLevel} units as districts:`, highestLevelUnits.length);
              
              const districtOpts = highestLevelUnits.map(unit => ({
                id: `district-${unit.id}`,
                label: unit.Name || unit.name || `Level ${highestLevel} Unit`,
                value: unit.id.toString()
              }));
              
              setDistrictOptions(districtOpts);
              
              // Auto-select if there's only one option and none is selected yet
              if (districtOpts.length === 1 && !selectedDistrict) {
                console.log('Auto-selecting the only district:', districtOpts[0].label);
                setSelectedDistrict(districtOpts[0].value);
              }
            } else {
              // Fallback to parent_id if no units at any level
              if (completeHierarchyUnits[0]?.parent_id) {
                const districtOpts = [{
                  id: `district-${completeHierarchyUnits[0].parent_id}`,
                  label: 'Parent Unit',
                  value: completeHierarchyUnits[0].parent_id.toString()
                }];
                setDistrictOptions(districtOpts);
                setSelectedDistrict(districtOpts[0].value);
              } else {
                // Last resort - create a dummy option
                console.warn('No suitable district units found');
                setDistrictOptions([]);
              }
            }
          }
        } else {
          // Normal case - we have district level units
          const districtOpts = districts.map(unit => ({
            id: `district-${unit.id}`,
            label: unit.Name || unit.name || 'Unknown District',
            value: unit.id.toString()
          }));
          
          setDistrictOptions(districtOpts);
          
          // Auto-select if there's only one district option and none is selected yet
          if (districtOpts.length === 1 && !selectedDistrict) {
            console.log('Auto-selecting the only district:', districtOpts[0].label);
            setSelectedDistrict(districtOpts[0].value);
          }
        }
        
        // Find zones (level 2) and remove any self-referencing units
        const zones = removeSelfReferencingUnits(
          completeHierarchyUnits.filter(unit => unit.level === 2)
        );
        console.log('Zones found:', zones.length);
        
        // Map zones to dropdown options
        const zoneOpts = zones.map(unit => ({
          id: `zone-${unit.id}`,
          label: unit.Name || unit.name || 'Unknown Zone',
          value: unit.id.toString()
        }));
        
        setZoneOptions(zoneOpts);
        
        // Auto-select if there's only one zone and none is selected yet
        if (zoneOpts.length === 1 && !selectedZone) {
          console.log('Auto-selecting the only zone:', zoneOpts[0].label);
          setSelectedZone(zoneOpts[0].value);
        }
        
        // Find circles/UCs (level 3 and 4) and remove any self-referencing units
        const circles = removeSelfReferencingUnits(
          completeHierarchyUnits.filter(unit => unit.level === 3)
        );
        const ucs = removeSelfReferencingUnits(
          completeHierarchyUnits.filter(unit => unit.level === 4)
        );
        
        console.log('Circles found:', circles.length);
        console.log('UCs found:', ucs.length);
        
        // Combine circles and UCs for the third dropdown
        const ucOpts = [...circles, ...ucs].map(unit => ({
          id: `uc-${unit.id}`,
          label: unit.Name || unit.name || 'Unknown UC',
          value: unit.id.toString()
        }));
        
        setUCOptions(ucOpts);
        
        // Auto-select if there's only one UC, a zone is selected, and no UC is selected yet
        if (selectedZone && ucOpts.length === 1 && !selectedUC) {
          console.log('Auto-selecting the only UC:', ucOpts[0].label);
          setSelectedUC(ucOpts[0].value);
        }
      } catch (error) {
        console.error('Error processing hierarchy data:', error);
      }
    }
  }, [hierarchyStatus, completeHierarchyUnits, selectedZone, selectedDistrict, selectedUC, removeSelfReferencingUnits]);
  
  // Update filtered options when selections change - improved implementation
  useEffect(() => {
    if (hierarchyStatus === 'succeeded' && completeHierarchyUnits.length > 0) {
      try {
        // If district is selected, filter zones by parent_id
        if (selectedDistrict) {
          console.log('Filtering zones for district ID:', selectedDistrict);
          
          // Filter zones and remove any self-referencing units
          const filteredZones = removeSelfReferencingUnits(
            completeHierarchyUnits.filter(unit => {
              // Check if parent_id matches selected district
              const parentId = unit.parent_id?.toString();
              const isLevel2 = unit.level === 2;
              const isParentMatch = parentId === selectedDistrict;
              
              if (isLevel2 && isParentMatch) {
                return true;
              }
              
              // If no direct matches, check if this unit is in the hierarchy of the selected district
              if (isLevel2 && unit.zaili_unit_hierarchy && Array.isArray(unit.zaili_unit_hierarchy)) {
                return unit.zaili_unit_hierarchy.some(id => id.toString() === selectedDistrict);
              }
              
              return false;
            })
          );
          
          console.log('Filtered zones:', filteredZones.length);
          
          if (filteredZones.length > 0) {
            const zoneOpts = filteredZones.map(unit => ({
              id: `zone-${unit.id}`,
              label: unit.Name || unit.name || 'Unknown Zone',
              value: unit.id.toString()
            }));
            
            setZoneOptions(zoneOpts);
            
            // Auto-select if there's only one zone and none is selected yet
            if (zoneOpts.length === 1 && !selectedZone) {
              console.log('Auto-selecting the only zone (filtered):', zoneOpts[0].label);
              setSelectedZone(zoneOpts[0].value);
            } else if (zoneOpts.length === 0) {
              // Reset zone selection if no zones found
              setSelectedZone(null);
            } else if (selectedZone && !zoneOpts.some(opt => opt.value === selectedZone)) {
              // If current selection is not in the new options, reset it
              setSelectedZone(null);
            }
          } else {
            // If no zones found, try to find any level 2 units
            const allLevel2Units = removeSelfReferencingUnits(
              completeHierarchyUnits.filter(unit => unit.level === 2)
            );
            
            if (allLevel2Units.length > 0) {
              const zoneOpts = allLevel2Units.map(unit => ({
                id: `zone-${unit.id}`,
                label: unit.Name || unit.name || 'Unknown Zone',
                value: unit.id.toString()
              }));
              
              setZoneOptions(zoneOpts);
              
              // Don't auto-select in this case as the relationship is uncertain
              if (selectedZone && !zoneOpts.some(opt => opt.value === selectedZone)) {
                setSelectedZone(null);
              }
            } else {
              // No zones at all
              setZoneOptions([]);
              setSelectedZone(null);
            }
          }
        } else {
          // No district selected, reset zone options to all level 2 units
          const allZones = removeSelfReferencingUnits(
            completeHierarchyUnits.filter(unit => unit.level === 2)
          );
          
          const zoneOpts = allZones.map(unit => ({
            id: `zone-${unit.id}`,
            label: unit.Name || unit.name || 'Unknown Zone',
            value: unit.id.toString()
          }));
          
          setZoneOptions(zoneOpts);
          setSelectedZone(null);
        }
        
        // If zone is selected, filter UCs by parent_id
        if (selectedZone) {
          console.log('Filtering UCs for zone ID:', selectedZone);
          
          // Filter UCs and remove any self-referencing units
          const filteredUCs = removeSelfReferencingUnits(
            completeHierarchyUnits.filter(unit => {
              // Check if parent_id matches selected zone
              const parentId = unit.parent_id?.toString();
              const isLevel3or4 = unit.level === 3 || unit.level === 4;
              const isParentMatch = parentId === selectedZone;
              
              if (isLevel3or4 && isParentMatch) {
                return true;
              }
              
              // If no direct matches, check if this unit is in the hierarchy of the selected zone
              if (isLevel3or4 && unit.zaili_unit_hierarchy && Array.isArray(unit.zaili_unit_hierarchy)) {
                return unit.zaili_unit_hierarchy.some(id => id.toString() === selectedZone);
              }
              
              return false;
            })
          );
          
          console.log('Filtered UCs:', filteredUCs.length);
          
          if (filteredUCs.length > 0) {
            const ucOpts = filteredUCs.map(unit => ({
              id: `uc-${unit.id}`,
              label: unit.Name || unit.name || 'Unknown UC',
              value: unit.id.toString()
            }));
            
            setUCOptions(ucOpts);
            
            // Auto-select if there's only one UC and none is selected yet
            if (ucOpts.length === 1 && !selectedUC) {
              console.log('Auto-selecting the only UC (filtered):', ucOpts[0].label);
              setSelectedUC(ucOpts[0].value);
            } else if (ucOpts.length === 0) {
              // Reset UC selection if no UCs found
              setSelectedUC(null);
            } else if (selectedUC && !ucOpts.some(opt => opt.value === selectedUC)) {
              // If current selection is not in the new options, reset it
              setSelectedUC(null);
            }
          } else {
            // If no UCs found, try to find any level 3 or 4 units
            const allUCUnits = removeSelfReferencingUnits(
              completeHierarchyUnits.filter(unit => unit.level === 3 || unit.level === 4)
            );
            
            if (allUCUnits.length > 0) {
              const ucOpts = allUCUnits.map(unit => ({
                id: `uc-${unit.id}`,
                label: unit.Name || unit.name || 'Unknown UC',
                value: unit.id.toString()
              }));
              
              setUCOptions(ucOpts);
              
              // Don't auto-select in this case as the relationship is uncertain
              if (selectedUC && !ucOpts.some(opt => opt.value === selectedUC)) {
                setSelectedUC(null);
              }
            } else {
              // No UCs at all
              setUCOptions([]);
              setSelectedUC(null);
            }
          }
        } else {
          // No zone selected, reset UC options
          setUCOptions([]);
          setSelectedUC(null);
        }
      } catch (error) {
        console.error('Error updating filtered options:', error);
      }
    }
  }, [selectedDistrict, selectedZone, hierarchyStatus, completeHierarchyUnits, removeSelfReferencingUnits]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <UrduText style={styles.modalTitle}>{i18n.t('unit_selection')}</UrduText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <AntDesign name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {/* Parent Units Section */}
              <View style={styles.sectionContainer}>
                <UrduText style={styles.sectionTitle}>{i18n.t('parent_units')}</UrduText>
                
                {hierarchyStatus === 'loading' ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : parentUnits.length > 0 ? (
                  parentUnits.map((unit, index) => (
                    <View key={`parent-${unit.id}`} style={styles.parentUnitItem}>
                      <UrduText style={styles.parentUnitText}>
                        {unit.Name || unit.name} ({i18n.t('level')} {unit.level})
                      </UrduText>
                    </View>
                  ))
                ) : (
                  <UrduText style={styles.noDataText}>{i18n.t('no_parent_units')}</UrduText>
                )}
              </View>
              
              <Spacer height={20} />
              
              {/* Subordinate Units Section */}
              <View style={styles.sectionContainer}>
                <UrduText style={styles.sectionTitle}>{i18n.t('subordinate_units')}</UrduText>
                
                {hierarchyStatus === 'loading' ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : (
                  <>
                    {/* District Dropdown */}
                    <CustomDropdown
                      options={districtOptions}
                      onSelect={handleDistrictSelection}
                      viewStyle={styles.modalDropdown}
                      dropdownContainerStyle={styles.modalDropdownContainer}
                      textStyle={styles.modalDropdownText}
                      placeholder={selectedDistrict ? getSelectedLabel(districtOptions, selectedDistrict) : i18n.t('select_district')}
                      selectedValue={selectedDistrict || undefined}
                      loading={isLoading(hierarchyStatus)}
                      disabled={districtOptions.length <= 1} // Disable if there's only one option
                    />
                    
                    <Spacer height={10} />
                    
                    {/* Zone Dropdown */}
                    <CustomDropdown
                      options={zoneOptions}
                      onSelect={handleZoneSelection}
                      viewStyle={styles.modalDropdown}
                      textStyle={styles.modalDropdownText}
                      dropdownContainerStyle={styles.modalDropdownContainer}
                      placeholder={selectedZone ? getSelectedLabel(zoneOptions, selectedZone) : i18n.t('select_zone')}
                      selectedValue={selectedZone || undefined}
                      loading={isLoading(hierarchyStatus) || !selectedDistrict}
                      disabled={zoneOptions.length <= 1 || !selectedDistrict} // Disable if there's only one option or no district selected
                    />
                    
                    <Spacer height={10} />
                    
                    {/* UC Dropdown */}
                    <CustomDropdown
                      options={ucOptions}
                      onSelect={handleUCSelection}
                      viewStyle={styles.modalDropdown}
                      textStyle={styles.modalDropdownText}
                      dropdownContainerStyle={styles.modalDropdownContainer}
                      placeholder={selectedUC ? getSelectedLabel(ucOptions, selectedUC) : i18n.t('select_uc')}
                      selectedValue={selectedUC || undefined}
                      loading={isLoading(hierarchyStatus)}
                      disabled={ucOptions.length <= 1 || !selectedZone} // Disable if there's only one option or no zone selected
                    />
                  </>
                )}
              </View>
              
              <Spacer height={20} />
              
              {/* Selected Unit Details Section */}
              {selectedUC && (
                <View style={styles.sectionContainer}>
                  <UrduText style={styles.sectionTitle}>{i18n.t('unit_details')}</UrduText>
                  
                  <View style={styles.unitDetailsContainer}>
                    <View style={styles.unitDetailRow}>
                      <UrduText style={styles.unitDetailLabel}>{i18n.t('members')}</UrduText>
                      <UrduText style={styles.unitDetailValue}>50</UrduText>
                    </View>
                    <View style={styles.unitDetailRow}>
                      <UrduText style={styles.unitDetailLabel}>{i18n.t('voters')}</UrduText>
                      <UrduText style={styles.unitDetailValue}>5000</UrduText>
                    </View>
                    <View style={styles.unitDetailRow}>
                      <UrduText style={styles.unitDetailLabel}>{i18n.t('wards')}</UrduText>
                      <UrduText style={styles.unitDetailValue}>4</UrduText>
                    </View>
                    <View style={styles.unitDetailRow}>
                      <UrduText style={styles.unitDetailLabel}>{i18n.t('block_codes')}</UrduText>
                      <UrduText style={styles.unitDetailValue}>10</UrduText>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
            
            {/* Close Button */}
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <UrduText style={styles.modalCloseButtonText}>{i18n.t('close')}</UrduText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const Dashboard = () => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const isRtl = i18n.locale === 'ur';
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state selectors
  const userUnit = useSelector(selectUserUnitDetails);
  const userUnitStatus = useSelector(selectUserUnitStatus);
  const userUnitError = useSelector(selectUserUnitError);
  const userTanzeemLevel = useSelector(selectUserTanzeemiLevelDetails);
  const userTanzeemLevelStatus = useSelector(selectUserTanzeemiLevelStatus);
  const hierarchyUnits = useSelector(selectAllHierarchyUnits);
  const nazimDetaiils = useSelector(selectNazimDetails);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.locale);
  const [direction, setDirection] = useState(isRtl ? 'rtl' : 'ltr');
  const [showDialog, setShowDialog] = useState(false);
  
  // Unit selection modal state
  const [showUnitSelectionModal, setShowUnitSelectionModal] = useState(false);
  
  // Open unit selection modal
  const handleOpenUnitSelectionModal = () => {
    setShowUnitSelectionModal(true);
  };
  
  // Close unit selection modal
  const handleCloseUnitSelectionModal = () => {
    setShowUnitSelectionModal(false);
  };
 
  // Log when user unit data changes
  useEffect(() => {
    console.log('Dashboard: User unit status:', userUnitStatus);
    if (userUnitStatus === 'succeeded') {
      console.log('Dashboard: User unit details:', userUnit);
    } else if (userUnitStatus === 'failed') {
      console.error('Dashboard: Error fetching user unit:', userUnitError);
    }
  }, [userUnitStatus, userUnit, userUnitError]);
  
  // Log when tanzeemi level data changes
  useEffect(() => {
    console.log('Dashboard: User tanzeemi level status:', userTanzeemLevelStatus);
    if (userTanzeemLevelStatus === 'succeeded') {
      console.log('Dashboard: User tanzeemi level details:', userTanzeemLevel);
    }
  }, [userTanzeemLevelStatus, userTanzeemLevel]);
  
  // Log when hierarchy units data changes
  useEffect(() => {
    console.log('Dashboard component loaded hierarchyUnits', hierarchyUnits);
  }, [hierarchyUnits]);

  // Mock data
  const scheduleForToday = [
    { "eventName": "Event 1", "startTime": "10:00 AM", "endTime": "12:00 PM", "location": "Room 101", "description": "Description for Event 1", "type": "type-1" },
    { "eventName": "Event 2", "startTime": "2:00 PM", "endTime": "4:00 PM", "location": "Room 102", "description": "Description for Event 2", "type": "type-2" },
    { "eventName": "Event 3", "startTime": "5:00 PM", "endTime": "7:00 PM", "location": "Room 103", "description": "Description for Event 3", "type": "type-3" },
    { "eventName": "Event 4", "startTime": "8:00 PM", "endTime": "10:00 PM", "location": "Room 104", "description": "Description for Event 4", "type": "type-4" },
    { "eventName": "Event 5", "startTime": "11:00 PM", "endTime": "1:00 AM", "location": "Room 105", "description": "Description for Event 5", "type": "type-5" }
  ];

  const durationItemNames = [
    { id: '1', label: i18n.t('last_2_weeks'), value: 'last_2_weeks' },
    { id: '2', label: i18n.t('last_4_weeks'), value: 'last_4_weeks' },
    { id: '3', label: i18n.t('this_month'), value: 'this_month' },
    { id: '4', label: i18n.t('last_month'), value: 'last_month' },
    { id: '5', label: i18n.t('last_3_months'), value: 'last_3_months' },
    { id: '6', label: i18n.t('last_6_months'), value: 'last_6_months' },
    { id: '7', label: i18n.t('this_year'), value: 'this_year' },
    { id: '8', label: i18n.t('last_year'), value: 'last_year' },
    { id: '9', label: i18n.t('last_2_years'), value: 'last_2_years' },
  ];

  // Dashboard boxes data
  const dashboardBoxes = [
    {
      title: i18n.t('workforce'),
      onPress: () => router.push("/screens/Workforce"),
      stats: [
        { label: i18n.t('arkan'), value: '50' },
        { label: i18n.t('increase'), value: '5' },
        { label: i18n.t('target'), value: '10' }
      ]
    },
    {
      title: i18n.t('sub_units'),
      onPress: handleOpenUnitSelectionModal, // Open modal instead of navigating
      stats: [
        { label: i18n.t('wards'), value: '5' },
        { label: '-', value: '-' },
        { label: '-', value: '-' }
      ]
    },
    {
      title: i18n.t('activities'),
      onPress: () => router.push("/screens/Activities"),
      stats: [
        { label: i18n.t('organizational'), value: '1' },
        { label: i18n.t('invitational'), value: '1' },
        { label: i18n.t('training'), value: '1' }
      ]
    },
    {
      title: i18n.t('upper_management'),
      onPress: handleOpenUnitSelectionModal, // Open modal instead of navigating
      stats: [
        { label: i18n.t('activities'), value: '1' },
        { label: i18n.t('participation'), value: '1' },
        { label: '-', value: '-' }
      ]
    },
    {
      title: i18n.t('visits'),
      onPress: () => router.push("/screens/Meetings"),
      stats: [
        { label: '-', value: i18n.t('meetings') },
        { label: '-', value: '-' },
        { label: '-', value: '-' }
      ]
    },
    {
      title: i18n.t('money'),
      onPress: () => router.push("/screens/Income"),
      stats: [
        { label: '0', value: i18n.t('income') },
        { label: '0', value: i18n.t('expenses') },
        { label: '-', value: '-' }
      ]
    }
  ];

  // Format the date as "February 23, 2025"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleAddNew = () => setShowDialog(true);
  const handleMeetingSchedule = () => {
    setShowDialog(false);
    router.push('/screens/MeetingScreen');
  };
  const handleActivitySchedule = () => {
    setShowDialog(false);
    router.push('/screens/ActivityScreen');
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['left', 'right', 'bottom']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
        translucent={Platform.OS === 'android'}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      
      <View style={[styles.mainContainer, { direction: isRtl ? 'rtl' : 'ltr' }]}>
        {/* Header section */}
        <View style={styles.headerContainer}>
          {/* Logo and info section */}
          <View style={styles.headerContent}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
            />
            <View style={styles.headerInfoContainer}>
              <HeaderInfoItem 
                text={userUnit?.Name||''} 
                icon={LeftUpArrowWhite} 
                iconProps={{ style: styles.headerIcon }} 
                textStyle={styles.headerTitle}
                onPress={handleOpenUnitSelectionModal} // Open modal instead of navigating
                styles={styles}
              />
              <HeaderInfoItem 
                text={(() => {
                  // Skip the first unit and get all remaining unit names in Urdu format
                  const unitNames = hierarchyUnits && hierarchyUnits.length > 1 
                    ? hierarchyUnits.slice(1).map(unit => unit.Name || unit.name).filter(Boolean)
                    : [];
                  
                  // Join with Urdu comma separator
                  const joinedNames = unitNames.join('، ');
                  
                  // If the text is too long, truncate it
                  return joinedNames.length > 0 
                    ? (joinedNames.length > 30 
                        ? joinedNames.substring(0, 27) + '...' 
                        : joinedNames)
                    : i18n.t('zone');
                })()} 
                icon={LocationIcon} 
                iconProps={{ style: styles.locationIcon }} 
                styles={styles}
              />
              <HeaderInfoItem 
                text={nazimDetaiils?.Name||''} 
                icon={UserIcon} 
                iconProps={{ style: styles.userIcon }} 
                onPress={() => router.push("/screens/ProfileView")}
                styles={styles}
              />
            </View>
          </View>
          
          {/* Schedule section */}
          <View style={styles.scheduleContainer}>
            <View style={styles.scheduleCard}>
              {/* Schedule Header */}
              <View style={styles.scheduleHeader}>
                <UrduText style={styles.scheduleText}>{i18n.t("schedule_for_today")}</UrduText>
                <TouchableOpacity onPress={() => router.push("/screens/Activities")}>
                  <UrduText style={styles.scheduleText}>{i18n.t('view-all')}</UrduText>
                </TouchableOpacity>
                <UrduText style={styles.scheduleText}>{formattedDate}</UrduText>
              </View>
              
              {/* Schedule List */}
              <ScrollView>
                {scheduleForToday.map((item, index) => (
                  <ScheduleItem 
                    key={index} 
                    item={item} 
                    index={index} 
                    colorScheme={colorScheme} 
                    styles={styles}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Dashboard content */}
        <View style={styles.dashboardContent}>
          {/* Duration dropdown and report button */}
          <View style={styles.reportSection}>
            <View style={styles.dropdownContainer}>
              <CustomDropdown
                viewStyle={styles.dropdown}
                options={durationItemNames}
                onSelect={console.log}
                placeholder={i18n.t('select_duration')}
                textStyle={styles.dropdownText}
              />
            </View>
            <TouchableOpacity 
              style={styles.reportButton} 
              onPress={() => router.push("/screens/ReportsManagementScreen")}
            >
              <ReportIcon1 style={styles.reportIcon} />
              <UrduText style={styles.reportButtonText}>{i18n.t('generate_report')}</UrduText>
            </TouchableOpacity>
          </View>

          {/* Dashboard boxes */}
          <ScrollView contentContainerStyle={styles.boxesContainer}>  
                {/* First row */}
                <View style={styles.boxRow}>
                  <DashboardBox {...dashboardBoxes[0]} isRtl={isRtl} styles={styles} />
                  <DashboardBox {...dashboardBoxes[1]} isRtl={isRtl} styles={styles} />
                </View>
                
                {/* Second row */}
                <View style={styles.boxRow}>
                  <DashboardBox {...dashboardBoxes[2]} isRtl={isRtl} styles={styles} />
                  <DashboardBox {...dashboardBoxes[3]} isRtl={isRtl} styles={styles} />
                </View>
                
                {/* Third row */}
                <View style={styles.boxRow}>
                  <DashboardBox {...dashboardBoxes[4]} isRtl={isRtl} styles={styles} />
                  <DashboardBox {...dashboardBoxes[5]} isRtl={isRtl} styles={styles} />
                </View>
          </ScrollView>
        </View>
      </View>

      {/* Floating Action Button */}
      <Pressable
        style={[styles.overlayButton, { bottom: insets.bottom + SPACING.xl, right: SPACING.xl }]}
        onPress={handleAddNew}
      >
        <AntDesign name="plus" size={24} color={COLORS.white} />
      </Pressable>

      {/* Schedule Dialog */}
      <Dialog
        visible={showDialog}
        onConfirm={handleMeetingSchedule}
        onCancel={handleActivitySchedule}
        onClose={() => setShowDialog(false)}
        title="کسی ایک آپشن کا انتخاب کریں."
        titleStyle={styles.titleStyle}
        confirmText="ملاقات شیڈول کریں"
        cancelText="سرگرمی شیڈول کریں"
        showWarningIcon={false}
        showSuccessIcon={false}
        lowerRightIcon={true}
        upperRightIcon={true}
        confirmButtonStyle={styles.confirmButtonStyle}
        cancelButtonStyle={styles.cancelButtonStyle}
        confirmTextStyle={styles.confirmTextStyle}
        cancelTextStyle={styles.cancelTextStyle}
      />
      
      {/* Unit Selection Modal */}
      <UnitSelectionModal 
        visible={showUnitSelectionModal} 
        onClose={handleCloseUnitSelectionModal} 
        styles={styles} 
        isRtl={isRtl} 
      />
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles with theme support
const getStyles = (colorScheme: string | null | undefined) => {
  const isDark = colorScheme === 'dark';
  
  return StyleSheet.create({
    safeAreaContainer: {
      flex: 1,
      backgroundColor: isDark ? "#23242D" : "#EBEBEB",
    },
    container: {
      flex: 1,
    },
    mainContainer: {
      backgroundColor: isDark ? "#23242D" : "#EBEBEB",
    },
    headerContainer: {
      paddingTop: 0,
      height: 200,
      alignItems: 'center',
      borderBottomStartRadius: 20,
      borderBottomEndRadius: 20,
      backgroundColor: isDark ? '#23242D' : '#008cff',
    },
    headerContent: {
      padding: 5,
      marginTop: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    headerInfoContainer: {
      flex: 1,
    },
    headerInfoItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerInfoText: {
      color: "white",
      fontSize: 18,
    },
    headerTitle: {
      color: "white",
      fontSize: 24,
      marginHorizontal: 10,
    },
    headerIcon: {
      width: 17,
      height: 17,
    },
    locationIcon: {
      width: 13,
      height: 16,
      marginHorizontal: 10,
    },
    userIcon: {
      width: 14,
      height: 15,
      marginHorizontal: 10,
    },
    logo: {
      width: 85,
      height: 85,
      resizeMode: 'contain',
    },
    scheduleContainer: {
      position: "absolute",
      padding: 5,
      marginTop: 130,
      width: "100%",
    },
    scheduleCard: {
      backgroundColor: isDark ? "#008cff" : "#FFFFFF",
      height: 100,
      borderRadius: 15,
      width: "100%",
      padding: 5,
    },
    scheduleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
    },
    scheduleText: {
      color: isDark ? "white" : "black",
    },
    scheduleItemContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
    },
    dashboardContent: {
      margin: 15,
      marginTop: 40,
      borderRadius: 10,
      backgroundColor: isDark ? "#373842" : 'transparent',
      padding: 10,
    },
    reportSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: "center",
      width: "100%",
    },
    dropdownContainer: {
      width: 150,
    },
    dropdown: {
      backgroundColor: "transparent",
      height: 48,
    },
    dropdownText: {
      color: isDark ? "#FFB30F" : "#0BA241",
      lineHeight: 28,
      includeFontPadding: false,
      textAlignVertical: 'center',
      padding: 0,
    },
    reportButton: {
      backgroundColor: '#1E90FF',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      height: 48,
      paddingHorizontal: 15,
    },
    reportIcon: {
      width: 20,
      height: 20,
      marginStart: 10,
    },
    reportButtonText: {
      color: '#fff',
      fontSize: 16,
      lineHeight: 20,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    boxesContainer: {
      flexGrow: 1,
      paddingTop: 0,
    },
    boxRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    box: {
      backgroundColor: isDark ? '#23242D' : "#FFFFFF",
      width: '48%',
      borderRadius: 10,
      padding: 15,
    },
    boxHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    boxTitle: {
      color: isDark ? '#fff' : '#1E90FF',
      fontWeight: 'regular',
      fontSize: 16,
      marginBottom: 5,
    },
    boxContent: {
      color: isDark ? '#575862' : '#000',
      fontSize: 14,
    },
    statRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    overlayButton: {
      position: 'absolute',
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: COLORS.tertiary,
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOWS.medium,
    },
    titleStyle: {
      textAlign: 'left',
      color: isDark ? undefined : COLORS.black,
      fontSize: isDark ? undefined : TYPOGRAPHY.fontSize.lg,
      lineHeight: isDark ? undefined : TYPOGRAPHY.lineHeight.xl,
      fontFamily: isDark ? undefined : TYPOGRAPHY.fontFamily.bold,
    },
    confirmButtonStyle: {
      backgroundColor: COLORS.primary,
      width: '100%',
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
    cancelButtonStyle: {
      width: '100%',
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderStyle: 'dashed',
    },
    confirmTextStyle: {
      color: COLORS.white,
    },
    cancelTextStyle: {
      color: COLORS.black,
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    modalContent: {
      backgroundColor: isDark ? '#23242D' : COLORS.white,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      width: '90%',
      maxHeight: '80%',
      ...SHADOWS.medium,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#373842' : '#EBEBEB',
      paddingBottom: SPACING.sm,
    },
    modalTitle: {
      color: isDark ? COLORS.white : COLORS.primary,
      fontSize: 24,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: SPACING.xs,
    },
    modalScrollView: {
      maxHeight: '70%',
    },
    sectionContainer: {
      marginBottom: SPACING.md,
    },
    sectionTitle: {
      color: isDark ? COLORS.white : COLORS.primary,
      fontSize: 20,
      marginBottom: SPACING.sm,
    },
    parentUnitItem: {
      backgroundColor: isDark ? '#373842' : '#F5F5F5',
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      marginBottom: SPACING.xs,
    },
    parentUnitText: {
      color: isDark ? COLORS.white : COLORS.black,
      fontSize: 16,
    },
    noDataText: {
      color: isDark ? '#575862' : '#666',
      fontSize: 16,
      fontStyle: 'italic',
      textAlign: 'center',
      padding: SPACING.md,
    },
    modalDropdown: {
      backgroundColor: isDark ? '#373842' : COLORS.white,
      borderWidth: 1,
      borderColor: isDark ? '#575862' : '#EBEBEB',
      borderRadius: BORDER_RADIUS.sm,
      height: 50,
    },
    modalDropdownContainer: {
      width: '100%',
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: isDark ? '#373842' : COLORS.white,
    },
    modalDropdownText: {
      color: isDark ? COLORS.white : COLORS.black,
      fontSize: 16,
      fontFamily: "JameelNooriNastaleeq",
    },
    unitDetailsContainer: {
      backgroundColor: isDark ? '#373842' : '#F5F5F5',
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.sm,
    },
    unitDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING.xs,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#23242D' : '#EBEBEB',
    },
    unitDetailLabel: {
      color: isDark ? COLORS.white : COLORS.black,
      fontSize: 16,
    },
    unitDetailValue: {
      color: isDark ? COLORS.primary : COLORS.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    modalCloseButton: {
      backgroundColor: COLORS.primary,
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      alignItems: 'center',
      marginTop: SPACING.md,
    },
    modalCloseButtonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
};

export default Dashboard;
