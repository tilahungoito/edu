import apiClient from './api-client';

export interface CreateUserDto {
    email: string;
    username: string;
    password?: string;
    phone: string;
    scopeId?: string;
    firstName?: string;
    lastName?: string;
}

export const adminService = {
    /**
     * Create a user at a specific hierarchical level
     */
    createUser: async (targetRole: string, data: CreateUserDto) => {
        const roleEndpointMap: Record<string, string> = {
            'REGIONAL_ADMIN': '/admin/create-regional-admin',
            'ZONE_ADMIN': '/admin/create-zone-admin',
            'WOREDA_ADMIN': '/admin/create-woreda-admin',
            'KEBELE_ADMIN': '/admin/create-kebele-admin',
            'INSTITUTION_ADMIN': '/admin/create-institution-admin',
        };

        const endpoint = roleEndpointMap[targetRole] || '/admin/create-staff';
        const response = await apiClient.post(endpoint, {
            ...data,
            targetRole: !roleEndpointMap[targetRole] ? targetRole : undefined
        });
        return response.data;
    },

    /**
     * Get users created by the current admin
     */
    getMyCreatedUsers: async () => {
        const response = await apiClient.get('/admin/my-created-users');
        return response.data;
    }
};

export default adminService;
