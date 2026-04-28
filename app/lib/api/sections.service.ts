import apiClient from './api-client';

export interface Section {
    id: string;
    name: string;
    institutionId: string;
    gradeLevel?: number;
    program?: string;
    capacity?: number;
    nextSectionId?: string;
    instructorId?: string;
    students?: {
        id: string;
        user?: {
            id: string;
            firstName?: string;
            lastName?: string;
            username: string;
            email?: string;
        };
    }[];
    instructor?: {
        id: string;
        firstName?: string;
        lastName?: string;
        username: string;
    };
    _count?: {
        students: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateSectionData {
    name: string;
    institutionId: string;
    gradeLevel?: number;
    program?: string;
    capacity?: number;
    nextSectionId?: string | null;
    instructorId?: string | null;
}

export interface UpdateSectionData extends Partial<CreateSectionData> {}

export const sectionsService = {
    getAll: async (institutionId: string): Promise<Section[]> => {
        const response = await apiClient.get<Section[]>(`sections/institution/${institutionId}`);
        return response.data;
    },

    getById: async (id: string): Promise<Section> => {
        const response = await apiClient.get<Section>(`sections/${id}`);
        return response.data;
    },

    create: async (data: CreateSectionData): Promise<Section> => {
        const response = await apiClient.post<Section>('sections', data);
        return response.data;
    },

    update: async (id: string, data: UpdateSectionData): Promise<Section> => {
        const response = await apiClient.patch<Section>(`sections/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
        const response = await apiClient.delete<{ success: boolean }>(`sections/${id}`);
        return response.data;
    },

    assignStudents: async (sectionId: string, studentIds: string[]): Promise<any> => {
        const response = await apiClient.post(`sections/${sectionId}/assign`, { studentIds });
        return response.data;
    },

    unassignStudent: async (sectionId: string, studentId: string): Promise<any> => {
        const response = await apiClient.delete(`sections/${sectionId}/students/${studentId}`);
        return response.data;
    },

    getUnassignedStudents: async (institutionId: string, filters?: { year?: number; program?: string }): Promise<any[]> => {
        const params: any = {};
        if (filters?.year) params.year = filters.year;
        if (filters?.program) params.program = filters.program;

        const response = await apiClient.get<any[]>(`sections/institution/${institutionId}/unassigned`, { params });
        return response.data;
    },

    autoEnroll: async (sectionId: string): Promise<any> => {
        const response = await apiClient.post('enrollments/auto-enroll', { sectionId });
        return response.data;
    },
};

export default sectionsService;
