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
}

const Tab: React.FC<TabProps> = ({ label, isSelected, onPress, style, textStyle }) => {
  return (
    <TouchableOpacity 
      style={[styles.tab, isSelected && styles.selectedTab, style]} 
      onPress={onPress}
    >
      <UrduText style={[styles.tabText, isSelected && styles.selectedTabText, textStyle]}>
        {label}
      </UrduText>
    </TouchableOpacity>
  );
};

interface TabGroupProps {
  tabs: { label: string; value: number }[];
  selectedTab: number;
  onTabChange: (value: number) => void;
  containerStyle?: object;
  tabStyle?: object;
  textStyle?: object;
}

export const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  selectedTab,
  onTabChange,
  containerStyle,
  tabStyle,
  textStyle,
}) => {
  return (
    <View style={[styles.tabContainer, containerStyle]}>
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          label={tab.label}
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
});

export default Tab; 