import { create } from 'zustand';
import { authApi, type LoginResponse } from '../api/api-client';
import type {
    User,
    Permission,
    PermissionCheck,
    ModuleType,
    ActionType,
    ResourceType
} from '../types/permissions';
import { hasHierarchicalAccess } from '../utils/rbac-utils';
import type { Role } from '../types/roles';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;

    // Permission checks
    hasPermission: (check: PermissionCheck) => boolean;
    hasModuleAccess: (module: ModuleType) => boolean;
    hasRole: (roleName: string) => boolean;
    canPerformAction: (module: ModuleType, action: ActionType, resourceType?: ResourceType) => boolean;
    getAllPermissions: () => Permission[];
}

// Helper to set cookie
function setCookie(name: string, value: string, days: number = 1) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

// Helper to delete cookie
function deleteCookie(name: string) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// NO PERSISTENCE - users must login every time
export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,

    setUser: (user) => set({
        user,
        isAuthenticated: !!user
    }),

    login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
            // Call real backend API
            const response: LoginResponse = await authApi.login({ email, password });

            // Store token in BOTH sessionStorage (client-side) AND cookie (server-side middleware)
            sessionStorage.setItem('access_token', response.access_token);
            setCookie('access_token', response.access_token, 1); // Expires in 1 day

            // Map backend user to frontend User type
            const user: User = {
                id: response.user.id,
                email: response.user.email,
                firstName: (response.user as any).firstName || response.user.username,
                lastName: (response.user as any).lastName || '',
                tenantType: mapScopeTypeToTenantType(response.user.scopeType),
                tenantId: response.user.scopeId || '',
                tenantName: '', // Will be populated by /auth/me endpoint if needed
                roles: [{
                    id: `role-${response.user.role}`,
                    name: response.user.role,
                    description: `${response.user.role} role`,
                    tenantType: mapScopeTypeToTenantType(response.user.scopeType),
                    isSystemRole: true,
                    permissions: response.user.permissions || [], // Use real permissions from backend
                }],
                permissions: response.user.permissions || [], // Flattened permissions for easier access
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            set({ user, isAuthenticated: true, isLoading: false });
            return { success: true };
        } catch (error) {
            sessionStorage.removeItem('access_token');
            deleteCookie('access_token');
            set({ isLoading: false, user: null, isAuthenticated: false });

            const errorMessage = error instanceof Error
                ? error.message
                : 'Invalid email or password';

            return { success: false, error: errorMessage };
        }
    },

    logout: async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Backend logout failed:', error);
        } finally {
            sessionStorage.removeItem('access_token');
            deleteCookie('access_token');
            set({ user: null, isAuthenticated: false });
        }
    },

    initialize: async () => {
        const { isInitialized } = get();
        if (isInitialized) return;

        const token = sessionStorage.getItem('access_token');
        if (!token) {
            set({ isInitialized: true });
            return;
        }

        try {
            // Verify token is still valid by fetching current user
            const response = await authApi.getMe();

            // Map backend user to frontend User type
            const user: User = {
                id: response.id,
                email: response.email,
                firstName: (response as any).firstName || response.username,
                lastName: (response as any).lastName || '',
                tenantType: mapScopeTypeToTenantType(response.scopeType),
                tenantId: response.scopeId || '',
                tenantName: '',
                roles: [{
                    id: response.role.id,
                    name: response.role.name,
                    description: `${response.role.name} role`,
                    tenantType: mapScopeTypeToTenantType(response.scopeType),
                    isSystemRole: true,
                    permissions: (response as any).permissions || [],
                }],
                permissions: (response as any).permissions || [],
                isActive: response.isActive,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            set({ user, isAuthenticated: true, isInitialized: true });
        } catch (error) {
            // Token is invalid or expired, clear it
            sessionStorage.removeItem('access_token');
            deleteCookie('access_token');
            set({ user: null, isAuthenticated: false, isInitialized: true });
        }
    },

    hasPermission: (check: PermissionCheck) => {
        const { user } = get();
        if (!user) return false;

        // SYSTEM_ADMIN has all permissions
        if (user.roles.some(r => r.name === 'SYSTEM_ADMIN')) return true;

        const allPermissions = get().getAllPermissions();

        return allPermissions.some(p =>
            p.module === check.module &&
            p.action === check.action &&
            (!check.resourceType || p.resourceType === check.resourceType || !p.resourceType)
        );
    },

    hasModuleAccess: (module: ModuleType) => {
        const { user } = get();
        if (!user) return false;

        // SYSTEM_ADMIN has access to all modules
        if (user.roles.some(r => r.name === 'SYSTEM_ADMIN')) return true;

        const allPermissions = get().getAllPermissions();
        return allPermissions.some(p => p.module === module && p.action === 'view');
    },

    hasRole: (roleName: string) => {
        const { user } = get();
        if (!user) return false;

        // Direct role check
        const hasDirectRole = user.roles.some(role => role.name === roleName);
        if (hasDirectRole) return true;

        // Hierarchical check - SYSTEM_ADMIN has all roles
        const userRole = user.roles[0]?.name as Role;
        if (!userRole) return false;

        return hasHierarchicalAccess(userRole, roleName as Role);
    },

    canPerformAction: (module: ModuleType, action: ActionType, resourceType?: ResourceType) => {
        return get().hasPermission({ module, action, resourceType });
    },

    getAllPermissions: () => {
        const { user } = get();
        if (!user) return [];

        // Combine role permissions and direct permissions
        const rolePermissions = user.roles.flatMap(role => role.permissions);
        const directPermissions = user.permissions;

        // Direct permissions override role permissions
        const permissionMap = new Map<string, Permission>();

        rolePermissions.forEach(p => {
            const key = `${p.module}-${p.action}-${p.resourceType || 'all'}`;
            permissionMap.set(key, p);
        });

        directPermissions.forEach(p => {
            const key = `${p.module}-${p.action}-${p.resourceType || 'all'}`;
            permissionMap.set(key, p);
        });

        return Array.from(permissionMap.values());
    },
}));

// Helper to map backend scopeType to frontend TenantType
function mapScopeTypeToTenantType(scopeType: string): 'bureau' | 'zone' | 'woreda' | 'school' {
    const mapping: Record<string, 'bureau' | 'zone' | 'woreda' | 'school'> = {
        'SYSTEM': 'bureau', // Map SYSTEM to bureau
        'REGION': 'bureau',
        'ZONE': 'zone',
        'WOREDA': 'woreda',
        'INSTITUTION': 'school',
        'KEBELE': 'school', // Map kebele to school for now
    };
    return mapping[scopeType] || 'school';
}

export default useAuthStore;

