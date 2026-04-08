// ─── Auth Types ─────────────────────────────────
export interface User {
    id: string;
    email: string;
    role: 'client' | 'provider' | 'admin';
    full_name: string;
    phone?: string;
    avatar_url?: string;
}

export interface Session {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
}

export interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

// ─── Pet Types ──────────────────────────────────
export interface Pet {
    id: string;
    user_id: string;
    name: string;
    type?: string;
    breed?: string;
    age?: number;
    weight?: number;
    medical_notes?: string;
    vaccination_status?: string;
    image_url?: string;
    created_at: string;
}

// ─── Service Types ──────────────────────────────
export interface ServiceCategory {
    id: string;
    name: string;
    icon_url?: string;
    sort_order: number;
    is_active: boolean;
}

export interface Service {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    category_id: string;
    category?: ServiceCategory;
    is_active: boolean;
    created_at: string;
}

export interface ServicePackage {
    id: string;
    service_id: string;
    package_name: string;
    price: number;
    duration_minutes?: number;
    features?: string[];
    sort_order?: number;
    is_instant_available: boolean;
    is_scheduled_available: boolean;
}

export interface Addon {
    id: string;
    service_id: string;
    name: string;
    price: number;
    duration_minutes?: number;
    is_active: boolean;
}

export interface ServiceDetail extends Service {
    packages: ServicePackage[];
    addons: Addon[];
}

// ─── Booking Types ──────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type BookingType = 'instant' | 'scheduled';

export interface Booking {
    id: string;
    user_id: string;
    service_id: string;
    package_id: string;
    provider_id?: string;
    booking_type: BookingType;
    booking_date: string;
    slot_id?: string;
    total_amount: number;
    status: BookingStatus;
    payment_status?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    created_at: string;
    completed_at?: string;
    // Joined relations
    service?: { name: string; description?: string; image_url?: string };
    package?: { package_name: string; price: number; duration_minutes?: number; features?: string[] };
    provider?: { business_name: string; rating?: number };
    booking_pets?: { pet: Pet }[];
    booking_addons?: { addon: { id: string; name: string }; price: number }[];
}

// ─── Wallet Types ───────────────────────────────
export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    auto_recharge: boolean;
    auto_recharge_threshold?: number;
    auto_recharge_amount?: number;
}

export type TransactionType = 'credit' | 'debit' | 'refund';

export interface WalletTransaction {
    id: string;
    wallet_id: string;
    type: TransactionType;
    amount: number;
    description: string;
    reference_id?: string;
    reference_type?: string;
    created_at: string;
}

// ─── Event Types ────────────────────────────────
export interface PetEvent {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    event_date: string;
    location?: string;
    max_attendees?: number;
    price?: number;
    is_active: boolean;
    tickets_sold?: number;
    spots_remaining?: number;
}

export interface EventTicket {
    id: string;
    event_id: string;
    user_id: string;
    qr_code: string;
    status: 'valid' | 'used' | 'cancelled' | 'expired';
    event?: Pick<PetEvent, 'title' | 'event_date' | 'location' | 'image_url'>;
    created_at: string;
}

// ─── Notification Types ─────────────────────────
export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    data?: Record<string, any>;
    created_at: string;
}

// ─── Review Types ───────────────────────────────
export interface Review {
    id: string;
    booking_id: string;
    user_id: string;
    provider_id: string;
    rating: number;
    comment?: string;
    reply?: string;
    reply_at?: string;
    created_at: string;
    user?: { full_name: string; avatar_url?: string };
}

// ─── Provider Types ─────────────────────────────
export interface Provider {
    id: string;
    user_id: string;
    business_name: string;
    description?: string;
    address?: string;
    rating?: number;
    is_verified: boolean;
}

// ─── API Response Types ─────────────────────────
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        details?: any;
    };
    meta?: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

// ─── Navigation Types ───────────────────────────
export type Screen =
    | 'splash'
    | 'onboarding'
    | 'auth'
    | 'forgotPassword'
    | 'home'
    | 'bookings'
    | 'events'
    | 'wallet'
    | 'profile'
    | 'notifications'
    | 'pets'
    | 'bookingFlow'
    | 'packageSelection'
    | 'liveTracking'
    | 'addresses'
    | 'privacyPolicy'
    | 'termsConditions'
    | 'serviceBidding'
    | 'chat'
    | 'providerDashboard'
    | 'adminPanel';

export interface NavigateOptions {
    serviceId?: string;
    packageId?: string;
    addonIds?: string[];
    bookingId?: string;
}
