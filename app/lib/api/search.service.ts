import apiClient from './api-client';

export interface SearchResult {
    id: string;
    type: 'REGION' | 'ZONE' | 'WOREDA' | 'KEBELE' | 'INSTITUTION' | 'USER';
    title: string;
    description: string;
    path: string;
}

export const searchService = {
    search: async (query: string): Promise<SearchResult[]> => {
        if (!query || query.length < 2) return [];
        
        try {
            const response = await apiClient.get<SearchResult[]>(`search?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            console.error('Search error:', error);
            // Fallback: If backend search isn't ready, we could do client-side search if we had all data,
            // but for now we return empty or mock if in dev.
            return [];
        }
    }
};

export default searchService;
