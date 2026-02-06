import apiClient from './api-client';

export interface Institution {
    id: string;
    name: string;
    nameAmharic: string;
    code: string;
    type: string;
    ownership: string;
    address?: string;
    phone?: string;
    email?: string;
    status: string;
    kebeleId: string;
    _count?: {
        students: number;
        courses: number;
        users: number;
    };
}

export const institutionsService = {
    getAll: async (params?: {
        kebeleId?: string,
        woredaId?: string,
        zoneId?: string,
        regionId?: string
    }): Promise<Institution[]> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });
        }
        const response = await apiClient.get<Institution[]>(`/institutions?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: string): Promise<Institution> => {
        const response = await apiClient.get<Institution>(`/institutions/${id}`);
        return response.data;
    },

    create: async (data: Partial<Institution>): Promise<Institution> => {
        const response = await apiClient.post<Institution>('/institutions', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Institution>): Promise<Institution> => {
        const response = await apiClient.patch<Institution>(`/institutions/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/institutions/${id}`);
    }
};
