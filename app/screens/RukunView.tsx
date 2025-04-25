import React, { useEffect } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import i18n from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RukunData } from '../models/RukunData';
import { Line } from 'react-native-svg';
import CustomButton from '../components/CustomButton';
import { Linking, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "../../src/types/RootStackParamList";
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchPersonById, 
  selectPersonById, 
  selectSelectedPersonStatus, 
  selectSelectedPersonError,
} from '../features/persons/personSlice';
import { Person } from '../models/Person';
import { AppDispatch } from '../store';
import { COLORS } from '../constants/theme';

type RukunDetailsRouteProp = RouteProp<RootStackParamList, 'screens/RukunView'>;

export default function RukunView() {
  const route = useRoute<RukunDetailsRouteProp>();
  const { rukun } = route.params;
  const rukunId = rukun.id;
  
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  
  // Redux state
  const person = useSelector((state) => selectPersonById(state, rukunId));
  const status = useSelector(selectSelectedPersonStatus);
  const error = useSelector(selectSelectedPersonError);

  // Fetch person data if not already in store
  useEffect(() => {
    if (rukunId && rukunId > 0) {
      dispatch(fetchPersonById(rukunId));
    }
  }, [dispatch, rukunId]);

  // Use the person from Redux if available, otherwise use the one from route params
  const displayPerson = person || rukun;

  const handleCall = () => {
    if (displayPerson.phone) {
      Linking.openURL(`tel:${displayPerson.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (displayPerson.whatsApp) {
      Linking.openURL(`whatsapp://send?phone=${displayPerson.whatsApp}`);
    }
  };

  const handleSMS = () => {
    if (displayPerson.sms) {
      Linking.openURL(`sms:${displayPerson.sms}`);
    }
  };

  const handleTransfer = () => {
    // Implement transfer functionality
  };

  const handleEdit = () => {
    navigation.navigate('screens/RukunAddEdit', { rukun: displayPerson });
  };

  // Render loading state
  if (status === 'loading' && !person) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{i18n.t('loading')}</Text>
      </View>
    );
  }

  // Render error state
  if (status === 'failed' && error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <CustomButton
          text={i18n.t('try_again')}
          onPress={() => dispatch(fetchPersonById(rukunId))}
          style={{ marginTop: 20 }}
          viewStyle={[styles.retryButton]}
          textStyle={[styles.retryButtonText]}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingTop: insets.top }]} style={styles.container}>
        <View style={[{direction: i18n.locale === 'ur' ? 'rtl' : 'ltr'}]}>
          <Pressable onPress={handleEdit}>
            <Image
              source={require('../../assets/images/edit-icon-2.png')}
              style={[{ width: 20, height: 20 }]}
            />
          </Pressable>
          <View style={[styles.imageContainer, { padding: 10, alignContent: "center", alignItems: "center", marginTop: 10 }]}>
            <Image
              source={displayPerson.picture ? { uri: displayPerson.picture } : require('../../assets/images/avatar.png')}
              style={[styles.logo]}
            />
          </View>
          <View style={[{ alignContent: "center", alignItems: "center", marginTop: 10 }]}>
            <Text style={[styles.nameStyle, { flex: 1, flexWrap: 'wrap', alignContent: "center", alignItems: "center", justifyContent: "center" }]}>
              {displayPerson.name}
            </Text>
            <View style={[{ flex: 1, flexDirection: "row", alignItems: "center", alignContent: "center" }]}>
              <Image
                source={require('../../assets/images/location-icon-blue.png')}
                style={[{ height: 16, width: 16 }]}
              />
              <Text style={[{ flexWrap: 'wrap' }]}>{displayPerson.address}</Text>
            </View>
          </View>
          <View style={[{ flexDirection: "row", flex: 1 }]}>
            {displayPerson.phone && (
              <CustomButton
                text={i18n.t('call')}
                style={{ margin: 5 }}
                viewStyle={[{ backgroundColor: '#008CFF1A', opacity: 10, borderRadius: 15, alignItems: "center", paddingHorizontal: 10, paddingVertical: 5 }]}
                textStyle={[{ color: 'black' }]}
                iconImage={require("../../assets/images/phone-icon.png")}
                onPress={handleCall}
              />
            )}
            {displayPerson.whatsApp && (
              <CustomButton
                text={i18n.t('whatsapp')}
                style={{ margin: 5 }}
                viewStyle={[{ backgroundColor: '#008CFF1A', opacity: 10, borderRadius: 15, alignItems: "center", paddingHorizontal: 10, paddingVertical: 5 }]}
                textStyle={[{ color: 'black' }]}
                iconImage={require("../../assets/images/whatsapp-icon.png")}
                onPress={handleWhatsApp}
              />
            )}
            {displayPerson.sms && (
              <CustomButton
                text={i18n.t('sms')}
                style={{ margin: 5 }}
                viewStyle={[{ backgroundColor: '#008CFF1A', opacity: 10, borderRadius: 15, alignItems: "center", paddingHorizontal: 10, paddingVertical: 5 }]}
                textStyle={[{ color: 'black' }]}
                iconImage={require("../../assets/images/sms-icon.png")}
                onPress={handleSMS}
              />
            )}
          </View>
          <CustomButton
            text={i18n.t('transfer')}
            style={{ margin: 5 }}
            viewStyle={[{ width: 80, backgroundColor: '#008CFF1A', opacity: 10, borderRadius: 15, alignItems: "center", paddingHorizontal: 10, paddingVertical: 5 }]}
            textStyle={[{ color: 'black' }]}
            iconImage={require("../../assets/images/transfer-icon.png")}
            onPress={handleTransfer}
          />
          <View style={[{ flexDirection: "column", flex: 1 }]}>
            <Text style={[styles.textItem]}>
              {i18n.t("parent")}: {displayPerson.parent || '-'}
            </Text>
            <Text style={[styles.textItem]}>
              {i18n.t("dob")}: {displayPerson.dob || '-'}              
            </Text>
            <Text style={[styles.textItem]}>
              {i18n.t("cnic")}: {displayPerson.cnic || '-'}
            </Text>
            <Text style={[styles.textItem]}>
              {i18n.t("unit")}: {displayPerson.unit || '-'}
            </Text>
            <Text style={[styles.textItem]}>
              {i18n.t("status")}: {displayPerson.status || '-'}
            </Text>
            <Text style={[styles.textItem]}>
              {i18n.t("phone_number")}: {displayPerson.phone || '-'}
            </Text>
            <Text style={[styles.textItem]}>
              {i18n.t("whatsapp_number")}: {displayPerson.whatsApp || '-'}
            </Text>
            <Text style={[styles.textItem]}>
              {i18n.t("email")}: {displayPerson.email || '-'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    // Background styling
  },
  logo: {
    width: 122,
    height: 122,
    resizeMode: 'contain',
    borderColor: '#0BA241',
    borderWidth: 1,
    borderRadius: 65,
    padding: 2,
    margin: 10
  },
  nameStyle: {
    color: '#008CFF',
    fontSize: 28,
  },
  textItem: {
    color: '#000000',
    fontFamily: "JameelNooriNastaleeq",
    fontSize: 16,
    marginVertical: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error || 'red',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
