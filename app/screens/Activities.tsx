import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Text, View, TouchableOpacity } from 'react-native';
import i18n from '../i18n';
import CustomButton from '../components/CustomButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, lightThemeStyles, darkThemeStyles } from '../_layout';
import { Appearance, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Import the Ionicons for the back arrow
import { router } from 'expo-router';

export default function Activities() {
  const insets = useSafeAreaInsets();

  let scheduleForToday = [
    { "eventName": "Event 1", "date": "2025-02-23", "startTime": "10:00 AM", "endTime": "12:00 PM", "location": "Room 101", "description": "Description for Event 1", "type": "type-1" },
    { "eventName": "Event 2", "date": "2025-02-23", "startTime": "2:00 PM", "endTime": "4:00 PM", "location": "Room 102", "description": "Description for Event 2", "type": "type-2" },
    { "eventName": "Event 3", "date": "2025-02-23", "startTime": "5:00 PM", "endTime": "7:00 PM", "location": "Room 103", "description": "Description for Event 3", "type": "type-3" },
    { "eventName": "Event 4", "date": "2025-02-23", "startTime": "8:00 PM", "endTime": "10:00 PM", "location": "Room 104", "description": "Description for Event 4", "type": "type-4" },
    { "eventName": "Event 5", "date": "2025-02-23", "startTime": "11:00 PM", "endTime": "1:00 AM", "location": "Room 105", "description": "Description for Event 5", "type": "type-5" }, 
    { "eventName": "Event 1", "date": "2025-02-23", "startTime": "10:00 AM", "endTime": "12:00 PM", "location": "Room 101", "description": "Description for Event 1", "type": "type-1" },
    { "eventName": "Event 2", "date": "2025-02-23", "startTime": "2:00 PM", "endTime": "4:00 PM", "location": "Room 102", "description": "Description for Event 2", "type": "type-2" },
    { "eventName": "Event 3", "date": "2025-02-23", "startTime": "5:00 PM", "endTime": "7:00 PM", "location": "Room 103", "description": "Description for Event 3", "type": "type-3" },
    { "eventName": "Event 4", "date": "2025-02-23", "startTime": "8:00 PM", "endTime": "10:00 PM", "location": "Room 104", "description": "Description for Event 4", "type": "type-4" },
    { "eventName": "Event 5", "date": "2025-02-23", "startTime": "11:00 PM", "endTime": "1:00 AM", "location": "Room 105", "description": "Description for Event 5", "type": "type-5" }, 
    { "eventName": "Event 1", "date": "2025-02-23", "startTime": "10:00 AM", "endTime": "12:00 PM", "location": "Room 101", "description": "Description for Event 1", "type": "type-1" },
    { "eventName": "Event 2", "date": "2025-02-23", "startTime": "2:00 PM", "endTime": "4:00 PM", "location": "Room 102", "description": "Description for Event 2", "type": "type-2" },
    { "eventName": "Event 3", "date": "2025-02-23", "startTime": "5:00 PM", "endTime": "7:00 PM", "location": "Room 103", "description": "Description for Event 3", "type": "type-3" },
    { "eventName": "Event 4", "date": "2025-02-23", "startTime": "8:00 PM", "endTime": "10:00 PM", "location": "Room 104", "description": "Description for Event 4", "type": "type-4" },
    { "eventName": "Event 5", "date": "2025-02-23", "startTime": "11:00 PM", "endTime": "1:00 AM", "location": "Room 105", "description": "Description for Event 5", "type": "type-5" }, 
    { "eventName": "Event 1", "date": "2025-02-23", "startTime": "10:00 AM", "endTime": "12:00 PM", "location": "Room 101", "description": "Description for Event 1", "type": "type-1" },
    { "eventName": "Event 2", "date": "2025-02-23", "startTime": "2:00 PM", "endTime": "4:00 PM", "location": "Room 102", "description": "Description for Event 2", "type": "type-2" },
    { "eventName": "Event 3", "date": "2025-02-23", "startTime": "5:00 PM", "endTime": "7:00 PM", "location": "Room 103", "description": "Description for Event 3", "type": "type-3" },
    { "eventName": "Event 4", "date": "2025-02-23", "startTime": "8:00 PM", "endTime": "10:00 PM", "location": "Room 104", "description": "Description for Event 4", "type": "type-4" },
    { "eventName": "Event 5", "date": "2025-02-23", "startTime": "11:00 PM", "endTime": "1:00 AM", "location": "Room 105", "description": "Description for Event 5", "type": "type-5" }    
]

// Get the current date
const currentDate = new Date();

// Format the date as "February 23, 2025"
const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingTop: insets.top }]} style={styles.container}>
        <Ionicons
          name="arrow-back" // The back arrow icon
          size={24}
          color="black" // You can customize the color here
          style={{ marginLeft: 15 }} // Adjust the position of the button
          onPress={() => router.back()} // Navigate to Home screen on press
        />
        <View>
          <Text>{i18n.t('activities')}</Text>
        </View>

        <ScrollView>
          {scheduleForToday.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => console.log(item)}
            >
              <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 }}>
                <Text>{index + 1}</Text>
                <Text>{item.eventName}</Text>
                <Text>{item.date}</Text>
                <Text>{item.startTime}</Text>
                {/* <Text>{item.endTime}</Text> */}
                <Text>{item.location}</Text>
                {/* <Text>{item.description}</Text> */}
                {/* <Text>{item.type}</Text> */}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  }
});
