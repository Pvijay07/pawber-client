import { api } from './api';
import { Provider, Booking } from '../shared/types';

export interface ProviderRegistration {
    business_name: string;
    category: string;
    description?: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
    service_radius_km?: number;
}

export interface ProviderUpdate {
    business_name?: string;
    description?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    service_radius_km?: number;
    is_online?: boolean;
}

export const providersApi = {
    list: (params?: { category?: string; city?: string; limit?: number; offset?: number }) => {
        const query = new URLSearchParams();
        if (params?.category) query.set('category', params.category);
        if (params?.city) query.set('city', params.city);
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));
        const qs = query.toString();
        return api.get<{ providers: Provider[] }>(`/providers${qs ? `?${qs}` : ''}`);
    },

    getById: (id: string) =>
        api.get<{ provider: Provider }>(`/providers/${id}`),

    register: (data: ProviderRegistration) =>
        api.post<{ provider: Provider; message: string }>('/providers/register', data),

    updateMe: (data: ProviderUpdate) =>
        api.patch<{ provider: Provider }>('/providers/me', data),

    uploadDocument: (data: { document_type: string; file_url: string }) =>
        api.post<{ document: any }>('/providers/me/documents', data),

    getMyBookings: (status?: string) =>
        api.get<{ bookings: Booking[] }>(`/providers/me/bookings${status ? `?status=${status}` : ''}`),

    addService: (data: { service_id: string; base_price: number }) =>
        api.post<{ provider_service: any }>('/providers/me/services', data),
};
