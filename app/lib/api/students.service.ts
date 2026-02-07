import apiClient from './api-client';

export interface Student {
    id: string;
    email: string;
    username: string;
    phone: string;
    institutionId: string;
    program: string;
    year: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    institution?: {
        id: string;
        name: string;
    };
}

export interface CreateStudentData {
    email: string;
    username: string;
    phone: string;
    institutionId: string;
    program: string;
    year: number;
}

export interface UpdateStudentData {
    phone?: string;
    institutionId?: string;
    program?: string;
    year?: number;
}

export const studentsService = {
    getAll: async () => {
        const response = await apiClient.get<Student[]>('/students');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<Student>(`/students/${id}`);
        return response.data;
    },

    create: async (data: CreateStudentData) => {
        const response = await apiClient.post<Student>('/students', data);
        return response.data;
    },

    update: async (id: string, data: UpdateStudentData) => {
        const response = await apiClient.patch<Student>(`/students/${id}`, data);
        return response.data;
    },
};

export default studentsService;
