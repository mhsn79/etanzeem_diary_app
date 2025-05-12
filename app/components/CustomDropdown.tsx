import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import UrduText from './UrduText';

export interface Option {
  id: string;
  label: string;
  value: string;
}

interface CustomDropdownProps {
  options: Option[];
  onSelect: (option: Option) => void;
  placeholder?: string;
  /** Extra styles for the touchable */
  viewStyle?: object;
  /** Extra styles for the selected‑text */
  textStyle?: object;
  /** Currently‑selected value (controlled) */
  selectedValue?: string;
  /** Extra styles for the dropdown touchable container */
  dropdownContainerStyle?: object;
  dropdownTitle?: string;
  /** Max height (px) of the list before it starts scrolling */
  maxHeight?: number;
  /** Whether the dropdown is in loading state */
  loading?: boolean;
}

/**
 * CustomDropdown — *modal* implementation.
 * --------------------------------------------------------------
 * Fixes two issues present in the in‑place <ScrollView> variant:
 *   • Last dropdown’s list could not scroll because it was clipped by the
 *     parent <ScrollView>.
 *   • Second‑last dropdown’s list was hidden under the last dropdown —
 *     z‑index chaos inside nested views.
 *
 * We now render the list in a **transparent Modal** at the root of the app.
 * This guarantees:
 *   • Full‑screen overlay — z‑order always sits above everything.
 *   • Independent scrolling using FlatList.
 *   • Smart placement *above* or *below* the trigger, depending on available
 *     space, so nothing gets cut off.
 */
const ROW_HEIGHT = 48;
const WINDOW = Dimensions.get('window');

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options = [],
  onSelect,
  placeholder = 'Select an option',
  dropdownContainerStyle,
  viewStyle,
  textStyle,
  selectedValue,
  dropdownTitle,
  maxHeight = 200,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(
    options?.find(opt => opt.value === selectedValue) || null
  );
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<View | null>(null);

  // Update selected option when selectedValue changes
  useEffect(() => {
    setSelectedOption(options?.find(opt => opt.value === selectedValue) || null);
  }, [selectedValue, options]);

  const open = () => {
    if (loading) return; // Don't open if loading
    
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setLayout({ x, y, width, height });
      setIsOpen(true);
    });
  };

  const close = () => setIsOpen(false);

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    onSelect(option);
    close();
  };

  // --------------------------- PLACEMENT -----------------------------------
  const placement = useMemo(() => {
    const spaceBelow = WINDOW.height - (layout.y + layout.height);
    const neededHeight = Math.min(maxHeight, (options?.length || 0) * ROW_HEIGHT);
    const showAbove = spaceBelow < neededHeight && layout.y > neededHeight;
    return {
      top: showAbove ? layout.y - neededHeight : layout.y + layout.height,
      maxHeight: neededHeight,
    };
  }, [layout, options?.length, maxHeight]);

  // ---------------------------- RENDER -------------------------------------
  return (
    <View style={[styles.container, viewStyle]}>
      {dropdownTitle && <UrduText style={styles.dropdownTitle}>{dropdownTitle}</UrduText>}

      {/* TRIGGER */}
      <TouchableOpacity
        ref={triggerRef}
        style={[styles.trigger, dropdownContainerStyle]}
        onPress={open}
        activeOpacity={0.8}
        disabled={loading}
      >
        <UrduText style={[styles.selectedText, textStyle]}> {selectedOption ? selectedOption.label : placeholder} </UrduText>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={24} color={COLORS.black} />
        )}
      </TouchableOpacity>

      {/* LIST (Modal) */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        {/* Overlay to capture taps outside */}
        <TouchableWithoutFeedback onPress={close}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        {/* Positioned list */}
        <View
          style={[
            styles.listWrapper,
            {
              top: placement.top,
              left: layout.x,
              width: layout.width,
              maxHeight: placement.maxHeight,
            },
          ]}
        >
          <FlatList
            data={options || []}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.optionItem, selectedOption?.id === item.id && styles.selectedOption]}
                onPress={() => handleSelect(item)}
              >
                <UrduText
                  style={[styles.optionText, selectedOption?.id === item.id && styles.selectedOptionText]}
                >
                  {item.label}
                </UrduText>
              </TouchableOpacity>
            )}
            bounces={false}
          />
        </View>
      </Modal>
    </View>
  );
};

// ------------------------- STYLES ------------------------------------------
const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  dropdownTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    textAlign: 'left',
    marginBottom: SPACING.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  selectedText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    flex: 1,
    textAlign: 'left',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  listWrapper: {
    position: 'absolute',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
    zIndex: 1000,
    overflow: 'hidden',
  },
  optionItem: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedOption: {
    backgroundColor: COLORS.lightPrimary,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    textAlign: 'left',

  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default CustomDropdown;
