import apiClient from './api-client';

export interface Kebele {
    id: string;
    name: string;
    woredaId: string;
    woredaName?: string;
    createdAt: string;
    _count?: {
        institutions: number;
    };
}

export const kebelesService = {
    getAll: async (): Promise<Kebele[]> => {
        const response = await apiClient.get<Kebele[]>('/kebeles');
        return response.data;
    },

    getById: async (id: string): Promise<Kebele> => {
        const response = await apiClient.get<Kebele>(`/kebeles/${id}`);
        return response.data;
    },

    create: async (data: Partial<Kebele>): Promise<Kebele> => {
        const response = await apiClient.post<Kebele>('/kebeles', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Kebele>): Promise<Kebele> => {
        const response = await apiClient.patch<Kebele>(`/kebeles/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/kebeles/${id}`);
    }
};
