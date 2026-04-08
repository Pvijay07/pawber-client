import { api } from './api';

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
    user?: {
        full_name: string;
        avatar_url?: string;
    };
}

export const reviewsApi = {
    getByProvider: (providerId: string, params?: { limit?: number; offset?: number }) => {
        const query = new URLSearchParams();
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));
        const qs = query.toString();
        return api.get<{ reviews: Review[]; stats: { average_rating: number; total_reviews: number } }>(`/reviews/provider/${providerId}${qs ? `?${qs}` : ''}`);
    },

    create: (data: { booking_id: string; rating: number; comment?: string }) =>
        api.post<{ review: Review }>('/reviews', data),

    reply: (id: string, reply: string) =>
        api.patch<{ review: Review }>(`/reviews/${id}/reply`, { reply }),
};
