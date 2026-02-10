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

export interface StudentStats {
    enrollments: any[];
    attendanceRate: number;
}

export interface InstructorStats {
    courses: any[];
    totalStudents: number;
    recentAttendance: any[];
}

export const dashboardService = {
    getStats: async (): Promise<DashboardStats | InstitutionStats | StudentStats | InstructorStats> => {
        const response = await apiClient.get<DashboardStats | InstitutionStats | StudentStats | InstructorStats>('/dashboard/stats');
        return response.data;
    }
};
