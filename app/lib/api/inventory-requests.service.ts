import apiClient from './api-client';

export type InventoryRequestStatus =
  | 'DRAFT'
  | 'PENDING_SCHOOL'
  | 'PENDING_WOREDA'
  | 'PENDING_ZONE'
  | 'PENDING_BUREAU'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface InventoryRequest {
    id: string;
    institutionId: string;
    itemType: string;
    quantity: number;
    priority: string;
    status: InventoryRequestStatus;
    details?: string;
    requesterId: string;
    createdAt: string;
    updatedAt: string;
    institution?: { name: string };
    requester?: { firstName?: string; lastName?: string; username: string };
}

export interface CreateInventoryRequestData {
    itemType: string;
    quantity: number;
    institutionId: string;
    priority?: string;
    details?: string;
}

export interface InventoryRequestFilters {
    institutionId?: string;
    status?: InventoryRequestStatus;
    requesterId?: string;
}

export const inventoryRequestsService = {
    getAll: async (filters: InventoryRequestFilters = {}): Promise<InventoryRequest[]> => {
        const response = await apiClient.get<InventoryRequest[]>('inventory-requests', {
            params: filters,
        });
        return response.data;
    },

    getById: async (id: string): Promise<InventoryRequest> => {
        const response = await apiClient.get<InventoryRequest>(`inventory-requests/${id}`);
        return response.data;
    },

    create: async (data: CreateInventoryRequestData): Promise<InventoryRequest> => {
        const response = await apiClient.post<InventoryRequest>('inventory-requests', data);
        return response.data;
    },

    updateStatus: async (params: { id: string; status: InventoryRequestStatus; comment?: string }): Promise<InventoryRequest> => {
        const response = await apiClient.patch<InventoryRequest>(`inventory-requests/${params.id}/status`, { 
            status: params.status, 
            comment: params.comment 
        });
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`inventory-requests/${id}`);
    },
};

export default inventoryRequestsService;
