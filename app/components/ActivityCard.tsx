import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import UrduText from './UrduText';
import ActivityActionButton from './ActivityActionButton';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../constants/theme';
import { Feather, FontAwesome, MaterialIcons, SimpleLineIcons } from '@expo/vector-icons';
import Dialog from './Dialog';
import ActivityCompletionDialog from './ActivityCompletionDialog';
import { useAppDispatch, useAppSelector } from '@/src/hooks/redux';
import { deleteActivity, selectDeleteActivityStatus, editActivity } from '../features/activities/activitySlice';
import { selectUser as selectCurrentUser } from '../features/auth/authSlice';

interface ActivityCardProps {
  id: string;
  title: string;
  details:string;
  location: string;
  status: string;
  dateTime: string;
  rawDateTime?: string;
  attendance: string;
  dateCreated: string;
  dateUpdated: string;
  user_created?: string;
  shouldBeGreyedOut?: boolean;
  isPast?: boolean;
  isDraft?: boolean;
  handleRight: () => void;
  handleMiddle: () => void;
  handleLeft: () => void;
  onDeleteSuccess?: () => void;
  onCompletionSuccess?: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  id,
  title,
  details,
  location,
  status,
  dateTime,
  rawDateTime,
  attendance,
  dateCreated,
  dateUpdated,
  user_created,
  shouldBeGreyedOut = false,
  isPast = false,
  isDraft = false,
  handleLeft,
  handleMiddle,
  handleRight,
  onDeleteSuccess,
  onCompletionSuccess,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const deleteStatus = useAppSelector(selectDeleteActivityStatus);
  const currentUser = useAppSelector(selectCurrentUser);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Check if the current user is the creator of this activity
  const isCreator = useMemo(() => {
    if (!currentUser || !user_created) {
      return false;
    }
    const result = String(currentUser.id) === String(user_created);
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

  const handleCardPress = () => {
    if (shouldBeGreyedOut && isPast && isDraft) {
      setShowCompletionDialog(true);
    }
  };

  const handleActivityCompletion = (data: { attendance: string; reportingMonth: string; reportingYear: string }) => {
    setIsCompleting(true);
    
    // Update activity to published status with attendance and reporting details
    const updateData = {
      id: Number(id),
      activityData: {
        status: 'published',
        attendance: parseInt(data.attendance),
        report_month: parseInt(data.reportingMonth),
        report_year: parseInt(data.reportingYear),
      }
    };

    dispatch(editActivity(updateData))
      .unwrap()
      .then(() => {
        setIsCompleting(false);
        setShowCompletionDialog(false);
        if (onCompletionSuccess) {
          onCompletionSuccess(); // Refresh the list
        }
      })
      .catch((error) => {
        setIsCompleting(false);
        setShowCompletionDialog(false);
        Alert.alert('خرابی', error || 'سرگرمی کو اپڈیٹ کرنے میں ناکامی');
      });
  };
  return (
    <TouchableOpacity 
      style={[
        styles.cardContainer,
        shouldBeGreyedOut && styles.greyedOutCard
      ]}
      onPress={handleCardPress}
      activeOpacity={shouldBeGreyedOut ? 0.7 : 1}
    >
      <View style={styles.titleContainer}>
        <View style={styles.titleDetailsContainer}>
          <UrduText style={[
            styles.title,
            shouldBeGreyedOut && styles.greyedOutText
          ]}>{title}</UrduText>
          <UrduText style={[
            styles.detail,
            shouldBeGreyedOut && styles.greyedOutText
          ]}>تاریخ وقت: {dateTime}</UrduText>
          <UrduText style={[
            styles.detail,
            shouldBeGreyedOut && styles.greyedOutText
          ]}>مقام: {location}</UrduText>
        </View>
        {/* Edit button in top-right corner */}
        {isCreator && (
          <TouchableOpacity 
            style={styles.editIcon} 
            onPress={() => router.push({
              pathname: '/screens/(stack)/ActivityScreen',
              params: { mode: 'edit', id: id }
            })}
          >
            <Feather name="edit" size={SIZES.icon.sSmall} color={COLORS.black} />
          </TouchableOpacity>
        )}
      </View>
      {/* Delete button in bottom-right corner */}
      {isCreator && (
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity style={styles.deleteIcon} onPress={handleDelete}>
            <Feather name="archive" size={SIZES.icon.sSmall} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    
      {/* <View style={styles.buttonContainer}>
        <ActivityActionButton text="ایس ایم ایس" onPress={handleRight} iconComponent={<SimpleLineIcons name="envelope" size={20} color="black" />} />
        <ActivityActionButton text=" ایپ نوٹیفکیشن" onPress={handleMiddle} iconComponent={<MaterialIcons name="notifications-none" size={20} color="black" />} />
        <ActivityActionButton text="واٹس ایپ" onPress={handleRight} iconComponent={<FontAwesome name="whatsapp" size={20} color="black" />} />
      </View> */}

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

      {/* Activity Completion Dialog */}
      <ActivityCompletionDialog
        visible={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        onConfirm={handleActivityCompletion}
        activityDate={rawDateTime || dateTime}
        loading={isCompleting}
      />
    </TouchableOpacity>
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
    alignItems: 'flex-start',
  },
  titleDetailsContainer: {
    flex: 1,
    marginRight: SPACING.sm,
    alignItems: 'flex-start',
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
  editIcon: {
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: SPACING.lg / 2,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  deleteIcon: {
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: SPACING.lg / 2,
    backgroundColor: COLORS.error,
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
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  chairmenText: {
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  greyedOutCard: {
    opacity: 0.4,
    backgroundColor: '#E5E5E5',
  },
  greyedOutText: {
    color: '#999999',
  },
});

export default ActivityCard;
