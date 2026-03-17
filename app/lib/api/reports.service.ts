import apiClient from './api-client';

export interface StaffDistribution {
    instructors: number;
    accountants: number;
    registrars: number;
    systemAdmins: number;
    totalStaff: number;
    totalStudents: number;
    studentTeacherRatio: string | number;
    distribution: { role: string; count: number }[];
}

export interface InventorySummary {
    totalItems: number;
    totalValue: number;
    conditions: { name: string; value: number }[];
    statuses: { name: string; value: number }[];
}

export interface BudgetSummary {
    totalAllocated: number;
    totalSpent: number;
    remaining: number;
    executionRate: number;
    categories: { name: string; value: number }[];
}

export const reportsService = {
    getStaffDistribution: async (scopeType?: string, scopeId?: string) => {
        const response = await apiClient.get<StaffDistribution>('/reports/staff-distribution', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },

    getInventorySummary: async (scopeType?: string, scopeId?: string) => {
        const response = await apiClient.get<InventorySummary>('/reports/inventory-summary', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },

    getBudgetSummary: async (scopeType?: string, scopeId?: string) => {
        const response = await apiClient.get<BudgetSummary>('/reports/budget-summary', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },

    getEnrollmentStats: async (scopeType?: string, scopeId?: string) => {
        const response = await apiClient.get<any>('/analytics/enrollment-stats', {
            params: { scopeType, scopeId }
        });
        return response.data;
    }
};

export default reportsService;
