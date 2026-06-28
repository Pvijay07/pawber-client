import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSocket } from '../hooks/useSocket';

interface GlobalSocketHandlerProps {
    navigationRef: any;
}

export default function GlobalSocketHandler({ navigationRef }: GlobalSocketHandlerProps) {
    const { on } = useSocket();

    useEffect(() => {
        // Handle incoming notifications globally
        const unsubscribe = on('new_notification', async (notification: any) => {
            if (!notification) return;

            const { title, message: body, type, data } = notification;

            // Check if navigation container is ready
            if (!navigationRef.isReady()) return;

            const currentRoute = navigationRef.getCurrentRoute();
            const currentScreen = currentRoute?.name;

            // 1. If it's a chat message
            if (type === 'chat' || data?.type === 'chat') {
                const isChatOpen = currentScreen === 'Chat';
                const currentThreadId = (currentRoute?.params as any)?.threadId;
                const incomingThreadId = data?.thread_id;

                // If the user is already looking at this exact chat thread, do not alert
                if (isChatOpen && currentThreadId === incomingThreadId) {
                    return;
                }
            }

            // 2. If it's the general notifications screen, do not alert as it auto-refreshes
            if (currentScreen === 'Notifications') {
                return;
            }

            // Trigger local native notification banner
            try {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: title || 'New Update 🐾',
                        body: body || '',
                        data: data || {},
                        sound: true,
                    },
                    trigger: null, // deliver immediately
                });
            } catch (err) {
                console.warn('[GlobalSocketHandler] Failed to schedule local notification:', err);
            }
        });

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [on, navigationRef]);

    return null;
}
