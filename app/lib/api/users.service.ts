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
    },

    getMe: async (): Promise<User> => {
        const response = await apiClient.get<User>('/profile');
        return response.data;
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await apiClient.patch<User>('/profile', data);
        return response.data;
    },

    changePassword: async (data: any): Promise<void> => {
        await apiClient.patch('/profile/password', data);
    },

    activate: async (id: string): Promise<void> => {
        await apiClient.patch(`/users/${id}/activate`);
    },

    deactivate: async (id: string): Promise<void> => {
        await apiClient.patch(`/users/${id}/deactivate`);
    },

    remove: async (id: string): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },

    updateRole: async (id: string, roleId: string): Promise<User> => {
        const response = await apiClient.patch<User>(`/users/${id}/role`, { roleId });
        return response.data;
    }
};
