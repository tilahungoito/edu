import apiClient from './api-client';

export interface Subject {
    id: string;
    name: string;
    code: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export const subjectsService = {
    getAll: async () => {
        const response = await apiClient.get<Subject[]>('subjects');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await apiClient.get<Subject>(`subjects/${id}`);
        return response.data;
    },
    create: async (data: Partial<Subject>) => {
        const response = await apiClient.post<Subject>('subjects', data);
        return response.data;
    },
    update: async (id: string, data: Partial<Subject>) => {
        const response = await apiClient.patch<Subject>(`subjects/${id}`, data);
        return response.data;
    },
    remove: async (id: string) => {
        await apiClient.delete(`subjects/${id}`);
    }
};

export default subjectsService;
