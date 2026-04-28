import apiClient from './api-client';

export interface Backup {
    id: string;
    createdAt: string;
    size: string;
    type: 'Automatic' | 'Manual';
    status: 'Success' | 'Processing' | 'Failed';
    filename: string;
}

export const backupsService = {
    getAll: async (): Promise<Backup[]> => {
        const response = await apiClient.get('backups');
        return response.data;
    },

    create: async (): Promise<Backup> => {
        const response = await apiClient.post('backups');
        return response.data;
    },

    download: async (id: string, filename: string): Promise<void> => {
        const response = await apiClient.get(`backups/${id}/download`, {
            responseType: 'blob',
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    restore: async (id: string): Promise<void> => {
        await apiClient.post(`backups/${id}/restore`);
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`backups/${id}`);
    }
};

export default backupsService;
