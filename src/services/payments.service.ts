import { api } from './api';

export interface RazorpayOrder {
    order_id: string;
    amount: number;
    currency: string;
    key_id: string;
    booking_id: string;
    notes?: any;
}

export const paymentsApi = {
    createOrder: (booking_id: string, amount: number, wallet_amount?: number) =>
        api.post<{ order: RazorpayOrder }>('/payments/create-order', { booking_id, amount, wallet_amount }),

    verify: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
        api.post<{ verified: boolean; payment_id: string }>('/payments/verify', data),

    refund: (data: { payment_id: string; amount?: number; reason?: string }) =>
        api.post<{ refund_id: string; message: string }>('/payments/refund', data),

    getHistory: (params?: { limit?: number; offset?: number }) => {
        const query = new URLSearchParams();
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));
        const qs = query.toString();
        return api.get<{ payments: any[] }>(`/payments${qs ? `?${qs}` : ''}`);
    },
};
