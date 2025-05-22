import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import UrduText from '@/app/components/UrduText';
import Spacer from '@/app/components/Spacer';
import { IconProps } from './types';

interface HeaderInfoItemProps {
  text: string;
  icon: React.FC<IconProps>;
  onPress?: () => void;
  iconProps?: IconProps;
  textStyle?: any;
  colorScheme?: string | null | undefined;
}

const HeaderInfoItem = memo(({ text, icon: Icon, onPress, iconProps = {}, textStyle = {}, colorScheme }: HeaderInfoItemProps) => {
  const styles = getStyles(colorScheme);
  const isClickable = !!onPress;
  const Container = isClickable ? TouchableOpacity : View;
  const isLeftUpArrowWhite = Icon && (Icon.displayName === 'LeftUpArrowWhite' || Icon.name === 'LeftUpArrowWhite');

  return (
    <Container onPress={onPress}>
      <View style={styles.headerInfoItem}>
        {!isLeftUpArrowWhite && Icon && (
          <>
            <Icon {...iconProps} />
            <Spacer width={8} />
          </>
        )}
        <UrduText style={[styles.headerInfoText, textStyle]}>{text}</UrduText>
        {isLeftUpArrowWhite && (
          <>
            <Spacer width={8} />
            <Icon {...iconProps} />
          </>
        )}
        <Spacer height={10} width={isClickable ? '100%' : undefined} />
      </View>
    </Container>
  );
});

const getStyles = (colorScheme: string | null | undefined) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    headerInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerInfoText: {
      color: 'white',
      fontSize: 18,
    },
  });
};

export default HeaderInfoItem;