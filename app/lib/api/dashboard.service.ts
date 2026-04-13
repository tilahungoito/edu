import apiClient from './api-client';

export interface DashboardStats {
    institutions: number;
    students: number;
    teachers: number;
    usersByRole: {
        roleId: string;
        _count: number;
    }[];
    recentLogs: any[];
    enrollmentTrends?: { name: string; students: number; teachers: number }[];
    institutionLevels?: { name: string; value: number }[];
}

export interface InstitutionStats {
    students: number;
    courses: number;
    enrollments: number;
    totalRevenue: number;
    attendanceAndRevenue?: { name: string; attendance: number; revenue: number }[];
}

export interface StudentStats {
    enrollments: any[];
    attendanceRate: number;
    gpa?: string;
    upcomingSchedule?: { time: string; subject: string; room: string }[];
}

export interface InstructorStats {
    courses: any[];
    totalStudents: number;
    recentAttendance: any[];
    avgAttendance?: string;
    activityFeed?: any[];
    schedule?: any[];
    atRiskCount?: number;
    milestones?: any[];
    studentPerformance?: any[];
    attendanceTrends?: any[];
    attendanceByDay?: any[];
    behaviorSummary?: any[];
    comparisonRadar?: any[];
    assessmentAverages?: any[];
    gradeDistribution?: any[];
    peerAvgScore?: number;
    syllabusCompletion?: number;
}

export interface RegistrarStats {
    recentEnrollments: number;
    pendingApplications: number;
    totalStudents: number;
    transcriptsIssued: number;
    enrollmentTrends?: { name: string; value: number }[];
    recentActivities?: { action: string; target: string; time: string }[];
}

export const dashboardService = {
    getStats: async (scopeType?: string, scopeId?: string): Promise<DashboardStats | InstitutionStats | StudentStats | InstructorStats | RegistrarStats | any> => {
        const params = new URLSearchParams();
        if (scopeType) params.append('scopeType', scopeType);
        if (scopeId) params.append('scopeId', scopeId);
        
        const response = await apiClient.get<any>(`dashboard/stats${params.toString() ? `?${params.toString()}` : ''}`);
        return response.data;
    }
};
