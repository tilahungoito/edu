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
    const response = await apiClient.get(`/sections/institution/${institutionId}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/sections/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/sections', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/sections/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/sections/${id}`);
    return response.data;
  },
  assignStudents: async (sectionId: string, studentIds: string[]) => {
    const response = await apiClient.post(`/sections/${sectionId}/assign`, { studentIds });
    return response.data;
  },
  unassignStudent: async (sectionId: string, studentId: string) => {
    const response = await apiClient.delete(`sections/${sectionId}/students/${studentId}`);
    return response.data;
  },
  getUnassignedStudents: async (institutionId: string) => {
    const response = await apiClient.get(`/sections/institution/${institutionId}/unassigned`);
    return response.data;
  },
};

export default sectionsService;
