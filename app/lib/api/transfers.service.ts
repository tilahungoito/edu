
import apiClient from './api-client';
import { HRTransfer, TransferStatus } from '../types/entities';

export interface CreateTransferRequestDto {
    targetInstitutionId: string;
    type: string;
    reason: string;
    effectiveDate?: string;
    attachments?: string[];
}

export interface UpdateTransferStatusDto {
    status: TransferStatus;
    comment?: string;
    adminComment?: string;
}

export interface BulkUpdateTransferStatusDto {
    requestIds: string[];
    status: TransferStatus;
    comment?: string;
}

export const transfersService = {
    // Submit a new transfer request
    createRequest: async (dto: CreateTransferRequestDto): Promise<HRTransfer> => {
        const response = await apiClient.post<HRTransfer>('/transfers/requests', dto);
        return response.data;
    },

    // Get current user's transfer requests
    getMyRequests: async (): Promise<HRTransfer[]> => {
        const response = await apiClient.get<HRTransfer[]>('/transfers/requests/my');
        return response.data;
    },

    // Get pending transfer requests for approval
    getPendingRequests: async (): Promise<HRTransfer[]> => {
        const response = await apiClient.get<HRTransfer[]>('/transfers/requests/pending');
        return response.data;
    },

    // Update transfer request status (approve/reject)
    updateStatus: async (requestId: string, dto: UpdateTransferStatusDto): Promise<HRTransfer> => {
        const response = await apiClient.patch<HRTransfer>(`/transfers/requests/${requestId}/status`, dto);
        return response.data;
    },

    // Bulk update transfer request status
    bulkUpdateStatus: async (dto: BulkUpdateTransferStatusDto): Promise<{ success: number; failed: number }> => {
        const response = await apiClient.patch<{ success: number; failed: number }>('/transfers/requests/bulk-status', dto);
        return response.data;
    },

    // Cancel a transfer request
    cancelRequest: async (requestId: string): Promise<HRTransfer> => {
        const response = await apiClient.patch<HRTransfer>(`/transfers/requests/${requestId}/cancel`);
        return response.data;
    },

    // Get transfer history
    getHistory: async (studentId?: string): Promise<any[]> => {
        const params = new URLSearchParams();
        if (studentId) {
            params.append('studentId', studentId);
        }
        const response = await apiClient.get<any[]>(`/transfers/history?${params.toString()}`);
        return response.data;
    },

    // Get attachment URL
    getAttachmentUrl: (path: string): string => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:7000';
        return `${baseUrl}/${path}`;
    }
};
