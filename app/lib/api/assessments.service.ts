import apiClient from './api-client';

export interface Assessment {
    id: string;
    title: string;
    type: 'QUIZ' | 'ASSIGNMENT' | 'PROJECT' | 'MIDTERM' | 'FINAL' | 'OTHER';
    maxScore: number;
    weight: number;
    date?: string;
    courseId: string;
}

export interface AssessmentScore {
    id?: string;
    enrollmentId: string;
    score: number;
    remarks?: string;
}

export const assessmentsService = {
    create: async (data: Partial<Assessment>) => {
        const response = await apiClient.post<Assessment>('/classroom/assessments', data);
        return response.data;
    },

    getByCourse: async (courseId: string) => {
        const response = await apiClient.get<Assessment[]>(`/classroom/assessments/course/${courseId}`);
        return response.data;
    },

    getScoresByAssessment: async (assessmentId: string) => {
        const response = await apiClient.get<AssessmentScore[]>(`/classroom/assessments/${assessmentId}/scores`);
        return response.data;
    },

    bulkRecordScores: async (assessmentId: string, data: { scores: { enrollmentId: string, score: number, remarks?: string }[] }) => {
        const response = await apiClient.post(`/classroom/assessments/${assessmentId}/scores/bulk`, data);
        return response.data;
    },
    
    // Gradebook (cumulative)
    getGradeBooksByCourse: async (courseId: string) => {
        const response = await apiClient.get<any[]>(`/classroom/courses/${courseId}/gradebook`);
        return response.data;
    },
    
    computeGradeBook: async (enrollmentId: string) => {
        const response = await apiClient.post(`/classroom/enrollments/${enrollmentId}/gradebook/compute`);
        return response.data;
    }
};

export default assessmentsService;
