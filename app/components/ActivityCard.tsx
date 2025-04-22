import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import UrduText from './UrduText';
import ActivityActionButton from './ActivityActionButton';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../constants/theme';
import { Feather, FontAwesome, MaterialIcons, SimpleLineIcons } from '@expo/vector-icons';

interface ActivityCardProps {
  title: string;
  location: string;
  status: string;
  dateTime: string;
  attendance: string;
  dateCreated: string;
  dateUpdated: string;
  handleRight: () => void;
  handleMiddle: () => void;
  handleLeft: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  location,
  status,
  dateTime,
  attendance,
  dateCreated,
  dateUpdated,
  handleLeft,
  handleMiddle,
  handleRight,
}) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.titleContainer}>
        <UrduText style={styles.title}>{title}</UrduText>
        <TouchableOpacity style={styles.icon}>
          <Feather name="edit" size={SIZES.icon.sSmall} color={COLORS.black} />
        </TouchableOpacity>
      </View>
      <View style={styles.detailsContainer}>
        <UrduText style={styles.detail}>تاریخ وقت: {dateTime}</UrduText>
        <UrduText style={styles.detail}>مقام: {location}</UrduText>
      </View>
      <View style={styles.chairmenContainer}>
        <UrduText style={styles.detail}> ناظمین:</UrduText>
        <UrduText style={styles.chairmenText}> محمد علی (زون A)</UrduText>
        <UrduText style={styles.chairmenText}> محمد علی (زون B)</UrduText>
      </View>
      <View style={styles.buttonContainer}>
        <ActivityActionButton text="ایس ایم ایس" onPress={handleRight} iconComponent={<SimpleLineIcons name="envelope" size={20} color="black" />} />
        <ActivityActionButton text=" ایپ نوٹیفکیشن" onPress={handleMiddle} iconComponent={<MaterialIcons name="notifications-none" size={20} color="black" />} />
        <ActivityActionButton text="واٹس ایپ" onPress={handleRight} iconComponent={<FontAwesome name="whatsapp" size={20} color="black" />} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 20,
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: SPACING.lg / 2,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  detailsContainer: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chairmenContainer: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detail: {
  },
  chairmenText: {
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
});

export default ActivityCard;
