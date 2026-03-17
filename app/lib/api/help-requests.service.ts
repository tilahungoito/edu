import { apiClient } from './api-client';
import { HelpRequest } from '../types/entities';

export interface CreateHelpRequestDto {
    subject: string;
    description: string;
    priority?: 'Low' | 'Medium' | 'High';
}

export interface UpdateHelpRequestStatusDto {
    status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    adminComment?: string;
}

export const helpRequestsService = {
    async create(data: CreateHelpRequestDto): Promise<HelpRequest> {
        return apiClient.post('/help-requests', data);
    },

    async getAll(): Promise<HelpRequest[]> {
        return apiClient.get('/help-requests');
    },

    async getMyRequests(): Promise<HelpRequest[]> {
        return apiClient.get('/help-requests/my');
    },

    async getById(id: string): Promise<HelpRequest> {
        return apiClient.get(`/help-requests/${id}`);
    },

    async updateStatus(id: string, data: UpdateHelpRequestStatusDto): Promise<HelpRequest> {
        return apiClient.patch(`/help-requests/${id}/status`, data);
    }
};
