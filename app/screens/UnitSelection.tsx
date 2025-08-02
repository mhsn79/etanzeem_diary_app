import React, { useEffect, useState, useCallback } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ScrollView, View, StatusBar, Text, TouchableOpacity, Alert } from 'react-native';
import i18n from '../i18n';
import CustomDropdown from '../components/CustomDropdown';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
// import CustomTabbar from '../components/CustomTabbar';
import Spacer from '../components/Spacer';
import UrduText from '../components/UrduText';
import { COLORS, SPACING } from '../constants/theme';
import { 
  selectAllHierarchyUnits as selectAllCompleteHierarchyUnits,
  selectSubordinateUnits,
  selectParentUnits,
  selectUserUnit,
  selectHierarchyStatus
} from '@/app/features/tanzeem/tanzeemHierarchySlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { logout } from '@/app/features/auth/authSlice';
import { selectUserDetails } from '../features/persons/personSlice';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { useAuthErrorHandler } from '../utils/useAuthErrorHandler';
interface Option {
  id: string;
  label: string;
  value: string;
}

export default function UnitSelection() {
  const dispatch = useAppDispatch();

  // Helper function to format unit name with description
  const formatUnitName = (unit: any) => {
    const name = unit.Name || unit.name || '';
    const description = unit.Description || unit.description || '';
    
    // If description exists and is different from name, append it
    if (description && description !== name) {
      return `${name} (${description})`;
    }
    
    return name;
  };

  // State for dropdown options and selections
  const [districtOptions, setDistrictOptions] = useState<Option[]>([]);
  const [zoneOptions, setZoneOptions] = useState<Option[]>([]);
  const [ucOptions, setUCOptions] = useState<Option[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedUC, setSelectedUC] = useState<string | null>(null);
  
  // Handle selection for each dropdown
  const handleDistrictSelection = (option: Option) => {
    console.log('Selected district:', option.value);
    setSelectedDistrict(option.value);
    setSelectedZone(null); // Reset lower level selections
    setSelectedUC(null);
  };
  
  const handleZoneSelection = (option: Option) => {
    console.log('Selected zone:', option.value);
    setSelectedZone(option.value);
    setSelectedUC(null); // Reset lower level selection
  };
  
  const handleUCSelection = (option: Option) => {
    console.log('Selected UC:', option.value);
    setSelectedUC(option.value);
  };
  
  // Complete hierarchy selectors
  const completeHierarchyUnits = useSelector(selectAllCompleteHierarchyUnits);
  const subordinateUnits = useSelector(selectSubordinateUnits);
  const parentUnits = useSelector(selectParentUnits);
  const userHierarchyUnit = useSelector(selectUserUnit);
  const hierarchyStatus = useSelector(selectHierarchyStatus);
  
  const userDetails=useSelector(selectUserDetails);
  const { authError } = useAuthErrorHandler();

  // Note: fetchCompleteTanzeemiHierarchy has been removed from the tanzeem hierarchy slice
  // The correct flow is: login email -> user_id -> Tanzeemi_Unit -> Nazim_id -> Person
  // This data should already be available through the auth initialization process
  useEffect(() => {
    console.log('UnitSelection: Using existing hierarchy data from auth initialization');
    console.log('User details:', userDetails);
    console.log('Hierarchy status:', hierarchyStatus);
    console.log('Complete hierarchy units:', completeHierarchyUnits.length);
  }, [userDetails, hierarchyStatus, completeHierarchyUnits]);
  
  // Helper function to check for self-referencing units (parent_id === id)
  // Using useCallback to prevent recreation on each render
  const removeSelfReferencingUnits = useCallback((units: any[]) => {
    return units.filter(unit => unit.id !== unit.parent_id);
  }, []);
  
  // Helper function to get the label of a selected option
  // Using useCallback to prevent recreation on each render
  const getSelectedLabel = useCallback((options: Option[], selectedValue: string | null): string => {
    if (!selectedValue) return '';
    const selectedOption = options.find(opt => opt.value === selectedValue);
    return selectedOption?.label || '';
  }, []);

  // Process hierarchy data when it changes
  useEffect(() => {
    console.log('Dashboard: Hierarchy status:', hierarchyStatus);
    if (hierarchyStatus === 'succeeded' && completeHierarchyUnits.length > 0) {
      console.log('Complete hierarchy units:', completeHierarchyUnits);
      
      // Based on the logs, we can see the structure of the data
      // Let's organize the units by their level
      
      // Find the district (level 1)
      const districts = completeHierarchyUnits.filter(unit => unit.level === 1);
      console.log('Districts found:', districts.length);
      
      // If no districts found, use the parent of the first unit
      if (districts.length === 0 && completeHierarchyUnits[0].parent_id) {
        // Create a mock district option for the parent
        const districtOpts = [{
          id: `district-${completeHierarchyUnits[0].parent_id}`, // Ensure unique ID
          label: 'Unknown', // Default name based on logs
          value: completeHierarchyUnits[0].parent_id.toString()
        }];
        setDistrictOptions(districtOpts);
        
        // Auto-select the only district option
        setSelectedDistrict(districtOpts[0].value);
      } else {
        // Map districts to dropdown options
        const districtOpts = districts.map(unit => ({
          id: `district-${unit.id}`, // Ensure unique ID with prefix
          label: formatUnitName(unit) || 'Unknown District',
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
        id: `zone-${unit.id}`, // Ensure unique ID with prefix
        label: formatUnitName(unit) || 'Unknown Zone',
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
        id: `uc-${unit.id}`, // Ensure unique ID with prefix
        label: formatUnitName(unit) || 'Unknown UC',
        value: unit.id.toString()
      }));
      setUCOptions(ucOpts);
      
      // Auto-select if there's only one UC, a zone is selected, and no UC is selected yet
      if (selectedZone && ucOpts.length === 1 && !selectedUC) {
        console.log('Auto-selecting the only UC:', ucOpts[0].label);
        setSelectedUC(ucOpts[0].value);
      }
    }
  }, [hierarchyStatus, completeHierarchyUnits, selectedZone]);
  
  // Update filtered options when selections change
  useEffect(() => {
    if (hierarchyStatus === 'succeeded' && completeHierarchyUnits.length > 0) {
      // If district is selected, filter zones by parent_id
      if (selectedDistrict) {
        // Filter zones and remove any self-referencing units
        const filteredZones = removeSelfReferencingUnits(
          completeHierarchyUnits.filter(unit => 
            unit.level === 2 && unit.parent_id?.toString() === selectedDistrict
          )
        );
        
        const zoneOpts = filteredZones.map(unit => ({
          id: `zone-${unit.id}`, // Ensure unique ID with prefix
          label: formatUnitName(unit) || 'Unknown Zone',
          value: unit.id.toString()
        }));
        
        setZoneOptions(zoneOpts);
        
        // Auto-select if there's only one zone and none is selected yet
        if (zoneOpts.length === 1 && !selectedZone) {
          console.log('Auto-selecting the only zone (filtered):', zoneOpts[0].label);
          setSelectedZone(zoneOpts[0].value);
        }
      }
      
      // If zone is selected, filter UCs by parent_id
      if (selectedZone) {
        // Filter UCs and remove any self-referencing units
        const filteredUCs = removeSelfReferencingUnits(
          completeHierarchyUnits.filter(unit => 
            (unit.level === 3 || unit.level === 4) && unit.parent_id?.toString() === selectedZone
          )
        );
        
        const ucOpts = filteredUCs.map(unit => ({
          id: `uc-${unit.id}`, // Ensure unique ID with prefix
          label: formatUnitName(unit) || 'Unknown UC',
          value: unit.id.toString()
        }));
        
        setUCOptions(ucOpts);
        
        // Auto-select if there's only one UC and none is selected yet
        if (ucOpts.length === 1 && !selectedUC) {
          console.log('Auto-selecting the only UC (filtered):', ucOpts[0].label);
          setSelectedUC(ucOpts[0].value);
        }
      }
    }
  }, [selectedDistrict, selectedZone, selectedUC, hierarchyStatus, completeHierarchyUnits]);
 
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1 }]} style={styles.container}>
        <View style={styles.topContainer}>  
          <UrduText style={[styles.text, { fontSize: 28 ,marginBottom: SPACING.md}]}>یونٹ سیلیکشن برائے بالائی نظم۔</UrduText>
          <CustomDropdown
            options={districtOptions}
            onSelect={handleDistrictSelection}
            viewStyle={[styles.dropdown]}
            dropdownContainerStyle={styles.dropdownContainer}
            textStyle={[styles.dropdownText]}
            placeholder={selectedDistrict ? getSelectedLabel(districtOptions, selectedDistrict) : 'ضلع منتخب کریں'}
            selectedValue={selectedDistrict || undefined}
            loading={hierarchyStatus === 'loading'}
            disabled={districtOptions.length <= 1} // Disable if there's only one option
          />
          <CustomDropdown
            options={zoneOptions}
            onSelect={handleZoneSelection}
            viewStyle={[styles.dropdown]}
            textStyle={[styles.dropdownText]}
            dropdownContainerStyle={styles.dropdownContainer}
            placeholder={selectedZone ? getSelectedLabel(zoneOptions, selectedZone) : 'زون منتخب کریں'}
            selectedValue={selectedZone || undefined}
            loading={hierarchyStatus === 'loading' || !selectedDistrict}
            disabled={zoneOptions.length <= 1 || !selectedDistrict} // Disable if there's only one option or no district selected
          />
          <CustomDropdown
            options={ucOptions}
            onSelect={handleUCSelection}
            viewStyle={[styles.dropdown]}
            textStyle={[styles.dropdownText]}
            dropdownContainerStyle={styles.dropdownContainer}
            placeholder={selectedUC ? getSelectedLabel(ucOptions, selectedUC) : ' یوسی منتخب کریں'}
            selectedValue={selectedUC || undefined}
            loading={hierarchyStatus === 'loading' }
            disabled={ucOptions.length <= 1 || !selectedZone} // Disable if there's only one option or no zone selected
          />
        </View>
        <View style={styles.bottomContainer}>
          <UrduText style={{ color: "#008CFF", fontSize: 24 }}>تفصیل کا عنوان</UrduText>
          <View style={styles.detailsContainer}>
            <View style={styles.detail}>
              <UrduText style={styles.detailText}>ارکان</UrduText>
              <UrduText style={styles.detailText}>50</UrduText>
            </View>
            <View style={styles.detail}>
              <UrduText style={styles.detailText}>ممبران</UrduText>
              <UrduText style={styles.detailText}>500</UrduText>
            </View>
            <View style={styles.detail}>
              <UrduText style={styles.detailText}>ووٹرز</UrduText>
              <UrduText style={styles.detailText}>5000</UrduText>
            </View>
            <View style={styles.detail}>
              <UrduText style={styles.detailText}>وارڈز جن میں نظم قائم ہے</UrduText>
              <UrduText style={styles.detailText}>4</UrduText>
            </View>
            <View style={styles.detail}>
              <UrduText style={styles.detailText}>بلاک کوڈز</UrduText>
              <UrduText style={styles.detailText}>10</UrduText>
            </View>
          </View>
        </View>
  
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  topContainer: {
    backgroundColor: '#008CFF',
    height: "40%",
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingLeft: 16,
    paddingRight: 16
  },
  text: {
    color: "white",
    fontFamily: "JameelNooriNastaleeq",
  },

  dropdown: {
    height: 55,
    marginBottom: SPACING.sm,
  },
  dropdownContainer: {
    width: "100%",
    height: 55,
    borderRadius: 10,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white
  },
  dropdownText: {
    fontSize: 20,
    fontFamily: "JameelNooriNastaleeq"
  },
  bottomContainer: {
    height: "50%",
    alignItems: 'flex-start',
    paddingTop: 24,
    padding: 16
  },
  detailsContainer: {
    marginTop: 20,
    padding: 10,
    width: "100%",
  },
  detailText: {
    fontSize: 20,
    fontFamily: "JameelNooriNastaleeq"
  },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomColor: "#EBEBEB",
    borderBottomWidth: 1,
    margin: 5
  }
});
