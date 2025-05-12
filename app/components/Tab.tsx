import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import UrduText from './UrduText';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';

interface TabProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  style?: object;
  textStyle?: object;
  badge?: string;
}

const Tab: React.FC<TabProps> = ({ label, isSelected, onPress, style, textStyle, badge }) => {
  return (
    <TouchableOpacity 
      style={[styles.tab, isSelected && styles.selectedTab, style]} 
      onPress={onPress}
    >
      <UrduText style={[styles.tabText, isSelected && styles.selectedTabText, textStyle]}>
        {label}
      </UrduText>
      {badge && (
        <View style={[styles.badge, isSelected && styles.selectedBadge]}>
          <UrduText style={[styles.badgeText, isSelected && styles.selectedBadgeText]}>
            {badge}
          </UrduText>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface TabGroupProps {
  tabs: { label: string; value: number; badge?: string }[];
  selectedTab: number;
  onTabChange: (value: number) => void;
  containerStyle?: object;
  tabStyle?: object;
  textStyle?: object;
}

export const TabGroup: React.FC<TabGroupProps> = ({
  tabs = [],
  selectedTab,
  onTabChange,
  containerStyle,
  tabStyle,
  textStyle,
}) => {
  if (!tabs || tabs.length === 0) {
    return null;
  }
  
  return (
    <View style={[styles.tabContainer, containerStyle]}>
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          label={tab.label}
          badge={tab.badge}
          isSelected={selectedTab === tab.value}
          onPress={() => onTabChange(tab.value)}
          style={tabStyle}
          textStyle={textStyle}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  selectedTabText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  selectedBadge: {
    backgroundColor: COLORS.lightPrimary,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  selectedBadgeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default Tab; 