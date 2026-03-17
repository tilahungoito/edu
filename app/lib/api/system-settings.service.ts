import apiClient from './api-client';

export interface SystemSetting {
    id: string;
    key: string;
    value: string;
    description?: string;
    type: string;
    createdAt: string;
    updatedAt: string;
}

export const systemSettingsService = {
    getAll: async () => {
        const response = await apiClient.get<SystemSetting[]>('system-settings');
        return response.data;
    },
    getByKey: async (key: string) => {
        const response = await apiClient.get<SystemSetting>(`system-settings/${key}`);
        return response.data;
    },
    create: async (data: Partial<SystemSetting>) => {
        const response = await apiClient.post<SystemSetting>('system-settings', data);
        return response.data;
    },
    update: async (key: string, data: Partial<SystemSetting>) => {
        const response = await apiClient.patch<SystemSetting>(`system-settings/${key}`, data);
        return response.data;
    },
    remove: async (key: string) => {
        await apiClient.delete(`system-settings/${key}`);
    }
};

export default systemSettingsService;
