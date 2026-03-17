import apiClient from './api-client';

export interface Student {
    id: string;
    userId: string;
    user: {
        id: string;
        email: string;
        username: string;
        phone: string;
        isActive: boolean;
    };
    institutionId: string;
    program: string;
    year: number;
    gender: 'MALE' | 'FEMALE';
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
    gender: 'MALE' | 'FEMALE';
}

export interface UpdateStudentData {
    phone?: string;
    institutionId?: string;
    program?: string;
    year?: number;
    gender?: 'MALE' | 'FEMALE';
}

export const studentsService = {
    getAll: async (filters?: { institutionId?: string }) => {
        let url = '/students';
        if (filters?.institutionId) {
            url += `?institutionId=${filters.institutionId}`;
        }
        const response = await apiClient.get<Student[]>(url);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<Student>(`students/${id}`);
        return response.data;
    },

    create: async (data: CreateStudentData) => {
        const response = await apiClient.post<Student>('students', data);
        return response.data;
    },

    update: async (id: string, data: UpdateStudentData) => {
        const response = await apiClient.patch<Student>(`students/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await apiClient.delete(`students/${id}`);
        return response.data;
    },
};

export default studentsService;
