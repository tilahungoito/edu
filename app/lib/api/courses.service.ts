import apiClient from './api-client';

export interface Course {
    id: string;
    code?: string;
    name: string;
    credit?: number;
    instructorId?: string;
    institutionId?: string;
    regionId?: string;
    gradeLevel?: number;
    instructor?: {
        id: string;
        username: string;
    };
    institution?: {
        id: string;
        name: string;
    };
}

export interface CreateCourseData {
    name: string;
    code?: string;
    credit?: number;
    institutionId?: string;
    regionId?: string;
    instructorId?: string;
    gradeLevel?: number;
}

export const coursesService = {
    getAll: async (filters?: { instructorId?: string; institutionId?: string }) => {
        let url = 'courses';
        if (filters) {
            const params = new URLSearchParams();
            if (filters.instructorId) params.append('instructorId', filters.instructorId);
            if (filters.institutionId) params.append('institutionId', filters.institutionId);
            if (params.toString()) url += `?${params.toString()}`;
        }
        const response = await apiClient.get<Course[]>(url);
        return response.data;
    },

    create: async (data: CreateCourseData) => {
        const response = await apiClient.post<Course>('courses', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateCourseData>) => {
        const response = await apiClient.patch<Course>(`courses/${id}`, data);
        return response.data;
    },

    transfer: async (id: string, instructorId: string) => {
        const response = await apiClient.patch<Course>(`courses/${id}/transfer`, { instructorId });
        return response.data;
    },

    assignInstructor: async (id: string, instructorId: string | null) => {
        const response = await apiClient.patch<Course>(`courses/${id}/assign`, { instructorId: instructorId || null });
        return response.data;
    },

    getByInstructor: async (instructorId: string) => {
        const response = await apiClient.get<Course[]>(`courses/instructor/${instructorId}`);
        return response.data;
    },

    remove: async (id: string) => {
        const response = await apiClient.delete(`courses/${id}`);
        return response.data;
    },
};

export default coursesService;
