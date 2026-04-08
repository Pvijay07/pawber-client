import { api } from './api';

export interface PetEvent {
    id: string;
    title: string;
    description: string;
    event_date: string;
    location: string;
    image_url?: string;
    price: number;
    max_attendees?: number;
    tickets_sold: number;
    spots_remaining: number | null;
}

export interface EventTicket {
    id: string;
    event_id: string;
    user_id: string;
    qr_code: string;
    status: string;
    created_at: string;
    event?: Partial<PetEvent>;
}

export const eventsApi = {
    list: (params?: { upcoming_only?: boolean; limit?: number; offset?: number }) => {
        const query = new URLSearchParams();
        if (params?.upcoming_only) query.set('upcoming_only', 'true');
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));
        const qs = query.toString();
        return api.get<{ events: PetEvent[] }>(`/events${qs ? `?${qs}` : ''}`);
    },

    getById: (id: string) =>
        api.get<{ event: PetEvent }>(`/events/${id}`),

    purchaseTicket: (id: string) =>
        api.post<{ ticket: EventTicket }>(`/events/${id}/purchase`),

    getMyTickets: () =>
        api.get<{ tickets: EventTicket[] }>('/events/me/tickets'),

    validateTicket: (qr_code: string) =>
        api.post<{ valid: boolean; message: string; ticket: EventTicket }>('/events/tickets/validate', { qr_code }),
};
