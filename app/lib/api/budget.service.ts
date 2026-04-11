import apiClient from './api-client';

export interface BudgetAllocation {
    id: string;
    institutionId: string;
    category: string;
    allocatedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    fiscalYear: number;
    status: string;
    institution?: { name: string };
    createdAt: string;
    updatedAt: string;
}

export interface BudgetRequest {
    id: string;
    requesterId: string;
    institutionId: string;
    amount: number;
    purpose: string;
    status: string;
    adminComment?: string;
    approvedById?: string;
    createdAt: string;
    updatedAt: string;
    institution?: { name: string };
    requester?: { firstName?: string; lastName?: string; username: string };
    approvedBy?: { firstName?: string; lastName?: string; username: string };
}

export interface CreateBudgetAllocationDto {
    institutionId: string;
    category: string;
    allocatedAmount: number;
    fiscalYear: number;
}

export interface CreateBudgetRequestDto {
    amount: number;
    purpose: string;
    institutionId: string;
}

export interface BudgetStats {
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    allocationsCount: number;
    utilizationRate: number;
}

export interface BudgetFilters {
    institutionId?: string;
    fiscalYear?: number;
}

export const budgetService = {
    // Allocations
    getAllAllocations: async (filters: BudgetFilters = {}): Promise<BudgetAllocation[]> => {
        const response = await apiClient.get<BudgetAllocation[]>('budget/allocations', {
            params: filters,
        });
        return response.data;
    },

    createAllocation: async (data: CreateBudgetAllocationDto): Promise<BudgetAllocation> => {
        const response = await apiClient.post<BudgetAllocation>('budget/allocations', data);
        return response.data;
    },

    getStats: async (filters: BudgetFilters): Promise<BudgetStats> => {
        const response = await apiClient.get<BudgetStats>('budget/stats', {
            params: filters,
        });
        return response.data;
    },

    // Requests
    getAllRequests: async (filters: { institutionId?: string } = {}): Promise<BudgetRequest[]> => {
        const response = await apiClient.get<BudgetRequest[]>('budget/requests', {
            params: filters,
        });
        return response.data;
    },

    createRequest: async (data: CreateBudgetRequestDto): Promise<BudgetRequest> => {
        const response = await apiClient.post<BudgetRequest>('budget/requests', data);
        return response.data;
    },

    updateRequestStatus: async (params: { id: string; status: string; comment?: string }): Promise<BudgetRequest> => {
        const response = await apiClient.patch<BudgetRequest>(`budget/requests/${params.id}/status`, { 
            status: params.status, 
            comment: params.comment 
        });
        return response.data;
    },
};

export default budgetService;
