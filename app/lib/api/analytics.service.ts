import apiClient from './api-client';

export interface KPI {
    label: string;
    value: string | number;
    icon: string;
    trend: 'up' | 'down' | 'neutral';
    color?: string;
}

export interface PerformanceTrend {
    name: string;
    score: number;
    enrollment: number;
    [key: string]: string | number | undefined;
}

export interface SubjectPerformance {
    name: string;
    value: number;
    [key: string]: string | number | undefined;
}

export interface GradeDistribution {
    range: string;
    count: number;
    color: string;
    [key: string]: string | number | undefined;
}

export interface EnrollmentStats {
    kpis: KPI[];
    distribution: { name: string; value: number }[];
    byProgram: { name: string; value: number }[];
    byYear: { name: string; value: number }[];
}

export interface StudentDrilldown {
    id: string;
    name: string;
    email: string;
    school: string;
    score: number;
    program: string;
}

export interface GenderPerformance {
    ranges: string[];
    series: { name: string; data: number[]; color: string }[];
}

export const analyticsService = {
    getKPIs: async (scopeType?: string, scopeId?: string): Promise<KPI[]> => {
        const response = await apiClient.get<KPI[]>('/analytics/kpis', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },
    getPerformanceTrends: async (scopeType?: string, scopeId?: string): Promise<PerformanceTrend[]> => {
        const response = await apiClient.get<PerformanceTrend[]>('/analytics/performance-trends', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },
    getSubjectPerformance: async (scopeType?: string, scopeId?: string): Promise<SubjectPerformance[]> => {
        const response = await apiClient.get<SubjectPerformance[]>('/analytics/subject-performance', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },
    getGradeDistribution: async (scopeType?: string, scopeId?: string): Promise<GradeDistribution[]> => {
        const response = await apiClient.get<GradeDistribution[]>('/analytics/grade-distribution', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },
    getEnrollmentStats: async (scopeType?: string, scopeId?: string): Promise<EnrollmentStats> => {
        const response = await apiClient.get<EnrollmentStats>('/analytics/enrollment-stats', {
            params: { scopeType, scopeId }
        });
        return response.data;
    },
    getStudentsByBucket: async (scopeType?: string, scopeId?: string, bucketIndex?: number): Promise<StudentDrilldown[]> => {
        const response = await apiClient.get<StudentDrilldown[]>('/analytics/students-by-bucket', {
            params: { scopeType, scopeId, bucketIndex }
        });
        return response.data;
    },
    getGenderGap: async (scopeType?: string, scopeId?: string): Promise<GenderPerformance> => {
        const response = await apiClient.get<GenderPerformance>('/analytics/gender-gap', {
            params: { scopeType, scopeId }
        });
        return response.data;
    }
};
