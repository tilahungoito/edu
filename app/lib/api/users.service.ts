import apiClient, { User } from './api-client';

export const usersService = {
    getAll: async (params?: {
        role?: string;
        scopeType?: string;
        scopeId?: string;
    }): Promise<User[]> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });
        }
        const response = await apiClient.get<User[]>(`/users?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: string): Promise<User> => {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    update: async (id: string, data: any): Promise<User> => {
        const response = await apiClient.patch<User>(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    }
};
