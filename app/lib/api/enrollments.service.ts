import apiClient from './api-client';

export interface Enrollment {
    id: string;
    studentId: string;
    courseId: string;
    enrollmentDate: string;
    status: string;
    student?: {
        id: string;
        username: string;
    };
    course?: {
        id: string;
        name: string;
        code: string;
    };
}

export interface CreateEnrollmentData {
    studentId: string;
    courseId: string;
}

export const enrollmentsService = {
    getAll: async () => {
        const response = await apiClient.get<Enrollment[]>('/enrollments');
        return response.data;
    },

    getByCourse: async (courseId: string) => {
        const response = await apiClient.get<Enrollment[]>(`/enrollments?courseId=${courseId}`);
        return response.data;
    },

    create: async (data: CreateEnrollmentData) => {
        const response = await apiClient.post<Enrollment>('/enrollments', data);
        return response.data;
    },
};

export default enrollmentsService;
