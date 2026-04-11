import apiClient, { User } from './api-client';

export interface StaffMember extends User {
    // Add additional staff-specific fields if necessary
    // Currently, Staff consists of Users with roles other than STUDENT
}

export interface StaffFilters {
    role?: string;
    scopeId?: string;
    isActive?: boolean;
}

export const staffService = {
    /**
     * Get all staff members with optional filtering.
     * This uses the existing `users` endpoint with pre-applied filters.
     */
    getAllStaff: async (filters?: StaffFilters): Promise<StaffMember[]> => {
        const queryParams = new URLSearchParams();
        
        if (filters?.role) queryParams.append('role', filters.role);
        if (filters?.scopeId) queryParams.append('scopeId', filters.scopeId);
        if (filters?.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
        
        const response = await apiClient.get<StaffMember[]>(`users?${queryParams.toString()}`);
        
        // Filter out students client-side if we didn't specify a staff role
        // This ensures the Staff Registry doesn't accidentally show students
        if (!filters?.role) {
            return response.data.filter(u => u.role?.name !== 'STUDENT');
        }
        
        return response.data;
    },

    /**
     * Get staff counts by role for dashboard analytics.
     */
    getStaffStats: async (scopeId?: string): Promise<Record<string, number>> => {
        const staff = await staffService.getAllStaff({ scopeId });
        const stats: Record<string, number> = {};
        
        staff.forEach(s => {
            const roleName = s.role?.name || 'Unknown';
            stats[roleName] = (stats[roleName] || 0) + 1;
        });
        
        return stats;
    },

    /**
     * Get staff by specific role (Legacy wrapper)
     */
    getStaffByRole: async (role: string, scopeId?: string): Promise<StaffMember[]> => {
        return staffService.getAllStaff({ role, scopeId });
    }
};

export default staffService;
