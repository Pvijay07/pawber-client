import { api } from './api';
import { Booking } from '../shared/types';

export const bookingsApi = {
    list: (params?: { status?: string; limit?: number; offset?: number }) => {
        const query = new URLSearchParams();
        if (params?.status) query.set('status', params.status);
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));
        const qs = query.toString();
        return api.get<{ bookings: Booking[] }>(`/bookings${qs ? `?${qs}` : ''}`);
    },

    getById: (id: string) =>
        api.get<{ booking: Booking }>(`/bookings/${id}`),

    create: (data: {
        service_id: string;
        package_id: string;
        booking_type: 'instant' | 'scheduled';
        pet_ids: string[];
        addon_ids?: string[];
        booking_date?: string;
        slot_id?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        notes?: string;
        coupon_code?: string;
        points_to_use?: number;
    }) => api.post<{ booking: Booking }>('/bookings', data),

    cancel: (id: string, reason?: string) =>
        api.post<{ booking: Booking; message: string }>(`/bookings/${id}/cancel`, { reason }),

    updateStatus: (id: string, status: string) =>
        api.patch<{ booking: Booking }>(`/bookings/${id}/status`, { status }),
};
