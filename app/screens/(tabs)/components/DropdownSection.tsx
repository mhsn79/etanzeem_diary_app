import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import CustomDropdown from '@/app/components/CustomDropdown';
import Spacer from '@/app/components/Spacer';
import { Option } from './types';

interface DropdownSectionProps {
  options: Option[];
  selectedValue: string | null;
  onSelect: (option: Option) => void;
  placeholder: string;
  loading?: boolean;
  disabled?: boolean;
  colorScheme?: string | null | undefined;
}

const DropdownSection = memo(({ 
  options, 
  selectedValue, 
  onSelect, 
  placeholder, 
  loading, 
  disabled,
  colorScheme 
}: DropdownSectionProps) => {
  const styles = getStyles(colorScheme);
  
  return (
    <>
      <CustomDropdown
        options={options}
        onSelect={onSelect}
        viewStyle={styles.modalDropdown}
        dropdownContainerStyle={styles.modalDropdownContainer}
        textStyle={styles.modalDropdownText}
        placeholder={selectedValue ? options.find((opt) => opt.value === selectedValue)?.label || placeholder : placeholder}
        selectedValue={selectedValue || undefined}
        loading={loading}
        disabled={disabled}
      />
      <Spacer height={10} />
    </>
  );
});

const getStyles = (colorScheme: string | null | undefined) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    modalDropdown: {
      backgroundColor: isDark ? '#373842' : '#FFFFFF',
      borderRadius: 8,
      height: 48,
      justifyContent: 'center',
      paddingHorizontal: 15,
      marginBottom: 10,
    },
    modalDropdownContainer: {
      width: '100%',
    },
    modalDropdownText: {
      color: isDark ? '#FFB30F' : '#0BA241',
      fontSize: 16,
    },
  });
};

export default DropdownSection;