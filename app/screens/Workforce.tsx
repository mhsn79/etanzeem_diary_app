import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ScrollView, View, Text, Image, Pressable, ModalProps, Dimensions } from 'react-native';
import Modal from 'react-native-modal'
import { Link } from 'expo-router';
import EditIcon from '../../assets/images/edit-icon.svg'
import PlusIcon from '../../assets/images/plus-icon.svg'
import MinusIcon from '../../assets/images/minus-icon.svg'
import ModalCloseIcon from '../../assets/images/modal-close-icon.svg'
import CustomButton from '../components/CustomButton';

interface EditModalProps extends ModalProps {
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  type: string;
  currentValue: number;
  setValue: React.Dispatch<React.SetStateAction<number>>;
}

function EditModal({ visible, setVisible, title, type, currentValue, setValue}: EditModalProps) {
  const [addedValue, setAddedValue] = useState(0);
  return (
    <Modal
      isVisible={visible}
      animationIn={"zoomIn"}
      animationOut={"zoomOut"}
      useNativeDriver={true}
      coverScreen={true}
      onBackdropPress={() => setVisible(false)}
      onBackButtonPress={() => setVisible(false)}
      statusBarTranslucent={true}
      backdropOpacity={0.2}
      deviceHeight={Dimensions.get('screen').height}
      style={{margin: 0}}
    >
        <View style={styles.modal}>
          <Pressable onPress={() => setVisible(false)} style={styles.modalCloseIcon}><ModalCloseIcon /></Pressable>
          <Text style={styles.blueHeading}>{title}</Text>
          <View style={styles.modalField1}>
            <Text style={styles.detailText}>موجودہ {type}</Text>
            <Text style={styles.detailNum}>{currentValue}</Text>
          </View>
          <View style={styles.modalField2}>
            <Text style={styles.detailText}>نئے شامل کردہ {type}</Text>
            <Pressable onPress={() => setAddedValue(addedValue == 0 ? 0 : addedValue-5)} style={styles.modalIcons}><MinusIcon/></Pressable>
            <Text style={{fontSize: 16, marginLeft: "auto"}}>{addedValue}</Text>
            <Pressable onPress={() => setAddedValue(addedValue+5)} style={styles.modalIcons}><PlusIcon/></Pressable>
          </View>
          <View style={styles.modalField1}>
            <Text style={styles.detailText}>کل {type}</Text>
            <Text style={styles.detailNum}>{currentValue + addedValue}</Text>
          </View>
          <CustomButton
            text={'اپڈیٹ کریں'}
            viewStyle={[]}
            textStyle={[]}
            onPress={() => {
              setValue(currentValue + addedValue);
              setAddedValue(0);
              setVisible(false);
            }}
          />
        </View>
    </Modal>
  );
}

