import apiClient from './api-client';

export interface Zone {
    id: string;
    name: string;
    nameAmharic: string;
    code: string;
    description?: string;
    status: string;
    regionId: string;
    _count?: {
        woredas: number;
        institutions: number;
    };
}

export const zonesService = {
    getAll: async (regionId?: string): Promise<Zone[]> => {
        const params = new URLSearchParams();
        if (regionId) params.append('regionId', regionId);
        const response = await apiClient.get<Zone[]>(`/zones?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string): Promise<Zone> => {
        const response = await apiClient.get<Zone>(`/zones/${id}`);
        return response.data;
    },

    create: async (data: Partial<Zone>): Promise<Zone> => {
        const response = await apiClient.post<Zone>('/zones', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Zone>): Promise<Zone> => {
        const response = await apiClient.patch<Zone>(`/zones/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/zones/${id}`);
    }
};
