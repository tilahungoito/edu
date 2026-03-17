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
};

export default promotionsService;
