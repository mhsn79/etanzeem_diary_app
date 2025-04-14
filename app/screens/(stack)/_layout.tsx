import { Stack, useRouter } from 'expo-router';
import { COLORS } from '../../constants/theme';
import Header from '../../components/Header';

export default function StackLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        header: ({ navigation, route }) => (
          <Header 
            title="E-Tanzeem"
            onBack={() => navigation.goBack()}
            showBack={true}
          />
        ),
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      {/* Reports Related Screens */}
      <Stack.Screen 
        name="ReportsScreen" 
        options={{ 
          headerShown: false,
  
        }} 
      />
      <Stack.Screen 
        name="AllReportsScreen" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="CreateReportScreen" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="SubmittedReportScreen" 
        options={{ 
          headerShown: false,
  
        }} 
      />

      {/* Income Related Screens */}
      <Stack.Screen 
        name="Income" 
        options={{ 
          headerShown: true,
          header: ({ navigation }) => (
            <Header 
              title="آمدنی"
              onBack={() => navigation.goBack()}
              showBack={true}
            />
          )
        }} 
      />

      {/* Meetings Related Screens */}
      <Stack.Screen 
        name="Meetings" 
        options={{ 
          headerShown: true,
          header: ({ navigation }) => (
            <Header 
              title="اجلاسات"
              onBack={() => navigation.goBack()}
              showBack={true}
            />
          )
        }} 
      />

      {/* Profile Related Screens */}
      <Stack.Screen 
        name="ProfileView" 
        options={{ 
          headerShown: true,
          header: ({ navigation }) => (
            <Header 
              title="پروفائل"
              onBack={() => navigation.goBack()}
              showBack={true}
            />
          )
        }} 
      />
      <Stack.Screen 
        name="ProfileEdit" 
        options={{ 
          headerShown: true,
          header: ({ navigation }) => (
            <Header 
              title="پروفائل میں ترمیم کریں"
              onBack={() => navigation.goBack()}
              showBack={true}
            />
          )
        }} 
      />

      {/* Unit Related Screens */}
      <Stack.Screen 
        name="UnitSelection" 
        options={{ 
          headerShown: true,
          header: ({ navigation }) => (
            <Header 
              title="تنظیمی ہیئت"
              onBack={() => navigation.goBack()}
              showBack={true}
            />
          )
        }} 
      />
      <Stack.Screen 
        name="Workforce" 
        options={{ 
          headerShown: true,
          header: ({ navigation }) => (
            <Header 
              title="افرادی قوت"
              onBack={() => navigation.goBack()}
              showBack={true}
            />
          )
        }} 
      />

      {/* Rukun Related Screens */}
      <Stack.Screen 
        name="RukunView" 
        options={{ 
          headerShown: true,
          header: ({ navigation }) => (
            <Header 
              title="ارکان"
              onBack={() => navigation.goBack()}
              showBack={true}
            />
          )
        }} 
      />
      <Stack.Screen 
        name="RukunAddEdit" 
        options={{ 
          headerShown: true,
          header: ({ navigation }) => (
            <Header 
              title="رکن شامل کریں"
              onBack={() => navigation.goBack()}
              showBack={true}
            />
          )
        }} 
      />
    </Stack>
  );
} 