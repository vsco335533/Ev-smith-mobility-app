import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Zap, Clock, ShieldCheck, User } from 'lucide-react-native';
import { colors } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

// Screens
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { RiderRegistrationScreen } from '../screens/registration/RiderRegistrationScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { VehicleDetailScreen } from '../screens/vehicle/VehicleDetailScreen';
import { BookingRequestScreen } from '../screens/booking/BookingRequestScreen';
import { BookingTimelineScreen } from '../screens/booking/BookingTimelineScreen';
import { RentalAgreementScreen } from '../screens/agreement/RentalAgreementScreen';
import { VehicleHandoverScreen } from '../screens/handover/VehicleHandoverScreen';
import { ActiveBookingScreen } from '../screens/active/ActiveBookingScreen';
import { ExtendBookingScreen } from '../screens/extension/ExtendBookingScreen';
import { FinalSettlementScreen } from '../screens/settlement/FinalSettlementScreen';
import { BookingHistoryScreen } from '../screens/history/BookingHistoryScreen';
import { AdminPortalScreen } from '../screens/admin/AdminPortalScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Fleet',
          tabBarIcon: ({ color, size }) => <Zap color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={BookingHistoryScreen}
        options={{
          tabBarLabel: isSuperAdmin ? 'Rentals' : 'My Rides',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={20} />,
        }}
      />
      {isSuperAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminPortalScreen}
          options={{
            tabBarLabel: 'Operations',
            tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={20} />,
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Auth & Onboarding */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RiderRegistration" component={RiderRegistrationScreen} />

      {/* Main Tabs */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Fleet & Booking Lifecycle */}
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="BookingRequest" component={BookingRequestScreen} />
      <Stack.Screen name="BookingTimeline" component={BookingTimelineScreen} />
      <Stack.Screen name="RentalAgreement" component={RentalAgreementScreen} />
      <Stack.Screen name="VehicleHandover" component={VehicleHandoverScreen} />
      <Stack.Screen name="ActiveBooking" component={ActiveBookingScreen} />
      <Stack.Screen name="ExtendBooking" component={ExtendBookingScreen} />
      <Stack.Screen name="FinalSettlement" component={FinalSettlementScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};
