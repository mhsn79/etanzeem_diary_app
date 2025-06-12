import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import UrduText from './UrduText';
import ActivityActionButton from './ActivityActionButton';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../constants/theme';
import { Feather, FontAwesome, MaterialIcons, SimpleLineIcons } from '@expo/vector-icons';
import Dialog from './Dialog';
import { useAppDispatch, useAppSelector } from '@/src/hooks/redux';
import { deleteActivity, selectDeleteActivityStatus } from '../features/activities/activitySlice';
import { selectCurrentUser } from '../features/auth/authSlice';

interface ActivityCardProps {
  id: string;
  title: string;
  location: string;
  status: string;
  dateTime: string;
  attendance: string;
  dateCreated: string;
  dateUpdated: string;
  user_created?: string;
  handleRight: () => void;
  handleMiddle: () => void;
  handleLeft: () => void;
  onDeleteSuccess?: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  id,
  title,
  location,
  status,
  dateTime,
  attendance,
  dateCreated,
  dateUpdated,
  user_created,
  handleLeft,
  handleMiddle,
  handleRight,
  onDeleteSuccess,
}) => {
  const dispatch = useAppDispatch();
  const deleteStatus = useAppSelector(selectDeleteActivityStatus);
  const currentUser = useAppSelector(selectCurrentUser);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if the current user is the creator of this activity
  const isCreator = useMemo(() => {
    if (!currentUser || !user_created) {
      console.log(`Activity ${id}: User check failed - currentUser: ${currentUser?.id}, user_created: ${user_created}`);
      return false;
    }
    const result = String(currentUser.id) === String(user_created);
    console.log(`Activity ${id}: User check - currentUser: ${currentUser.id}, user_created: ${user_created}, isCreator: ${result}`);
    return result;
  }, [currentUser, user_created, id]);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setIsDeleting(true);
    dispatch(deleteActivity(Number(id)))
      .unwrap()
      .then(() => {
        setIsDeleting(false);
        setShowDeleteDialog(false);
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      })
      .catch((error) => {
        setIsDeleting(false);
        setShowDeleteDialog(false);
        Alert.alert('خرابی', error || 'سرگرمی کو آرکائیو کرنے میں ناکامی');
      });
  };
  return (
    <View style={styles.cardContainer}>
      <View style={styles.titleContainer}>
        <UrduText style={styles.title}>{title}</UrduText>
        <View style={styles.iconContainer}>
          {isCreator && (
            <TouchableOpacity style={styles.icon} onPress={handleDelete}>
              <Feather name="archive" size={SIZES.icon.sSmall} color={COLORS.warning} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.icon}>
            <Feather name="edit" size={SIZES.icon.sSmall} color={COLORS.black} />
          </TouchableOpacity>
        </View>
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

      {/* Archive Confirmation Dialog */}
      <Dialog
        visible={showDeleteDialog}
        onConfirm={confirmDelete}
        onClose={() => setShowDeleteDialog(false)}
        title="سرگرمی آرکائیو کرنے کی تصدیق"
        description="کیا آپ واقعاً اس سرگرمی کو آرکائیو کرنا چاہتے ہیں؟ آرکائیو کی گئی سرگرمیاں فہرست میں نظر نہیں آئیں گی۔"
        confirmText="ہاں، آرکائیو کریں"
        cancelText="نہیں، واپس جائیں"
        showWarningIcon={true}
        loading={isDeleting}
      />
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
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: SPACING.lg / 2,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
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
