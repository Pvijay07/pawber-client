import { api } from './api';
import { Pet } from '../shared/types';

export const petsApi = {
    list: () =>
        api.get<{ pets: Pet[] }>('/pets'),

    getById: (id: string) =>
        api.get<{ pet: Pet }>(`/pets/${id}`),

    create: (data: Omit<Pet, 'id' | 'user_id' | 'created_at'>) =>
        api.post<{ pet: Pet }>('/pets', data),

    update: (id: string, data: Partial<Pet>) =>
        api.patch<{ pet: Pet }>(`/pets/${id}`, data),

    delete: (id: string) =>
        api.delete<{ message: string }>(`/pets/${id}`),
};
