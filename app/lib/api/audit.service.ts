import apiClient from './api-client';

export interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId?: string;
    payload?: any;
    userId?: string;
    user?: {
        username: string;
        email: string;
    };
    ip?: string;
    userAgent?: string;
    createdAt: string;
}

export interface AuditQuery {
    limit?: number;
    offset?: number;
    action?: string;
    entity?: string;
    userId?: string;
}

export const auditService = {
    getAll: async (params?: AuditQuery): Promise<{ logs: AuditLog[], total: number }> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) queryParams.append(key, value.toString());
            });
        }
        const response = await apiClient.get<AuditLog[]>(`/audit?${queryParams.toString()}`);
        // Backend returns the array directly based on the controller. 
        // If it returns a total, we should adjust. For now, assume it returns array.
        return {
            logs: response.data,
            total: response.data.length // Mocking total if backend doesn't provide it in a paginated wrapper
        };
    },

    getById: async (id: string): Promise<AuditLog> => {
        const response = await apiClient.get<AuditLog>(`/audit/${id}`);
        return response.data;
    }
};
