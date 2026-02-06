import apiClient from './api-client';

export interface Region {
    id: string;
    name: string;
    createdAt: string;
    _count?: {
        zones: number;
    };
}

export const regionsService = {
    getAll: async (): Promise<Region[]> => {
        const response = await apiClient.get<Region[]>('/regions');
        return response.data;
    },

    getById: async (id: string): Promise<Region> => {
        const response = await apiClient.get<Region>(`/regions/${id}`);
        return response.data;
    },

    create: async (data: Partial<Region>): Promise<Region> => {
        const response = await apiClient.post<Region>('/regions', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Region>): Promise<Region> => {
        const response = await apiClient.patch<Region>(`/regions/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/regions/${id}`);
    }
};
