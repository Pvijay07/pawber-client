import { api } from './api';

export const analyticsApi = {
    getClientAnalytics: async () => {
        const response = await api.get('/analytics/client');
        return response.data;
    }
};
