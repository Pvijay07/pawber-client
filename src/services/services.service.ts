import { api } from './api';
import { ServiceCategory, ServiceDetail } from '../shared/types';

export const servicesApi = {
    listCategories: () =>
        api.get<{ categories: ServiceCategory[] }>('/services/categories'),

    list: (categoryId?: string) => {
        const qs = categoryId ? `?category_id=${categoryId}` : '';
        return api.get<{ services: any[] }>(`/services${qs}`);
    },

    getById: (id: string) =>
        api.get<{ service: ServiceDetail }>(`/services/${id}`),
};
