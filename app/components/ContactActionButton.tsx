import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View, GestureResponderEvent } from 'react-native';
import { SimpleLineIcons, FontAwesome } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import UrduText from './UrduText';

interface ContactActionButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  text: string;
  iconType: 'phone' | 'whatsapp' | 'sms';
  btnStyle?: object;
}

const ContactActionButton: React.FC<ContactActionButtonProps> = ({ onPress, text, iconType,
  btnStyle
 }) => {
  const getIcon = () => {
    switch (iconType) {
      case 'phone':
        return <SimpleLineIcons name="phone" size={20} color="black" />;
      case 'whatsapp':
        return <FontAwesome name="whatsapp" size={20} color="black" />;
      case 'sms':
        return <SimpleLineIcons name="envelope" size={20} color="black" />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity style={[styles.button,btnStyle]} onPress={onPress}>
      {getIcon()}
      <UrduText style={styles.buttonText}>{text}</UrduText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: '28%',
  },
  buttonText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
});

export default ContactActionButton;
