import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Dimensions, TextStyle, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome icon library
import Spacer from './Spacer';

interface CustomDropdownProps {
  options: string[]; // List of options for the dropdown
  onSelect: (selectedItem: string) => void; // Callback when an item is selected
  placeholder?: string; // Placeholder text when no item is selected
  viewStyle: [ViewStyle?];
  textStyle: [TextStyle?];
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, onSelect, placeholder = 'Select an option', viewStyle, textStyle, ...rest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (item: string) => {
    setSelectedValue(item);
    onSelect(item); // Pass the selected value to the parent component
    setIsOpen(false); // Close the dropdown after selection
  };

  return (
    <View style={[styles.container, viewStyle]}>
      {/* Touchable area that triggers the dropdown */}
      <TouchableOpacity onPress={toggleDropdown} style={[styles.input, viewStyle]}>
        {/* Arrow indicator */}
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}  // Toggle arrow based on dropdown state
          size={20}
          // color="#333"
          style={[styles.arrowIcon, textStyle]}
        />

        <Text style={[styles.inputText, textStyle]}>
          {selectedValue ? selectedValue : placeholder}
        </Text>
      </TouchableOpacity>

      {/* Dropdown List */}
      {isOpen && (
        <>
          <TouchableWithoutFeedback onPress={toggleDropdown}>
            <View style={styles.modalOverlay}></View>
          </TouchableWithoutFeedback>
          <View style={styles.dropdownWrapper}>
            {options.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownItem}
                onPress={() => handleSelect(item)}
              >
                <View style={{ flexDirection: "row" }}>
                  <Spacer height={10} />
                  <Text style={styles.dropdownText}>{item}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 10,
    width: '100%', // Make sure the container takes up the full width
  },
  input: {
    flexDirection: 'row', // To align the text and the arrow horizontally
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    justifyContent: 'space-between', // Ensures space between text and arrow
    alignItems: 'center',
    width: '100%', // Make input field full width
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  arrowIcon: {
    marginLeft: 10, // Space between text and arrow
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: '100%', // Make the dropdown full width
    zIndex: 999,
    maxHeight: 200, // Prevent overflowing
    marginTop: 5,
    elevation: 5, // for Android shadow
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CustomDropdown;
