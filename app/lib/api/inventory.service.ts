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

export interface InventoryFilters {
    institutionId?: string;
    category?: string;
}

export const inventoryService = {
    getAll: async (filters: InventoryFilters = {}): Promise<Asset[]> => {
        const response = await apiClient.get<Asset[]>('inventory', {
            params: filters,
        });
        return response.data;
    },

    getById: async (id: string): Promise<Asset> => {
        const response = await apiClient.get<Asset>(`inventory/${id}`);
        return response.data;
    },

    create: async (data: CreateAssetDto): Promise<Asset> => {
        const response = await apiClient.post<Asset>('inventory', data);
        return response.data;
    },

    update: async (params: { id: string; data: Partial<CreateAssetDto> }): Promise<Asset> => {
        const response = await apiClient.patch<Asset>(`inventory/${params.id}`, params.data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`inventory/${id}`);
    },
};
