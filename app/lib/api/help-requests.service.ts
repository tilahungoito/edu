import apiClient from './api-client';

export interface CreateHelpRequestDto {
    subject: string;
    description: string;
    priority?: 'Low' | 'Medium' | 'High';
}

export interface UpdateHelpRequestStatusDto {
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
    adminComment?: string;
}

export const helpRequestsService = {
    async create(data: CreateHelpRequestDto) {
        const res = await apiClient.post('/help-requests', data);
        return res.data;
    },

    async getAll() {
        const res = await apiClient.get('/help-requests');
        return res.data;
    },

    async getMyRequests() {
        const res = await apiClient.get('/help-requests/my');
        return res.data;
    },

    async getById(id: string) {
        const res = await apiClient.get(`/help-requests/${id}`);
        return res.data;
    },

    async updateStatus(id: string, data: UpdateHelpRequestStatusDto) {
        const res = await apiClient.patch(`/help-requests/${id}/status`, data);
        return res.data;
    }
};
