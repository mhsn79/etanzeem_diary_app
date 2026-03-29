import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, Platform, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UrduText from './UrduText';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';

export interface SpeedDialAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface SpeedDialFABProps {
  actions: SpeedDialAction[];
}

const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  // Tall enough for ~8 action rows + padding; cap so modal still fits small phones with cancel visible
  const actionsScrollMaxHeight = Math.min(windowHeight * 0.72, 580);

  return (
    <>
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.mainFab}
          onPress={() => setIsOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.overlayBackdrop} onPress={() => setIsOpen(false)} />
          <View style={styles.overlayCenter}>
            <View style={styles.dialogBox}>
              <ScrollView
                style={[styles.actionsList, { maxHeight: actionsScrollMaxHeight }]}
                contentContainerStyle={styles.actionsListContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.actionBtn}
                    onPress={() => {
                      setIsOpen(false);
                      action.onPress();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionIconCircle, { backgroundColor: action.color || COLORS.primary }]}>
                      <Ionicons name={action.icon} size={20} color={COLORS.white} />
                    </View>
                    <UrduText style={styles.actionText}>{action.label}</UrduText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity onPress={() => setIsOpen(false)} activeOpacity={0.7} style={styles.cancelWrap}>
                <UrduText style={styles.dialogCancelText}>منسوخ کریں</UrduText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    elevation: 8,
  },
  mainFab: {
    width: 80,
    height: 80,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayCenter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? SHADOWS.medium : { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' }),
  },
  actionsList: {
    width: '100%',
  },
  actionsListContent: {
    paddingVertical: SPACING.sm,
    flexGrow: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: SPACING.lg,
    backgroundColor: COLORS.lightGray,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    width: '100%',
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: 'JameelNooriNastaleeq',
  },
  cancelWrap: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  dialogCancelText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
  },
});

export default SpeedDialFAB;