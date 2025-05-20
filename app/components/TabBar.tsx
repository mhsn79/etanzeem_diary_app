import React from 'react';
import { Platform, TouchableOpacity, Dimensions, StyleSheet, View, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeIconBlack from '../../assets/images/home-icon-black.svg';
import ArkanIconBlack from '../../assets/images/arkan-icon-black.svg';
import ActivitiesIconBlack from '../../assets/images/activities-icon-black.svg';
import ReportIcon2Black from '../../assets/images/report-icon-2-black.svg';
import HomeIconWhite from '../../assets/images/home-icon-white.svg';
import ArkanIconWhite from '../../assets/images/arkan-icon-white.svg';
import ActivitiesIconWhite from '../../assets/images/activities-icon-white.svg';
import ReportIcon2White from '../../assets/images/report-icon-2-white.svg';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');

function getIcon(label: string, focused?: boolean) {
    const iconSize = wp('5%');
    const iconStyle = {
        width: iconSize,
        height: iconSize,
    };

    return focused ? (
        <>
            {label === 'ڈیش بورڈ' && <HomeIconWhite style={iconStyle} />}
            {label === 'ارکان' && <ArkanIconWhite style={iconStyle} />}
            {label === 'سرگرمیاں' && <ActivitiesIconWhite style={iconStyle} />}
            {label === 'کارکردگی' && <ReportIcon2White style={iconStyle} />}
        </>
    ) : (
        <>
            {label === 'ڈیش بورڈ' && <HomeIconBlack style={iconStyle} />}
            {label === 'ارکان' && <ArkanIconBlack style={iconStyle} />}
            {label === 'سرگرمیاں' && <ActivitiesIconBlack style={iconStyle} />}
            {label === 'کارکردگی' && <ReportIcon2Black style={iconStyle} />}
        </>
    );
}

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const reversedRoutes = [...state.routes].reverse();

    return (
        <View style={[
            styles.bar, 
            { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 0) }
        ]}>
            {reversedRoutes.map((route, reversedIndex) => {
                const index = state.routes.length - 1 - reversedIndex;
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;
                const label = options.tabBarLabel as string;
                const icon = getIcon(label, isFocused);

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        onPress={onPress}
                        key={index}
                        style={styles.tabContainer}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                styles.tabBarButton,
                                isFocused && styles.tabBarButtonFocused,
                                isFocused && styles.tabBarButtonShadow,
                            ]}
                        >
                            <View style={styles.iconContainer}>{icon}</View>
                            {isFocused && <Text style={styles.textStyle}>{label}</Text>}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: hp('10%'),
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        backgroundColor: COLORS.white,
        ...SHADOWS.medium,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: BORDER_RADIUS.lg,
        borderTopRightRadius: BORDER_RADIUS.lg,
    },
    tabContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: SPACING.xs / 2,
    },
    tabBarButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        minHeight: hp('6%'),
        maxHeight: hp('6%'),
        width: wp('12%'),
        overflow: 'hidden',
        ...(Platform.OS === 'android' && { elevation: 0 }),
    },
    tabBarButtonFocused: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderWidth: 1,
        borderColor: COLORS.primary,
        width: wp('30%'),
        borderRadius: BORDER_RADIUS.lg,
    },
    tabBarButtonShadow: {
        ...SHADOWS.small,
        ...(Platform.OS === 'android' && { elevation: 2 }),
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: wp('6%'),
        height: wp('6%'),
    },
    textStyle: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        marginLeft: SPACING.xs,
        textAlign: 'center',
        maxWidth: wp('18%'),
    },
});