import apiClient from './api-client';

export interface Subject {
    id: string;
    name: string;
    code: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSubjectDto {
    name: string;
    code: string;
    description?: string;
}

export interface UpdateSubjectDto extends Partial<CreateSubjectDto> {}

export const subjectsService = {
    /**
     * Get all curriculum subjects.
     */
    getAll: async (): Promise<Subject[]> => {
        const response = await apiClient.get<Subject[]>('subjects');
        return response.data;
    },

    /**
     * Get a specific subject by ID.
     */
    getById: async (id: string): Promise<Subject> => {
        const response = await apiClient.get<Subject>(`subjects/${id}`);
        return response.data;
    },

    /**
     * Define a new core curriculum subject.
     */
    create: async (dto: CreateSubjectDto): Promise<Subject> => {
        const response = await apiClient.post<Subject>('subjects', dto);
        return response.data;
    },

    /**
     * Modify subject metadata.
     */
    update: async (id: string, dto: UpdateSubjectDto): Promise<Subject> => {
        const response = await apiClient.patch<Subject>(`subjects/${id}`, dto);
        return response.data;
    },

    /**
     * Remove a subject from the registry.
     */
    remove: async (id: string): Promise<void> => {
        await apiClient.delete(`subjects/${id}`);
    }
};

export default subjectsService;
