import apiClient from './api-client';

export interface Institution {
    id: string;
    name: string;
    kebeleId: string;
    kebele?: {
        id: string;
        name: string;
    };
    _count?: {
        students: number;
        courses: number;
        users: number;
    };
}

export const institutionsService = {
    getAll: async (params?: {
        kebeleId?: string,
        woredaId?: string,
        zoneId?: string,
        regionId?: string,
        all?: boolean
    }): Promise<Institution[]> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) queryParams.append(key, String(value));
            });
        }
        const response = await apiClient.get<Institution[]>(`institutions?${queryParams.toString()}`);
        return response.data;
    },

    getById: async (id: string): Promise<Institution> => {
        const response = await apiClient.get<Institution>(`institutions/${id}`);
        return response.data;
    },

    create: async (data: Partial<Institution>): Promise<Institution> => {
        const response = await apiClient.post<Institution>('institutions', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Institution>): Promise<Institution> => {
        const response = await apiClient.patch<Institution>(`institutions/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`institutions/${id}`);
    },

    getAcademicPeriods: async (institutionId: string): Promise<any[]> => {
        const response = await apiClient.get<any[]>(`schedule-config/periods/${institutionId}`);
        return response.data;
    }
};

