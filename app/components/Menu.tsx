import React from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import UrduText from './UrduText';
import i18n from '../i18n';

type MenuProps = {
  visible: boolean;
  onClose: () => void;
};

const Menu = ({ visible, onClose }: MenuProps) => {
  const router = useRouter();
  const { currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageToggle = () => {
    changeLanguage(currentLanguage === 'en' ? 'ur' : 'en');
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      router.replace('/screens/LoginScreen');
    }, 100);
  };

  const navigateTo = (route: string) => {
    onClose();
    router.push(route);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.menuContainer}>
          <View style={styles.menuContent}>
            <Pressable
              style={styles.menuItem}
              onPress={() => navigateTo('/')}
            >
              <UrduText style={styles.menuText}>
                {i18n.t('dashboard')}
              </UrduText>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => navigateTo('/screens/UnitSelection')}
            >
              <UrduText style={styles.menuText}>
                {i18n.t('unit_selection')}
              </UrduText>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => navigateTo('/screens/Workforce')}
            >
              <UrduText style={styles.menuText}>
                {i18n.t('workforce')}
              </UrduText>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => navigateTo('/screens/(tabs)/Activities')}
            >
              <UrduText style={styles.menuText}>
                {i18n.t('activities')}
              </UrduText>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => navigateTo('/screens/(tabs)/Arkan')}
            >
              <UrduText style={styles.menuText}>
                {i18n.t('arkan')}
              </UrduText>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => navigateTo('/screens/RukunView')}
            >
              <UrduText style={styles.menuText}>
                {i18n.t('rukun')}
              </UrduText>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => navigateTo('/screens/ProfileView')}
            >
              <UrduText style={styles.menuText}>
                {i18n.t('profile')}
              </UrduText>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={handleLanguageToggle}
            >
              <UrduText style={styles.menuText}>
                {i18n.t('switch_language')}
              </UrduText>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={handleLogout}
            >
              <UrduText style={styles.menuText}>
                {i18n.t('logout')}
              </UrduText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    flex: 1,
    width: '70%',
    backgroundColor: '#fff',
  },
  menuContent: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'flex-start',
  },
  menuItem: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  menuText: {
    fontSize: 18,
    textAlign: 'right',
    fontFamily: 'JameelNooriNastaleeq',
  },
});

export default Menu; 