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
            'REGIONAL_ADMIN': '/admin/createRegionalAdmin',
            'ZONE_ADMIN': '/admin/createZoneAdmin',
            'WOREDA_ADMIN': '/admin/createWoredaAdmin',
            'KEBELE_ADMIN': '/admin/createKebeleAdmin',
            'INSTITUTION_ADMIN': '/admin/createInstitutionAdmin',
        };

        const endpoint = roleEndpointMap[targetRole] || '/admin/createStaff';
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
