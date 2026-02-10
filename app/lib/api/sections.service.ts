import apiClient from './api-client';

export interface Section {
    id: string;
    name: string;
    institutionId: string;
    nextSectionId?: string;
    students?: any[];
    _count?: {
        students: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateSectionData {
    name: string;
    institutionId: string;
    nextSectionId?: string;
}

export const sectionsService = {
    getAll: async (institutionId: string) => {
        const response = await apiClient.get<Section[]>(`/sections/institution/${institutionId}`);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<Section>(`/sections/${id}`);
        return response.data;
    },

    create: async (data: CreateSectionData) => {
        const response = await apiClient.post<Section>('/sections', data);
        return response.data;
    },

    update: async (id: string, data: { name?: string; nextSectionId?: string }) => {
        const response = await apiClient.patch<Section>(`/sections/${id}`, data);
        return response.data;
    },

    remove: async (id: string) => {
        const response = await apiClient.delete(`/sections/${id}`);
        return response.data;
    },

    assignStudents: async (sectionId: string, studentIds: string[]) => {
        const response = await apiClient.post(`/sections/${sectionId}/assign-students`, { studentIds });
        return response.data;
    },
};

export default sectionsService;
