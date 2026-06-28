import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  Notifications = null;
}

type PushSetupStatus = 'idle' | 'unsupported' | 'denied' | 'registered' | 'error';
export const PUSH_TOKEN_STORAGE_KEY = 'client_expo_push_token';

if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Attempt to get the Expo push token with retry logic for when
 * Firebase is not yet initialized (common on cold start).
 */
async function getExpoPushToken(retries = 3, delayMs = 1500): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) {
    console.log('[Push] Running in emulator, using mock token');
    return 'ExponentPushToken[mock_client_emulator_token]';
  }
  if (!Notifications) {
    console.log('[Push] expo-notifications not available');
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        finalStatus = requested.status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Permission denied');
        return null;
      }

      // Set up Android notification channel
      if (Platform.OS === 'android' && Notifications.AndroidImportance) {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF7A3D',
          sound: 'default',
        });
      }

      const projectId =
        (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
        (Constants as any)?.easConfig?.projectId;

      const tokenResponse = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      console.log('[Push] Token acquired:', tokenResponse.data?.substring(0, 30) + '...');
      return tokenResponse.data;
    } catch (error: any) {
      const isFirebaseError =
        error?.message?.includes('FirebaseApp') ||
        error?.message?.includes('Firebase') ||
        error?.message?.includes('FCM');

      if (isFirebaseError && attempt < retries) {
        console.log(`[Push] Firebase not ready (attempt ${attempt}/${retries}), retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }

      console.log(`[Push] Failed to get token (attempt ${attempt}/${retries}):`, error?.message || error);

      if (attempt === retries) {
        // In development, return a mock token so the app still works
        if (__DEV__) {
          console.log('[Push] Using mock dev token for development');
          return 'ExponentPushToken[mock_client_dev_token]';
        }
        return null;
      }
    }
  }
  return null;
}

async function upsertPushToken(userId: string, token: string): Promise<void> {
  try {
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);
  } catch (error) {
    console.warn('[Push] Failed to save push token to profiles:', error);
  }
}

export function usePushNotifications(userId: string | null | undefined, navigationRef?: any) {
  const [status, setStatus] = useState<PushSetupStatus>('idle');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const setupDone = useRef(false);

  useEffect(() => {
    if (!userId || setupDone.current) return;

    let isActive = true;

    const receivedListener =
      Notifications && Notifications.addNotificationReceivedListener
        ? Notifications.addNotificationReceivedListener((notification: any) => {
            // Handle foreground notification — could show an in-app toast
            console.log('[Push] Notification received in foreground:', notification.request.content.title);
          })
        : { remove: () => {} };

    const responseListener =
      Notifications && Notifications.addNotificationResponseReceivedListener
        ? Notifications.addNotificationResponseReceivedListener((response: any) => {
            const data = response.notification.request.content.data;
            console.log('[Push] Notification tapped:', data);

            if (navigationRef?.isReady()) {
              switch (data?.type) {
                case 'booking_accepted':
                case 'booking_confirmed':
                case 'booking_completed':
                case 'booking':
                  navigationRef.navigate('Main', { screen: 'BookingsTab' });
                  break;
                case 'bid_received':
                  if (data.bookingId) {
                    navigationRef.navigate('ServiceBidding', { bookingId: data.bookingId });
                  } else {
                    navigationRef.navigate('Main', { screen: 'BookingsTab' });
                  }
                  break;
                case 'chat':
                case 'new_message':
                  if (data.thread_id) {
                    navigationRef.navigate('Chat', { threadId: data.thread_id });
                  } else {
                    navigationRef.navigate('Notifications');
                  }
                  break;
                case 'payment':
                case 'payment_received':
                  navigationRef.navigate('Main', { screen: 'WalletTab' });
                  break;
                default:
                  navigationRef.navigate('Notifications');
              }
            }
          })
        : { remove: () => {} };

    const setup = async () => {
      try {
        const token = await getExpoPushToken();
        if (!isActive) return;

        if (!token) {
          setStatus(Platform.OS === 'web' || !Device.isDevice ? 'unsupported' : 'denied');
          return;
        }

        setExpoPushToken(token);
        setStatus('registered');
        setupDone.current = true;
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
        await upsertPushToken(userId, token);
        console.log('[Push] Setup complete. Token saved.');
      } catch (error) {
        if (!isActive) return;
        console.log('[Push] Setup failed:', error);
        setStatus('error');
      }
    };

    setup();

    return () => {
      isActive = false;
      try {
        (receivedListener as any)?.remove?.();
        (responseListener as any)?.remove?.();
      } catch (e) {
        // ignore
      }
    };
  }, [userId, navigationRef]);

  return { status, expoPushToken };
}
