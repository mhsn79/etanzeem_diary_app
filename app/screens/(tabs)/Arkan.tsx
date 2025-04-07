import React from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Text, View, TouchableOpacity, Pressable, FlatList } from 'react-native';
import i18n from '../../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RukunCard from '@/app/components/RukunCard';
import CustomButton from '@/app/components/CustomButton';
import Spacer from '@/app/components/Spacer';
import CustomTextInput from '@/app/components/CustomTextInput';
import { RukunData } from '@/app/models/RukunData';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useNavigationState } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/src/types/RootStackParamList";
import { arkanData } from '@/app/data/arkan';

function filter(filterFor: string) {

}

export default function Arkan() {
  const insets = useSafeAreaInsets();
  const state = useNavigationState((state) => state);
  
  // Set up navigation
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleAddNewRukun = () => {
    let r: RukunData = { id: 0, name: '', address: '', phone: '', whatsApp: '', sms: '', picture: '' };
    navigation.navigate('screens/RukunAddEdit', { rukun: r });
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingTop: insets.top, direction: i18n.locale === 'ur' ? 'rtl' : 'ltr' }]} style={styles.container}>

        <View style={[{ flexDirection: 'row', alignContent: 'center', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }]}>
          {/* Extra view grouping just for the sake of alignment and spacing */}
          <View style={[{ flexDirection: 'row', alignContent: 'center', alignItems: 'center'}]}>
            <Image
              source={require('@/assets/images/multiple-users.png')}
              style={{ width: 44, height: 44 }}
            />
            <Text style={[{ paddingStart: 10, fontSize: 22 }]}>{arkanData.length}</Text>
            <Text style={[{ paddingEnd: 10, fontSize: 18 }]}>{i18n.t('arkan')}</Text>
          </View>
          <CustomButton
            text={i18n.t('add_new_rukun')}
            style={{ marginStart: 10, borderColor: '#008CFF', borderRadius: 50 }}
            viewStyle={[{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#008CFF', borderRadius: 50, alignContent: 'center', alignItems: 'center' }]} textStyle={[{ color: 'white', fontSize: 16, paddingStart: 10 }]}
            iconImage={require("@/assets/images/add-icon.png")}
            onPress={handleAddNewRukun} />
        </View>
        <View style={[{ flexDirection: 'row', backgroundColor: '#F7F7F7', borderRadius: 50, height: 48, alignContent: 'center', alignItems: 'center', marginHorizontal: 0, paddingHorizontal: 10 }]}>
          <Image
            source={require('@/assets/images/magnifier.png')}
            style={{ width: 20, height: 20, marginStart: 10, marginEnd: 10 }}
          />
          {/* <Text>{i18n.t('search_by_name_or_id')}</Text> */}
          <CustomTextInput
            placeholder={i18n.t('search_by_name_or_id')}
            placeholderTextColor={"#2D2327"}
            onChangeText={newText => filter(newText)}
            style={{ flex: 1, padding: 10, fontSize: 16 }}
          />
        </View>
        <FlatList
          data={arkanData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <RukunCard item={item} />}
          contentContainerStyle={styles.listContent}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  }
});
