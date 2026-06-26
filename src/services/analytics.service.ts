import { api } from './api';

export const analyticsApi = {
    getClientAnalytics: () => api.get<any>('/analytics/client')
};
