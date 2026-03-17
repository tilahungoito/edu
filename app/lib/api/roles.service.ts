import apiClient from './api-client';
import { Role, Permission } from '../types/permissions';

export interface RoleWithCount extends Role {
    _count?: {
        users: number;
    };
}

export const rolesService = {
    getAllRoles: async (): Promise<RoleWithCount[]> => {
        const response = await apiClient.get<RoleWithCount[]>('roles');
        return response.data;
    },

    getRoleById: async (id: string): Promise<RoleWithCount> => {
        const response = await apiClient.get<RoleWithCount>(`roles/${id}`);
        return response.data;
    },

    createRole: async (data: { name: string; permissionIds?: string[] }): Promise<Role> => {
        const response = await apiClient.post<Role>('roles', data);
        return response.data;
    },

    deleteRole: async (id: string): Promise<void> => {
        await apiClient.delete(`roles/${id}`);
    },

    getAllPermissions: async (): Promise<Permission[]> => {
        const response = await apiClient.get<Permission[]>('roles/permissions/all');
        return response.data;
    },

    assignPermissions: async (roleId: string, permissionIds: string[]): Promise<Role> => {
        const response = await apiClient.post<Role>('roles/assign-permissions', { roleId, permissionIds });
        return response.data;
    },

    removePermissions: async (roleId: string, permissionIds: string[]): Promise<Role> => {
        const response = await apiClient.post<Role>(`roles/${roleId}/remove-permissions`, { permissionIds });
        return response.data;
    }
};

export default rolesService;
