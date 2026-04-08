import { api } from './api';
import { User, Session } from '../shared/types';

export const authApi = {
    signUp: (data: { email: string; password: string; full_name: string; phone?: string }) =>
        api.post<{ user: User; session: Session; message: string }>('/auth/signup', data),

    signIn: (data: { email: string; password: string }) =>
        api.post<{ user: User; session: Session }>('/auth/signin', data),

    getProfile: () =>
        api.get<{ user: User }>('/auth/me'),

    updateProfile: (data: Partial<Pick<User, 'full_name' | 'phone' | 'avatar_url'>>) =>
        api.patch<{ user: User }>('/auth/me', data),

    refreshToken: (refreshToken: string) =>
        api.post<{ session: Session }>('/auth/refresh', { refresh_token: refreshToken }),

    signOut: () =>
        api.post<{ message: string }>('/auth/signout'),
};
