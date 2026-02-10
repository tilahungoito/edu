
import apiClient from './api-client';
import { User } from './api-client';

export const staffService = {
    // Get all staff members (users with specific roles)
    getAllStaff: async (schoolId?: string): Promise<User[]> => {
        const params = new URLSearchParams();
        if (schoolId) {
            params.append('scopeId', schoolId);
        }
        // We want to fetch users who are NOT students. 
        // Since the backend filter is simple equality, we might need to filter client-side 
        // or request specific roles. For now, let's fetch by institution scope if provided.
        // Ideally, we'd pass a list of roles, but our backend simple filter supports one role.
        // Let's rely on the scopeId primarily for now, as that will get everyone in that school.

        const response = await apiClient.get<User[]>(`/users?${params.toString()}`);
        return response.data;
    },

    // Get staff by specific role
    getStaffByRole: async (role: string, schoolId?: string): Promise<User[]> => {
        const params = new URLSearchParams();
        params.append('role', role);
        if (schoolId) {
            params.append('scopeId', schoolId);
        }
        const response = await apiClient.get<User[]>(`/users?${params.toString()}`);
        return response.data;
    }
};

