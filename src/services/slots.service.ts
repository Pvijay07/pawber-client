import { api } from './api';

export interface ProviderSlot {
    id: string;
    provider_id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    booked_count: number;
    is_blocked: boolean;
    is_available?: boolean;
}

export const slotsApi = {
    getByProvider: (providerId: string, params?: { date?: string; from_date?: string; to_date?: string }) => {
        const query = new URLSearchParams();
        if (params?.date) query.set('date', params.date);
        if (params?.from_date) query.set('from_date', params.from_date);
        if (params?.to_date) query.set('to_date', params.to_date);
        const qs = query.toString();
        return api.get<{ slots: ProviderSlot[] }>(`/slots/provider/${providerId}${qs ? `?${qs}` : ''}`);
    },

    lock: (slotId: string) =>
        api.post<{ lock: any; expires_at: string; expires_in_seconds: number; message: string }>(`/slots/${slotId}/lock`),

    releaseLock: (slotId: string) =>
        api.delete<{ message: string }>(`/slots/${slotId}/lock`),

    getMySlots: (params?: { date?: string; from_date?: string; to_date?: string }) => {
        const query = new URLSearchParams();
        if (params?.date) query.set('date', params.date);
        if (params?.from_date) query.set('from_date', params.from_date);
        if (params?.to_date) query.set('to_date', params.to_date);
        const qs = query.toString();
        return api.get<{ slots: ProviderSlot[] }>(`/slots/me${qs ? `?${qs}` : ''}`);
    },

    bulkCreate: (slots: { slot_date: string; start_time: string; end_time: string; capacity?: number }[]) =>
        api.post<{ slots: ProviderSlot[]; count: number }>('/slots/bulk', { slots }),

    toggleBlock: (id: string) =>
        api.patch<{ slot: ProviderSlot }>(`/slots/${id}/block`),
};
