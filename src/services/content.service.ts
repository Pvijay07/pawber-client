import { api } from './api';

export const contentService = {
    /**
     * Fetch dynamic homepage content
     */
    getHomepageContent: async () => {
        try {
            const response = await api.get('/content/homepage');
            return response.data;
        } catch (error) {
            console.error('Error fetching homepage content:', error);
            throw error;
        }
    },

    /**
     * Fetch global app configurations
     */
    getConfig: async () => {
        try {
            const response = await api.get('/content/config');
            return response.data;
        } catch (error) {
            console.error('Error fetching config:', error);
            throw error;
        }
    }
};
