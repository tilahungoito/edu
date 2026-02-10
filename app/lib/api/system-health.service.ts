import apiClient from './api-client';

export interface HealthStatus {
    status: string;
    timestamp: string;
    uptime: number;
    memory: {
        heapUsed: string;
        heapTotal: string;
        rss: string;
    };
    environment: string;
}

export const systemHealthService = {
    getHealth: async (): Promise<HealthStatus> => {
        const response = await apiClient.get<HealthStatus>('/health');
        return response.data;
    }
};

export default systemHealthService;