export default function Workforce() {
  //TODO: initialize these states after fetching from directus
  const [menKarkunan, setMenKarkunan] = useState(50);
  const [menMembers, setMenMembers] = useState(500);
  const [womenArkan, setWomenArkan] = useState(50);
  const [womenKarkunan, setWomenKarkunan] = useState(500);
  const [womenMembers, setWomenMembers] = useState(50);
  const [womenYouthMembers, setWomenYouthMembers] = useState(500);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    type: "",
    currentValue: 0,
    setValue: setMenKarkunan
  });

  const showModal = (title: string, type: string, currentValue: number, setValue: React.Dispatch<React.SetStateAction<number>>) => {
    setModalConfig({
      title,
      type,
      currentValue,
      setValue
    });
    setModalVisible(true);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1 }]} style={styles.container}>

        <EditModal
          visible={modalVisible}
          setVisible={setModalVisible}
          title={modalConfig.title}
          type={modalConfig.type}
          currentValue={modalConfig.currentValue}
          setValue={modalConfig.setValue}
        />

        <View style={styles.topContainer}>
          <Text style={styles.topText}>افرادی قوت</Text>
          <View style={styles.quwatContainer}>
            <View style={styles.quwatBox}>
              <Image source={require('../../assets/images/green-arkan-icon.png')} style={styles.quwatIcon}/>
              <Text style={{ fontSize: 22 }}>13</Text>
              <Text style={styles.quwatText}>کل اضافہ اور کمی</Text>
            </View>
            <View style={styles.quwatBox}>
              <Image source={require('../../assets/images/red-target-icon.png')} style={styles.quwatIcon}/>
              <Text style={{ fontSize: 22 }}>2341</Text>
              <Text style={styles.quwatText}>سالانہ ہدف</Text>
            </View>
            <View style={styles.quwatBox}>
              <Image source={require('../../assets/images/yellow-arkan-icon.png')} style={styles.quwatIcon}/>
              <Text style={{ fontSize: 22 }}>540</Text>
              <Text style={styles.quwatText}>کل ارکان</Text>
            </View>
          </View>
          <Link href={"/screens/Arkan"} style={styles.arkanLink}>View List of Arkan</Link>
        </View>
        <View style={styles.bottomContainer}>
          <Text style={styles.blueHeading}>مرد امیدواران کی تعداد</Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>کارکنان کی تعداد</Text>
            <Text style={styles.detailNum}>{menKarkunan}</Text>
            <Pressable style={styles.editIcon} onPress={() =>  showModal('کارکنان کی تعداد', 'کارکنان', menKarkunan, setMenKarkunan)}><EditIcon/></Pressable>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>ممبران کی تعداد</Text>
            <Text style={styles.detailNum}>{menMembers}</Text>
            <Pressable style={styles.editIcon} onPress={() =>  showModal('ممبران کی تعداد', 'ممبران', menMembers, setMenMembers)}><EditIcon/></Pressable>
          </View>
          <Text style={styles.blueHeading}>خواتین امیدواران کی تعداد</Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>ارکان</Text>
            <Text style={styles.detailNum}>{womenArkan}</Text>
            <Pressable style={styles.editIcon} onPress={() =>  showModal('ارکان', 'ارکان', womenArkan, setWomenArkan)}><EditIcon/></Pressable>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>کارکنان</Text>
            <Text style={styles.detailNum}>{womenKarkunan}</Text>
            <Pressable style={styles.editIcon} onPress={() =>  showModal('کارکنان', 'کارکنان', womenKarkunan, setWomenKarkunan)}><EditIcon/></Pressable>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>ممبران</Text>
            <Text style={styles.detailNum}>{womenMembers}</Text>
            <Pressable style={styles.editIcon} onPress={() =>  showModal('ممبران', 'ممبران', womenMembers, setWomenMembers)}><EditIcon/></Pressable>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>یوتھ ممبران</Text>
            <Text style={styles.detailNum}>{womenYouthMembers}</Text>
            <Pressable style={styles.editIcon} onPress={() =>  showModal('یوتھ ممبران', 'یوتھ ممبران', womenYouthMembers, setWomenYouthMembers)}><EditIcon/></Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topContainer: {
    backgroundColor: '#008CFF',
    height: "35%",
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    alignItems: 'center',
    padding: 16,
    gap: 16
  },
  topText: {
    fontFamily: "JameelNooriNastaleeq",
    color: "#ffffff",
    fontSize: 20,
  },
  quwatContainer: {
    height: "60%",
    flexDirection: "row-reverse",
    gap: 20,
    marginBottom: 5
  },
  quwatBox: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: "#ffffff",
    width: "30%",
    borderRadius: 15,
    gap: 10
  },
  quwatIcon: {
    width: 50,
    height: 50
  },
  quwatText: {
    fontSize: 18,
    fontFamily: "JameelNooriNastaleeq"
  },
  arkanLink: {
    color: "#ffffff",
    textDecorationLine: "underline",
    fontSize: 14
  },
  bottomContainer: {
    padding: 20
  },
  blueHeading: {
    fontSize: 24,
    color: "#008CFF",
    fontFamily: "JameelNooriNastaleeq"
  },
  detailBox: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: "#EBEBEB",
    borderBottomWidth: 1,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
  },
  detailText: {
    fontSize: 20,
    fontFamily: "JameelNooriNastaleeq"
  },
  detailNum: {
    marginLeft: "auto",
    fontSize: 16,
    margin: 10
  },
  editIcon: {
    padding: 10,
  },
  modal: {
    alignSelf: "center",
    alignItems: "center",
    width: "80%",
    height: "45%",
    backgroundColor: "#ffffff",
    borderRadius: 15,
    borderColor: "#EBEBEB",
    borderWidth: 1,
    padding: 20,
    gap: 20
  },
  modalCloseIcon: {
    position: "absolute",
    left: 0,
    padding: 15,
  },
  modalField1: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#E7E7E7",
    borderRadius: 8,
    padding: 12,
    borderColor: "#EBEBEB",
    borderWidth: 1
  },
  modalField2: {
    flexDirection: "row",
    alignItems: 'center',
    width: "100%",
    backgroundColor: "#F7F7F7",
    borderRadius: 8,
    padding: 12,
    borderColor: "#EBEBEB",
    borderWidth: 1
  },
  modalIcons: {
    marginLeft: "auto",
    padding: 10
  }
});
