import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const runtimeEnv: Record<string, string | undefined> = typeof process !== 'undefined'
    ? (process.env as Record<string, string | undefined>)
    : {};
const supabaseUrl =
    runtimeEnv.EXPO_PUBLIC_SUPABASE_URL ||
    'https://your-project.supabase.co';
const supabaseAnonKey =
    runtimeEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'your-anon-key';

export const isSupabaseConfigured = Boolean(
    supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')
);

const isLocalDev = supabaseUrl.includes('localhost') || supabaseUrl.includes('10.0.2.2') || !isSupabaseConfigured;

export const supabase = isLocalDev 
    ? {
        auth: {
            getSession: async () => ({ data: { session: JSON.parse(await AsyncStorage.getItem('supabase.auth.token') || 'null') }, error: null }),
            setSession: async (session: any) => {
                await AsyncStorage.setItem('supabase.auth.token', JSON.stringify(session));
                // Trigger any listeners (simulated)
                if (authListeners.length > 0) authListeners.forEach(l => l('SIGNED_IN', session));
                return { data: { session }, error: null };
            },
            onAuthStateChange: (callback: any) => {
                authListeners.push(callback);
                return { data: { subscription: { unsubscribe: () => {
                    const idx = authListeners.indexOf(callback);
                    if (idx > -1) authListeners.splice(idx, 1);
                } } } };
            },
            signOut: async () => {
                await AsyncStorage.removeItem('supabase.auth.token');
                if (authListeners.length > 0) authListeners.forEach(l => l('SIGNED_OUT', null));
                return { error: null };
            }
        },
        from: (table: string) => ({
            select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
            insert: () => ({ error: null }),
            update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
        })
    } as any
    : createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    });

const authListeners: any[] = [];
