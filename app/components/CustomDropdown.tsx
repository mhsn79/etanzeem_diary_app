import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import UrduText from './UrduText';
import { Ionicons } from '@expo/vector-icons';

interface Option {
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
}


const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  onSelect,
  placeholder = 'Select an option',
  dropdownContainerStyle,
  viewStyle,
  textStyle,
  selectedValue,
  dropdownTitle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(
    options.find(opt => opt.value === selectedValue) || null
  );

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, viewStyle]}>
      {dropdownTitle && (
        <UrduText style={styles.dropdownTitle}>{dropdownTitle}</UrduText>
      )}
      <TouchableOpacity
        style={[
          styles.dropdownContainer,
          // isOpen && styles.dropdownContainerFocused,
          dropdownContainerStyle
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <UrduText style={[styles.selectedText, textStyle]}>
          {selectedOption ? selectedOption.label : placeholder}
        </UrduText>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={COLORS.black}
        />
      </TouchableOpacity>

      {isOpen && (
        <>
          <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.dropdownList}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={styles.scrollView}
            >
              {options.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.optionItem,
                    selectedOption?.id === item.id && styles.selectedOption
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <UrduText style={[
                    styles.optionText,
                    selectedOption?.id === item.id && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </UrduText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    marginBottom: SPACING.sm
  },
  dropdownTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    textAlign: 'left',
    marginBottom: SPACING.sm,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  // dropdownContainerFocused: {
  //   borderColor: COLORS.primary,
  //   backgroundColor: COLORS.lightPrimary,
  // },
  selectedText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    flex: 1,
    textAlign: 'left',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 998,
    borderRadius: BORDER_RADIUS.lg,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
    zIndex: 1000,
    // marginTop: SPACING.xs,
  },
  scrollView: {
    maxHeight: 200,
  },
  optionItem: {
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
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
