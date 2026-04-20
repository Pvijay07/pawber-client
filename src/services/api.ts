import { API_BASE_URL } from '../shared/constants';
import { ApiResponse } from '../shared/types';
import { supabase } from '../lib/supabase';

/**
 * Base API client with error handling, auth headers, and typed responses.
 */
class ApiClient {
    private baseUrl: string;
    private getToken: (() => string | null) = () => null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /** Call this after auth provider initializes */
    setTokenGetter(getter: () => string | null) {
        this.getToken = getter;
    }

    private async request<T>(
        method: string,
        path: string,
        body?: any,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        let token = this.getToken();
        if (!token) {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.access_token) {
                token = data.session.access_token;
            }
        }
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };

        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                ...options,
            });

            const json = await response.json();
            return json as ApiResponse<T>;
        } catch (error) {
            return {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Network error',
                },
            };
        }
    }

    get<T>(path: string) {
        return this.request<T>('GET', path);
    }

    post<T>(path: string, body?: any) {
        return this.request<T>('POST', path, body);
    }

    patch<T>(path: string, body?: any) {
        return this.request<T>('PATCH', path, body);
    }

    put<T>(path: string, body?: any) {
        return this.request<T>('PUT', path, body);
    }

    delete<T>(path: string) {
        return this.request<T>('DELETE', path);
    }
}

export const api = new ApiClient(API_BASE_URL);
