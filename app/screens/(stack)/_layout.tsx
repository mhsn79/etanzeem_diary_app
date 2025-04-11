import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';
import Header from '@/app/components/Header';

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        
          header: (props) => <Header title="E-Tanzeem" {...props} />,
          headerStyle: {
            backgroundColor: '#1E90FF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          animation: 'slide_from_right',
          animationDuration: 200,
      
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      
      }}
    >
      <Stack.Screen 
        name="ReportsScreen" 
        options={{
          title: 'رپورٹ مینجمنٹ',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AllReportsScreen" 
        options={{
          headerShown: false,
          title: 'تمام رپورٹس دیکھیں',
        }}
      />
    </Stack>
  );
} 