import { api } from './api';

export const aiApi = {
    /**
     * Send a message to the AI concierge and get a response.
     */
    chat: (message: string) => api.post<{ message: string; suggestions: string[]; timestamp: string }>('/ai/chat', { message }),
};
