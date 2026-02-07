import apiClient from './api-client';

export interface Grade {
    id: string;
    enrollmentId: string;
    score: number;
    grade: string;
    remark?: string;
    submittedAt: string;
}

export interface Transcript {
    studentId: string;
    studentName: string;
    results: {
        courseCode: string;
        courseName: string;
        grade: string;
        credits: number;
    }[];
    gpa: number;
}

export interface CreateGradeData {
    enrollmentId: string;
    score: number;
    grade: string;
    remark?: string;
}

export const gradesService = {
    create: async (data: CreateGradeData) => {
        const response = await apiClient.post<Grade>('/grades', data);
        return response.data;
    },

    getByCourse: async (courseId: string) => {
        const response = await apiClient.get<Grade[]>(`/grades/course/${courseId}`);
        return response.data;
    },

    getTranscript: async (studentId: string) => {
        const response = await apiClient.get<Transcript>(`/grades/transcript/${studentId}`);
        return response.data;
    },
};

export default gradesService;
