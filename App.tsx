import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { Text, TextInput, StyleSheet, LogBox } from 'react-native';

LogBox.ignoreLogs(['ExpoKeepAwake.activate']);
import { supabase } from './src/lib/supabase';
// import * as Notifications from 'expo-notifications';

// Screens
// ... (imports remain the same)
import ResolutionModal from './src/components/ResolutionModal';
import ProviderProfile from './src/screens/ProviderProfile';
import BookingFlow from './src/screens/BookingFlow';
import Pets from './src/screens/Pets';
import Chat from './src/screens/Chat';
import Profile from './src/screens/Profile';
import LiveTracking from './src/screens/LiveTracking';
import NotificationsScreen from './src/screens/Notifications';
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
import AIChatScreen from './src/screens/AIChatScreen';
import ReferralHub from './src/screens/ReferralHub';
import GroomingBooking from './src/screens/GroomingBooking';
import KYCScreen from './src/screens/KYCScreen';
import EditProfile from './src/screens/EditProfile';
import Analytics from './src/screens/Analytics';
// Navigation
import MainTabNavigator from './src/navigation/MainTabNavigator';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  let [fontsLoaded] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
    'Nunito-Black': Nunito_900Black,
  });

  useEffect(() => {
    // Apply default font/scaling globally in effect to avoid side-effects in render
    if ((Text as any).defaultProps == null) {
      (Text as any).defaultProps = {};
    }
    (Text as any).defaultProps.allowFontScaling = false;

    if ((TextInput as any).defaultProps == null) {
      (TextInput as any).defaultProps = {};
    }
    (TextInput as any).defaultProps.allowFontScaling = false;
  }, []);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const nextSession = data.session;
      if (!isMounted) return;
      setSession(nextSession);
      // Wait for session and fake a longer splash for branding
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

  // ALL hooks must be called before ANY return
  // We handle the loading state INSIDE the return to maintain hook consistency
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {(!fontsLoaded || isLoading) ? (
          <Splash />
        ) : (
          <AppContent session={session} />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent({ session }: { session: Session | null }) {
  const { colors, isDark } = useTheme();
  const notificationListener = React.useRef<any>(null);
  const responseListener = React.useRef<any>(null);
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      registerForPushNotificationsAsync(session.user.id);
      setupRealtime(session.user.id);
    }

    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [session]);

  useEffect(() => {
    // Handle notifications while the app is foregrounded
    // try {
    //   notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    //     console.log('Notification received:', notification);
    //   });

    //   // Handle user interaction with a notification
    //   responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    //     const { data } = response.notification.request.content;
    //     console.log('Notification response:', data);
    //     // Redirection logic can be handled here if linking config is not enough
    //   });
    // } catch (e) {
    //   console.warn('Notification listeners could not be initialized (likely Expo Go restriction):', e);
    // }

    return () => {
      // try {
      //   if (notificationListener.current) notificationListener.current.remove();
      //   if (responseListener.current) responseListener.current.remove();
      // } catch (e) {
      //   // Ignore removal errors
      // }
    };
  }, [session]);

  const registerForPushNotificationsAsync = async (userId: string) => {
    // Expo SDK 53+ restriction: Remote notifications don't work in Expo Go on Android
    // Commented out to prevent crash
    /*
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      
      // Update profile with token
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);

      console.log('Push token registered', { userId, token });
    } catch (e: any) {
      console.warn('Push notification registration skipped (Expo Go limitation):', e.message);
    }
    */
  };

  const setupRealtime = (userId: string) => {
    const channel = supabase
      .channel(`user-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload: any) => {
        // Trigger local notification for in-app events
        /*
        Notifications.scheduleNotificationAsync({
          content: {
            title: payload.new.title,
            body: payload.new.message,
            data: payload.new.data,
          },
          trigger: null,
        });
        */
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${userId}`
      }, (payload: any) => {
        // Notify user about booking status changes
        /*
        if (payload.old.status !== payload.new.status) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Booking Updated',
              body: `Your booking status has changed to ${payload.new.status.toUpperCase()}`,
              data: { type: 'booking', id: payload.new.id },
            },
            trigger: null,
          });
        }
        */
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const navigationTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };

  const linking = {
    prefixes: [Linking.createURL('/')],
    config: {
      screens: {
        Main: {
          screens: {
            HomeTab: 'home',
            BookingsTab: 'bookings',
            WalletTab: 'wallet',
          },
        },
        BookingFlow: 'booking/:serviceId',
        AIChatScreen: 'chat',
        ReferralHub: 'referral',
        Notifications: 'notifications',
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme as any} linking={linking as any}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
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
          <Stack.Screen name="ProviderProfile" component={ProviderProfile} />
            <Stack.Screen name="LiveTracking" component={LiveTracking} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Addresses" component={Addresses} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
            <Stack.Screen name="TermsConditions" component={TermsConditions} />
            <Stack.Screen name="AIChatScreen" component={AIChatScreen} />
            <Stack.Screen name="ReferralHub" component={ReferralHub} />
            <Stack.Screen name="KYCScreen" component={KYCScreen} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="Analytics" component={Analytics} />
          </>
        ) : (
          <>
            <Stack.Screen name="Auth" component={Auth} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

