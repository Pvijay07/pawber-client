const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://pawber.onrender.com';
export const API_BASE_URL = `${BASE}/api`;

export const APP_NAME = 'Pawber';
export const APP_VERSION = '2.0.0';

// Screen lists for navigation
export const MAIN_TAB_SCREENS = ['home', 'bookings', 'events', 'wallet', 'profile'] as const;
export const AUTH_SCREENS = ['splash', 'auth', 'forgotPassword', 'onboarding'] as const;

// Booking constants
export const INSTANT_SURCHARGE_PERCENT = 15;
export const SLOT_LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Wallet constants
export const MIN_TOPUP_AMOUNT = 100;
export const MAX_TOPUP_AMOUNT = 50000;
