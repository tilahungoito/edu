import apiClient from './api-client';
import type { AuditLog, AuditLogFilter } from '../types/entities';
export type { AuditLog, AuditLogFilter };

export const auditService = {
    getAll: async (params?: AuditLogFilter): Promise<{ logs: AuditLog[], total: number }> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === 'startDate' || key === 'endDate') {
                        queryParams.append(key, (value as Date).toISOString());
                    } else {
                        queryParams.append(key, value.toString());
                    }
                }
            });
        }
        const response = await apiClient.get<AuditLog[]>(`/audit?${queryParams.toString()}`);
        // Transform dates
        const logs = response.data.map(log => ({
            ...log,
            createdAt: new Date(log.createdAt),
        }));
        return {
            logs,
            total: logs.length // Backend doesn't return total, so we use array length
        };
    },

    getById: async (id: string): Promise<AuditLog> => {
        const response = await apiClient.get<AuditLog>(`/audit/${id}`);
        return {
            ...response.data,
            createdAt: new Date(response.data.createdAt),
        };
    },

    exportToCSV: async (params?: AuditLogFilter): Promise<void> => {
        const { logs } = await auditService.getAll({ ...params, limit: 10000 });

        // CSV Headers
        const headers = ['Timestamp', 'User', 'Email', 'Action', 'Entity', 'Entity ID', 'IP Address'];
        const rows = logs.map(log => [
            log.createdAt.toLocaleString(),
            log.user?.username || 'System',
            log.user?.email || 'N/A',
            log.action,
            log.entity,
            log.entityId || 'N/A',
            log.ip || 'N/A',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
};
