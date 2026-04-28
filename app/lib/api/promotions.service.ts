import apiClient from './api-client';

export interface AcademicHistory {
    id: string;
    studentId: string;
    institutionId: string;
    academicPeriodId: string;
    gradeLevel: string;
    sectionName: string;
    finalAverage?: number;
    promotionStatus: 'PASS' | 'DETAINED' | 'WITHDRAWN';
    rank?: number;
    remarks?: string;
    createdAt: string;
}

export interface PromoteStudentsData {
    institutionId: string;
    academicPeriodId: string;
    studentIds: string[];
    promotionStatus: 'PASS' | 'DETAINED' | 'WITHDRAWN';
}

export const promotionsService = {
    promote: async (data: PromoteStudentsData) => {
        const response = await apiClient.post<AcademicHistory[]>('promotions/promote', data);
        return response.data;
    },

    getHistory: async (studentId: string) => {
        const response = await apiClient.get<AcademicHistory[]>(`promotions/history/${studentId}`);
        return response.data;
    },

    getStats: async (institutionId: string) => {
        const response = await apiClient.get<any[]>(`promotions/stats/${institutionId}`);
        return response.data;
    },

    syncResults: async (institutionId: string, academicPeriodId: string) => {
        const response = await apiClient.post<{ message: string; syncedCount: number }>('promotions/sync-institution', {
            institutionId,
            academicPeriodId,
        });
        return response.data;
    },

    getValidationSection: async (sectionId: string, periodId: string) => {
        const response = await apiClient.get<PromotionValidationItem[]>(`promotions/validate/section/${sectionId}?periodId=${periodId}`);
        return response.data;
    },
};

export interface PromotionValidationItem {
    studentId: string;
    name: string;
    username: string;
    year: number;
    sem1Avg: number | null;
    sem2Avg: number | null;
    cumulativeAvg: number | null;
    suggestedStatus: 'PASS' | 'DETAINED';
}

export default promotionsService;
