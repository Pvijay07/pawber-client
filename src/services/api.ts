import { API_BASE_URL } from '../shared/constants';
import { ApiResponse } from '../shared/types';
import { supabase } from '../lib/supabase';

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

/**
 * Base API client with error handling, auth headers, request timeouts, and automatic retries.
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
        options?: RequestInit,
        retryCount = 0
    ): Promise<ApiResponse<T>> {
        let token = this.getToken();
        if (!token) {
            try {
                const { data } = await supabase.auth.getSession();
                if (data?.session?.access_token) {
                    token = data.session.access_token;
                }
            } catch (e) {
                // Silently continue
            }
        }
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options?.signal ? undefined : DEFAULT_TIMEOUT_MS);

        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
                ...options,
            });

            clearTimeout(timeoutId);

            // Handle expired/invalid token (401)
            if (response.status === 401 && retryCount === 0) {
                try {
                    console.log(`[API 401] Token expired for ${path}. Refreshing session...`);
                    const { data, error } = await supabase.auth.refreshSession();
                    if (data?.session?.access_token && !error) {
                        return this.request<T>(method, path, body, options, retryCount + 1);
                    }
                } catch (refreshErr) {
                    console.warn('[API 401] Failed to refresh session:', refreshErr);
                }
            }

            // Automatic retry on 502/503/504 Bad Gateway / Service Unavailable (Render spin-up)
            if ([502, 503, 504].includes(response.status) && retryCount < MAX_RETRIES && method === 'GET') {
                const backoffMs = Math.pow(2, retryCount) * 1000;
                console.log(`[API RETRY] ${method} ${path} returned ${response.status}. Retrying in ${backoffMs}ms...`);
                await new Promise(r => setTimeout(r, backoffMs));
                return this.request<T>(method, path, body, options, retryCount + 1);
            }

            const text = await response.text();
            try {
                return JSON.parse(text) as ApiResponse<T>;
            } catch (e) {
                console.error(`[API ERROR] Non-JSON response from ${path}:`, text.substring(0, 200));
                return {
                    success: false,
                    error: {
                        message: `Server returned an unexpected format. Please try again.`,
                    },
                };
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
            const isAbort = error?.name === 'AbortError';
            const errorMsg = isAbort ? 'Request timed out. Please check your internet connection.' : (error instanceof Error ? error.message : 'Network error');

            // Retry GET requests on network failures
            if (!isAbort && retryCount < MAX_RETRIES && method === 'GET') {
                const backoffMs = Math.pow(2, retryCount) * 1000;
                console.log(`[API RETRY] ${method} ${path} failed (${errorMsg}). Retrying in ${backoffMs}ms...`);
                await new Promise(r => setTimeout(r, backoffMs));
                return this.request<T>(method, path, body, options, retryCount + 1);
            }

            console.error(`[API ERROR] Fetch failed for ${path}:`, errorMsg);
            return {
                success: false,
                error: {
                    message: errorMsg,
                },
            };
        }
    }

    get<T>(path: string) { return this.request<T>('GET', path); }
    post<T>(path: string, body?: any) { return this.request<T>('POST', path, body); }
    patch<T>(path: string, body?: any) { return this.request<T>('PATCH', path, body); }
    put<T>(path: string, body?: any) { return this.request<T>('PUT', path, body); }
    delete<T>(path: string) { return this.request<T>('DELETE', path); }
}

export const api = new ApiClient(API_BASE_URL);
