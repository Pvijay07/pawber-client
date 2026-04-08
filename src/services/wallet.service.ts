import { api } from './api';
import { Wallet, WalletTransaction } from '../shared/types';

export const walletApi = {
    get: () =>
        api.get<{ wallet: Wallet }>('/wallet'),

    getTransactions: (params?: { type?: string; limit?: number; offset?: number }) => {
        const query = new URLSearchParams();
        if (params?.type) query.set('type', params.type);
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.offset) query.set('offset', String(params.offset));
        const qs = query.toString();
        return api.get<{ transactions: WalletTransaction[] }>(`/wallet/transactions${qs ? `?${qs}` : ''}`);
    },

    addFunds: (amount: number) =>
        api.post<{ wallet: Wallet; message: string }>('/wallet/add-funds', { amount }),

    pay: (bookingId: string, amount: number) =>
        api.post<{ message: string; balance: number }>('/wallet/pay', { booking_id: bookingId, amount }),

    updateAutoRecharge: (data: { auto_recharge: boolean; auto_recharge_threshold?: number; auto_recharge_amount?: number }) =>
        api.patch<{ wallet: Wallet }>('/wallet/auto-recharge', data),
};
