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
  TextInput,
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
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef<View | null>(null);

  // Initialize selected option when component mounts or when options/selectedValue change
  useEffect(() => {
    // Find the matching option based on selectedValue
    const matchingOption = options?.find(opt => opt.value === selectedValue) || null;
    
    // Only update state if necessary to avoid infinite loops
    const needsUpdate = 
      // If we have a selectedValue but no selectedOption or it doesn't match
      (selectedValue && (!selectedOption || selectedOption.value !== selectedValue)) ||
      // If we don't have a selectedValue but have a selectedOption (need to clear)
      (!selectedValue && selectedOption !== null) ||
      // If the IDs don't match (different option with same value)
      (matchingOption && selectedOption && matchingOption.id !== selectedOption.id);
    
    if (needsUpdate) {
      setSelectedOption(matchingOption);
    }
  // Intentionally exclude selectedOption from dependencies to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue, options]);

  const open = () => {
    if (loading) return;
    
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setLayout({ x, y, width, height });
      setIsOpen(true);
    });
  };

  const close = () => {
    setIsOpen(false);
    setSearchQuery(''); // Clear search when closing
  };

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    onSelect(option);
    close();
  };

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options || [];
    }
    const query = searchQuery.toLowerCase().trim();
    return (options || []).filter(option => 
      option.label.toLowerCase().includes(query) ||
      option.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const placement = useMemo(() => {
    const spaceBelow = WINDOW.height - (layout.y + layout.height);
    // Add extra height for search input (48px)
    const searchInputHeight = 48;
    const neededHeight = Math.min(maxHeight, (filteredOptions?.length || 0) * ROW_HEIGHT + searchInputHeight);
    const showAbove = spaceBelow < neededHeight && layout.y > neededHeight;
    return {
      top: showAbove ? layout.y - neededHeight : layout.y + layout.height,
      maxHeight: neededHeight,
    };
  }, [layout, filteredOptions?.length, maxHeight]);

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
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="تلاش کریں..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={filteredOptions}
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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <UrduText style={styles.emptyText}>کوئی نتیجہ نہیں ملا</UrduText>
              </View>
            }
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    paddingVertical: SPACING.xs,
    textAlign: 'right',
  },
  clearButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  emptyContainer: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});

export default CustomDropdown;