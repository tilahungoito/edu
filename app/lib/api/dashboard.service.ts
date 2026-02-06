import apiClient from './api-client';

export interface DashboardStats {
    institutions: number;
    usersByRole: {
        roleId: string;
        _count: number;
    }[];
    recentLogs: any[];
}

export interface InstitutionStats {
    students: number;
    courses: number;
    enrollments: number;
    totalRevenue: number;
}

export const dashboardService = {
    getStats: async (): Promise<DashboardStats | InstitutionStats> => {
        const response = await apiClient.get<DashboardStats | InstitutionStats>('/dashboard/stats');
        return response.data;
    }
};
