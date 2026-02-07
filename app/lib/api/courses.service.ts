import apiClient from './api-client';

export interface Course {
    id: string;
    name: string;
    code: string;
    description: string;
    credits: number;
    instructorId: string;
    institutionId: string;
    instructor?: {
        id: string;
        username: string;
    };
}

export interface CreateCourseData {
    name: string;
    code: string;
    description?: string;
    credits: number;
    instructorId: string;
    institutionId: string;
}

export const coursesService = {
    getAll: async () => {
        const response = await apiClient.get<Course[]>('/courses');
        return response.data;
    },

    create: async (data: CreateCourseData) => {
        const response = await apiClient.post<Course>('/courses', data);
        return response.data;
    },

    transfer: async (id: string, instructorId: string) => {
        const response = await apiClient.patch<Course>(`/courses/${id}/transfer`, { instructorId });
        return response.data;
    },

    getByInstructor: async (instructorId: string) => {
        const response = await apiClient.get<Course[]>(`/courses/instructor/${instructorId}`);
        return response.data;
    },
};

export default coursesService;
