import apiClient from './api-client';

export interface Woreda {
    id: string;
    name: string;
    nameAmharic: string;
    code: string;
    description?: string;
    status: string;
    zoneId: string;
    _count?: {
        kebeles: number;
        institutions: number;
    };
}

export const woredasService = {
    getAll: async (zoneId?: string): Promise<Woreda[]> => {
        const params = new URLSearchParams();
        if (zoneId) params.append('zoneId', zoneId);
        const response = await apiClient.get<Woreda[]>(`/woredas?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string): Promise<Woreda> => {
        const response = await apiClient.get<Woreda>(`/woredas/${id}`);
        return response.data;
    },

    create: async (data: Partial<Woreda>): Promise<Woreda> => {
        const response = await apiClient.post<Woreda>('/woredas', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Woreda>): Promise<Woreda> => {
        const response = await apiClient.patch<Woreda>(`/woredas/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/woredas/${id}`);
    }
};
