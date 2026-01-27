import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View, Image, GestureResponderEvent, Animated } from 'react-native';
import UrduText from './UrduText';
import { RukunData } from '../models/RukunData';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../src/types/RootStackParamList';
import { COLORS, SIZES, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { Feather } from '@expo/vector-icons';
import ContactActionButton from './ContactActionButton';

interface ContactType {
  id: number;
  type: string;
}

interface RukunCardProps {
  item: RukunData;
  onCardPress?: (item: RukunData) => void;
  contactTypes?: ContactType[];
}

const RukunCard: React.FC<RukunCardProps> = ({ item, onCardPress, contactTypes }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  // Helper function to determine if edit icon should be hidden
  const shouldHideEditIcon = (): boolean => {
    if (!contactTypes || !item.contact_type) return false;
    
    const contactType = contactTypes.find(type => type.id === item.contact_type);
    if (!contactType) return false;
    
    // Hide edit icon for umeedwar and rukun contact types
    return contactType.type === 'umeedwar' || contactType.type === 'rukun';
  };

  const toggleExpanded = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    
    Animated.timing(animation, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleCall = (e: GestureResponderEvent) => {
    // Prevent the touch event from propagating to the parent
    e.stopPropagation();
    if (item.phone) {
      Linking.openURL(`tel:${item.phone}`);
    }
  };

  const handleWhatsApp = (e: GestureResponderEvent) => {
    // Prevent the touch event from propagating to the parent
    e.stopPropagation();
    if (item.whatsApp) {
      Linking.openURL(`whatsapp://send?phone=${item.whatsApp}`);
    }
  };

  const handleSMS = (e: GestureResponderEvent) => {
    // Prevent the touch event from propagating to the parent
    e.stopPropagation();
    if (item.sms) {
      Linking.openURL(`sms:${item.sms}`);
    }
  };

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleViewDetails = () => {
    if (onCardPress) {
      onCardPress(item);
    } else {
      navigation.navigate('screens/RukunView', { rukun: item });
    }
  };

  const handleEditDetails = (e: GestureResponderEvent) => {
    // Prevent the touch event from propagating to the parent
    e.stopPropagation();
    navigation.navigate('screens/RukunAddEdit', { rukun: item });
  };

  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={handleViewDetails}
      activeOpacity={0.9}
    >
      <View style={styles.titleContainer}>
        <Image
          source={item.picture ? { uri: item.picture } : require('../../assets/images/avatar.png')}
          style={styles.avatar}
        />
        <View style={styles.textContainer}>
          <UrduText style={styles.title}>{item.name || `Person #${item.id}`}</UrduText>
          <View style={styles.addressContainer}>
            <Image
              source={require('../../assets/images/location-icon-blue.png')}
              style={{ height: 16, width: 16 }}
            />
            <UrduText style={styles.detail}>{item.address || 'No address'}</UrduText>
          </View>
        </View>
        <View style={styles.actionButtons}>
          {!shouldHideEditIcon() && (
            <TouchableOpacity 
              style={styles.viewIcon} 
              onPress={handleEditDetails}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="edit" size={SIZES.icon.sSmall} color={COLORS.black} />
            </TouchableOpacity>
          )}
          {(item.phone || item.whatsApp || item.sms) && (
            <TouchableOpacity 
              style={[styles.expandButton, isExpanded && styles.expandButtonActive]} 
              onPress={toggleExpanded}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={SIZES.icon.sSmall} 
                color={COLORS.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Expandable contact buttons */}
      {(item.phone || item.whatsApp || item.sms) && (
        <Animated.View 
          style={[
            styles.expandableContainer,
            {
              maxHeight: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 100], // Adjust height as needed
              }),
              opacity: animation,
            }
          ]}
        >
          <View style={styles.divider} />
          <View style={styles.buttonContainer}>
            {item.phone && (
              <ContactActionButton
                onPress={handleCall}
                text="کال کریں"
                iconType="phone"
              />
            )}
            {item.whatsApp && (
              <ContactActionButton
                onPress={handleWhatsApp}
                text="واٹس ایپ"
                iconType="whatsapp"
              />
            )}
            {item.sms && (
              <ContactActionButton
                onPress={handleSMS}
                text="ایس ایم ایس"
                iconType="sms"
              />
            )}
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.lightGray,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: 12,
    ...SHADOWS.medium,
  },
  titleContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: COLORS.primary,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'left',
    marginBottom: SPACING.xs,
  },
  detail: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.white,
    marginVertical: SPACING.sm,
  },
  viewIcon: {
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: SPACING.lg / 2,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  expandButton: {
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: SPACING.lg / 2,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
  },
  expandButtonActive: {
    backgroundColor: COLORS.lightPrimary,
    borderColor: COLORS.lightPrimary,
  },
  expandableContainer: {
    overflow: 'hidden',
  },
});

export default RukunCard;
