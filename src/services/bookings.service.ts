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
        [key: string]: any;
    }) => api.post<{ booking: Booking }>('/bookings', data),

    cancel: (id: string, reason?: string) =>
        api.post<{ booking: Booking; message: string }>(`/bookings/${id}/cancel`, { reason }),

    deleteBooking: (id: string) =>
        api.delete<{ success: boolean; message: string; booking: Booking }>(`/bookings/${id}`),

    updateStatus: (id: string, status: string) =>
        api.patch<{ booking: Booking }>(`/bookings/${id}/status`, { status }),

    confirmPayment: (id: string) =>
        api.post<{ success: true; data: { booking: Booking } }>(`/bookings/${id}/confirm`),

    // ─── Bid Flow ────────────────────────────────
    
    getBids: (bookingId: string) =>
        api.get<{ bids: any[] }>(`/bookings/${bookingId}/bids`),

    selectBid: (bookingId: string, bidId: string) =>
        api.post<{ booking: Booking }>(`/bookings/${bookingId}/select-bid`, { bid_id: bidId }),

    deselectBid: (bookingId: string) =>
        api.post<{ booking: Booking }>(`/bookings/${bookingId}/deselect-bid`),


    releasePayment: (id: string) =>
        api.post<any>(`/bookings/${id}/release-payment`),

    approveGrooming: (id: string) =>
        api.post<any>(`/bookings/${id}/grooming/approve`),

    handleIncompleteWalkPackage: (id: string, option: 'reschedule' | 'extend' | 'refund_cash' | 'refund_credit', details?: { newDate?: string; extensionDays?: number }) =>
        api.post<any>(`/bookings/${id}/walk/incomplete`, { option, details }),

    resolveMissedWalk: (id: string, resolutionType: 'reschedule' | 'extend' | 'refund' | 'credits', newDate?: string) =>
        api.post<any>(`/bookings/${id}/resolve`, { resolutionType, newDate }),
};
