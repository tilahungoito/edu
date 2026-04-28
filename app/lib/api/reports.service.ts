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

export interface ScheduledReport {
    id: string;
    name: string;
    reportType: string;
    frequency: string;
    recipients: string[];
    status: 'active' | 'paused';
    lastRun?: string | Date;
    nextRun?: string | Date;
    scopeType: string;
    scopeId?: string;
}

export const reportsService = {
    getStaffDistribution: async (scopeType?: string, scopeId?: string) => {
        const response = await apiClient.get<StaffDistribution>('reports/staff-distribution', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },

    getInventorySummary: async (scopeType?: string, scopeId?: string) => {
        const response = await apiClient.get<InventorySummary>('reports/inventory-summary', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },

    getBudgetSummary: async (scopeType?: string, scopeId?: string) => {
        const response = await apiClient.get<BudgetSummary>('reports/budget-summary', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },

    getEnrollmentStats: async (scopeType?: string, scopeId?: string) => {
        const response = await apiClient.get<any>('analytics/enrollment-stats', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },

    getScheduledReports: async () => {
        const response = await apiClient.get<ScheduledReport[]>('scheduled-reports');
        return response.data;
    },

    createScheduledReport: async (data: any) => {
        const response = await apiClient.post<ScheduledReport>('scheduled-reports', data);
        return response.data;
    },

    updateScheduledReport: async (id: string, data: Partial<ScheduledReport>) => {
        const response = await apiClient.put<ScheduledReport>(`scheduled-reports/${id}`, data);
        return response.data;
    },

    deleteScheduledReport: async (id: string) => {
        await apiClient.delete(`scheduled-reports/${id}`);
    }
};

export default reportsService;
