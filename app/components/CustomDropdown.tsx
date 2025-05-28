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
  ViewStyle,
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
  viewStyle?: object;
  textStyle?: object;
  selectedValue?: string;
  dropdownContainerStyle?: object;
  dropdownTitle?: string;
  maxHeight?: number;
  loading?: boolean;
  disabled?: boolean;
  listWrapperStyle?: ViewStyle;
  isRtl?: boolean; // New prop to handle RTL layout
}

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
  disabled = false,
  listWrapperStyle,
  isRtl = true, // Default to false for LTR
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(
    options?.find(opt => opt.value === selectedValue) || null
  );
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<View | null>(null);

  useEffect(() => {
    setSelectedOption(options?.find(opt => opt.value === selectedValue) || null);
  }, [selectedValue, options]);

  const open = () => {
    if (loading) return;
    
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

  const placement = useMemo(() => {
    const spaceBelow = WINDOW.height - (layout.y + layout.height);
    const neededHeight = Math.min(maxHeight, (options?.length || 0) * ROW_HEIGHT);
    const showAbove = spaceBelow < neededHeight && layout.y > neededHeight;
    return {
      top: showAbove ? layout.y - neededHeight : layout.y + layout.height,
      maxHeight: neededHeight,
    };
  }, [layout, options?.length, maxHeight]);

  // Adjust positioning for RTL
  const listPosition = useMemo(() => {
    if (isRtl) {
      // In RTL, align the list with the right edge of the trigger
      const right = WINDOW.width - (layout.x + layout.width);
      return { right, width: layout.width };
    }
    // In LTR, align with the left edge
    return { left: layout.x, width: layout.width };
  }, [isRtl, layout.x, layout.width]);

  return (
    <View style={[styles.container, viewStyle]}>
      {dropdownTitle && <UrduText style={styles.dropdownTitle}>{dropdownTitle}</UrduText>}

      <TouchableOpacity
        ref={triggerRef}
        style={[
          styles.trigger,
          dropdownContainerStyle,
          disabled && styles.disabledTrigger
        ]}
        onPress={open}
        activeOpacity={0.8}
        disabled={loading || disabled}
      >
        <UrduText style={[styles.selectedText, textStyle]}>
          {selectedOption ? selectedOption.label : placeholder}
        </UrduText>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={24} color={COLORS.black} />
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <TouchableWithoutFeedback onPress={close}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.listWrapper,
            {
              top: placement.top,
              ...listPosition,
              maxHeight: placement.maxHeight,
            },
            listWrapperStyle,
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
  disabledTrigger: {
    opacity: 0.7,
    backgroundColor: COLORS.disabled,
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