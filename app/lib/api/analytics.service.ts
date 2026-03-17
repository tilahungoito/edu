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
}

export interface SubjectPerformance {
    name: string;
    value: number;
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
    }
};
