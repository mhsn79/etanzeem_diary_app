import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, ScrollView, Dimensions, TextStyle, ViewStyle, useColorScheme, I18nManager } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome icon library
import Spacer from './Spacer';
import i18n from '../i18n';
import UrduText from './UrduText';

interface CustomDropdownProps {
  options: string[]; // List of options for the dropdown
  onSelect: (selectedItem: string) => void; // Callback when an item is selected
  placeholder?: string; // Placeholder text when no item is selected
  viewStyle?: ViewStyle[];
  textStyle?: TextStyle[];
  isDarkMode?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  options, 
  onSelect, 
  placeholder = 'Select an option', 
  viewStyle = [], 
  textStyle = [],
  isDarkMode = useColorScheme() === 'dark'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const isRTL = i18n.locale === 'ur'; // Set RTL based on language

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (item: string) => {
    setSelectedValue(item);
    onSelect(item); // Pass the selected value to the parent component
    setIsOpen(false); // Close the dropdown after selection
  };

  const themeStyles = {
    backgroundColor: isDarkMode ? '#23242D' : '#fff',
    textColor: isDarkMode ? '#FFB30F' : '#0BA241',
    borderColor: isDarkMode ? '#373842' : '#ccc',
    dropdownBg: isDarkMode ? '#373842' : '#fff',
    itemHoverBg: isDarkMode ? '#23242D' : '#f5f5f5',
  };

  return (
    <View style={[styles.container, ...viewStyle]}>
      {/* Touchable area that triggers the dropdown */}
      <TouchableOpacity 
        onPress={toggleDropdown} 
        style={[
          styles.input,
          {
            backgroundColor: themeStyles.backgroundColor,
            borderColor: themeStyles.borderColor,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
          ...viewStyle
        ]}
      >
        <UrduText style={[
          styles.inputText,
          {
            color: themeStyles.textColor,
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
          ...textStyle
        ]}>
          {selectedValue || placeholder}
        </UrduText>
        
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={themeStyles.textColor}
          style={[
            styles.arrowIcon,
            isRTL && { transform: [{ scaleX: -1 }] }
          ]}
        />
      </TouchableOpacity>

      {/* Dropdown List */}
      {isOpen && (
        <>
          <TouchableWithoutFeedback onPress={toggleDropdown}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={[
            styles.dropdownWrapper,
            {
              backgroundColor: themeStyles.dropdownBg,
              borderColor: themeStyles.borderColor,
            }
          ]}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              bounces={false}
              style={{ maxHeight: 200 }}
            >
              {options.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    {
                      backgroundColor: themeStyles.dropdownBg,
                      borderBottomColor: themeStyles.borderColor,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                    index === options.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <UrduText style={[
                    styles.dropdownText,
                    {
                      color: themeStyles.textColor,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    }
                  ]}>
                    {item}
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
  },
  input: {
    height: 48,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  arrowIcon: {
    marginHorizontal: 5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 998,
  },
  dropdownWrapper: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    width: '100%',
    zIndex: 999,
    marginTop: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 20,
    width: '100%',
  },
});

export default CustomDropdown;
