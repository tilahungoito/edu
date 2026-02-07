import apiClient from './api-client';

export interface Asset {
    id: string;
    assetCode: string;
    name: string;
    category: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
    condition: string;
    location: string;
    status: string;
    institutionId: string;
    institution?: {
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateAssetDto {
    assetCode: string;
    name: string;
    category: string;
    quantity: number;
    unitValue: number;
    condition: string;
    location: string;
    status: string;
    institutionId: string;
}

export const inventoryService = {
    getAll: async (institutionId?: string): Promise<Asset[]> => {
        const response = await apiClient.get<Asset[]>('/assets', {
            params: { institutionId },
        });
        return response.data;
    },

    getById: async (id: string): Promise<Asset> => {
        const response = await apiClient.get<Asset>(`/assets/${id}`);
        return response.data;
    },

    create: async (data: CreateAssetDto): Promise<Asset> => {
        const response = await apiClient.post<Asset>('/assets', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateAssetDto>): Promise<Asset> => {
        const response = await apiClient.patch<Asset>(`/assets/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/assets/${id}`);
    },
};
