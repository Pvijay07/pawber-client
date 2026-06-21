import { api } from './api';

export interface LoyaltyStatus {
    isEligible: boolean;
    currentStreak: number;
    progress: string[];
}

export const loyaltyApi = {
    /**
     * Get the current user's loyalty streak and eligibility status.
     */
    getStatus: () => api.get<LoyaltyStatus>('/loyalty/status'),

    /**
     * Get the user's points balance and recent transactions.
     */
    getPoints: () => api.get<{ balance: number; transactions: any[] }>('/loyalty/points'),

    /**
     * Get referral details.
     */
    getReferralInfo: () => api.get<{ code: string; referrals: any[] }>('/loyalty/referral'),

    /**
     * Apply a referral code.
     */
    applyReferralCode: (code: string) => api.post<any>('/loyalty/referral/apply', { code }),
};
