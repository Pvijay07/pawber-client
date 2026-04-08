import { api } from './api';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    reference_id?: string;
    reference_type?: string;
    created_at: string;
}

export const notificationsApi = {
    list: (params?: { unread_only?: boolean; limit?: number; offset?: number }) => {
        const query = new URLSearchParams();
        if (params?.unread_only) query.set('unread_only', 'true');
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));
        const qs = query.toString();
        return api.get<{ notifications: Notification[]; unread_count: number }>(`/notifications${qs ? `?${qs}` : ''}`);
    },

    markAsRead: (id: string) =>
        api.patch<{ message: string }>(`/notifications/${id}/read`),

    markAllAsRead: () =>
        api.patch<{ message: string }>('/notifications/read-all'),

    delete: (id: string) =>
        api.delete<{ message: string }>(`/notifications/${id}`),
};
