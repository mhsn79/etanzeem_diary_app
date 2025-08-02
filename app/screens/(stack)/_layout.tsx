import { Stack, useRouter } from 'expo-router';
import { COLORS } from '../../constants/theme';
import Header from '../../components/Header';
import { SCREENS } from '@/app/constants/screens';
import { navigationService } from '@/app/services/navigation';
import AuthGuard from '@/app/components/AuthGuard';

export default function StackLayout() {
  const router = useRouter();

  return (
    <AuthGuard requireAuth={true}>
      <Stack
        screenOptions={{
          header: ({ navigation, route }) => (
            <Header 
              title="E-Tanzeem"
              onBack={navigationService.goBack}
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
          name={SCREENS.REPORTS_MANAGEMENT}
          options={{ 
            headerShown: false,
  
          }} 
        />
        <Stack.Screen 
          name={SCREENS.ALL_REPORTS}
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name={SCREENS.CREATE_REPORT}
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name={SCREENS.SUBMITTED_REPORT}
          options={{ 
            headerShown: false,
  
          }} 
        />

        {/* Income Related Screens */}
        <Stack.Screen 
          name={SCREENS.INCOME}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="آمدنی"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />

        {/* Meetings Related Screens */}
        <Stack.Screen 
          name={SCREENS.MEETINGS}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="میٹنگز"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />

        {/* Unit Selection Screen */}
        <Stack.Screen 
          name={SCREENS.UNIT_SELECTION}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="یونٹ سیلیکشن"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />

        {/* Workforce Screen */}
        <Stack.Screen 
          name={SCREENS.WORKFORCE}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="ورک فورس"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />

        {/* Rukun Related Screens */}
        <Stack.Screen 
          name={SCREENS.RUKUN_VIEW}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="رکن کی تفصیل"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />

        <Stack.Screen 
          name={SCREENS.RUKUN_ADD_EDIT}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="رکن شامل کریں/ترمیم کریں"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />

        <Stack.Screen 
          name={SCREENS.RUKAN_DETAILS}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="رکن کی تفصیل"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />

        {/* Profile Related Screens */}
        <Stack.Screen 
          name={SCREENS.PROFILE}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="پروفائل"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />

        <Stack.Screen 
          name={SCREENS.PROFILE_EDIT}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="پروفائل ترمیم کریں"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />

        {/* Activity Related Screens */}
        <Stack.Screen 
          name={SCREENS.ACTIVITY_SCREEN}
          options={{ 
            headerShown: false,
          }} 
        />

        <Stack.Screen 
          name={SCREENS.SCHEDULE_ACTIVITIES_SCREEN}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="سرگرمیاں شیڈول کریں"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />

        {/* Meeting Screen */}
        <Stack.Screen 
          name={SCREENS.MEETING_SCREEN}
          options={{ 
            headerShown: true,
            header: ({ navigation }) => (
              <Header 
                title="میٹنگ"
                onBack={navigationService.goBack}
                showBack={true}
              />
            )
          }} 
        />
      </Stack>
    </AuthGuard>
  );
} 