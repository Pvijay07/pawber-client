import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';

// Screens
// ... (imports remain the same)
import BookingFlow from './src/screens/BookingFlow';
import Pets from './src/screens/Pets';
import Chat from './src/screens/Chat';
import Profile from './src/screens/Profile';
import LiveTracking from './src/screens/LiveTracking';
import Notifications from './src/screens/Notifications';
import Addresses from './src/screens/Addresses';
import Auth from './src/screens/Auth';
import Splash from './src/screens/Splash';
import PrivacyPolicy from './src/screens/PrivacyPolicy';
import TermsConditions from './src/screens/TermsConditions';
import ServiceBidding from './src/screens/ServiceBidding';
import PackageSelection from './src/screens/PackageSelection';
import Bookings from './src/screens/Bookings';
import Events from './src/screens/Events';
import Onboarding from './src/screens/Onboarding';
import ForgotPassword from './src/screens/ForgotPassword';
import Wallet from './src/screens/Wallet';
import GroomingBooking from './src/screens/GroomingBooking';

// Navigation
import MainTabNavigator from './src/navigation/MainTabNavigator';

const Stack = createNativeStackNavigator();
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    primary: '#14b8a6',
    border: '#e2e8f0',
  },
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const nextSession = data.session;
      if (!isMounted) return;
      setSession(nextSession);
      setTimeout(() => {
        if (isMounted) setIsLoading(false);
      }, 2500);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession: Session | null) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <Splash />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#f8fafc' },
          }}
        >
          {session ? (
            <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen name="GroomingBooking" component={GroomingBooking} />
              <Stack.Screen name="Onboarding" component={Onboarding} />
              <Stack.Screen name="BookingFlow" component={BookingFlow} />
              <Stack.Screen name="PackageSelection" component={PackageSelection} />
              <Stack.Screen name="ServiceBidding" component={ServiceBidding} />
              <Stack.Screen name="Pets" component={Pets} />
              <Stack.Screen name="Chat" component={Chat} />
              <Stack.Screen name="LiveTracking" component={LiveTracking} />
              <Stack.Screen name="Notifications" component={Notifications} />
              <Stack.Screen name="Addresses" component={Addresses} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
              <Stack.Screen name="TermsConditions" component={TermsConditions} />
            </>
          ) : (
            <>
              <Stack.Screen name="Auth" component={Auth} />
              <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            </>
          )}
        </Stack.Navigator>
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

