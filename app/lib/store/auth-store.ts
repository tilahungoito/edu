import { create } from 'zustand';
import { authApi, type LoginResponse } from '../api/api-client';
import type {
    User,
    Permission,
    PermissionCheck,
    ModuleType,
    ActionType,
    ResourceType,
    TenantType
} from '../types/permissions';
import { hasHierarchicalAccess } from '../utils/rbac-utils';
import type { Role } from '../types/roles';

/**
 * Maps raw backend user data to the frontend User type.
 * This ensures consistency across the application and prevents runtime errors
 * when accessing properties like roles.
 */
export function mapBackendUserToFrontendUser(backendUser: any): User {
    const scopeType = backendUser.scopeType;
    const tenantType = mapScopeTypeToTenantType(scopeType);

    return {
        id: backendUser.id,
        email: backendUser.email,
        firstName: backendUser.firstName || backendUser.username,
        lastName: backendUser.lastName || '',
        username: backendUser.username,
        tenantType: tenantType,
        tenantId: backendUser.scopeId || '',
        tenantName: backendUser.tenantName || '',
        scopeType: scopeType as any,
        scopeId: backendUser.scopeId || undefined,
        roles: [{
            id: `role-${backendUser.role?.name || backendUser.role}`,
            name: backendUser.role?.name || backendUser.role,
            description: `${backendUser.role?.name || backendUser.role} role`,
            tenantType: tenantType,
            isSystemRole: true,
            permissions: backendUser.permissions || backendUser.role?.rolePermissions?.map((rp: any) => rp.permission) || [],
        }],
        permissions: backendUser.permissions || backendUser.role?.rolePermissions?.map((rp: any) => rp.permission) || [],
        isActive: backendUser.isActive !== undefined ? backendUser.isActive : true,
        profilePicture: backendUser.profilePicture,
        createdAt: backendUser.createdAt ? new Date(backendUser.createdAt) : new Date(),
        updatedAt: backendUser.updatedAt ? new Date(backendUser.updatedAt) : new Date(),
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    setUser: (user: User | null) => void;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
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
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Helper to delete cookie
function deleteCookie(name: string) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// NO PERSISTENCE - users must login every time
export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,

    setUser: (user) => set({
        user,
        isAuthenticated: !!user
    }),

    login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true });

        try {
            // Call real backend API
            const response: LoginResponse = await authApi.login({ email, password });

            // rememberMe: persist in localStorage (survives tab close) or sessionStorage (cleared on tab close)
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('access_token', response.access_token);

            // Also set cookie for SSR middleware — longer expiry when rememberMe is checked
            setCookie('access_token', response.access_token, rememberMe ? 30 : 1);

            // Map backend user to frontend User type
            const user = mapBackendUserToFrontendUser(response.user);

            set({ user, isAuthenticated: true, isLoading: false, token: response.access_token });
            return { success: true };
        } catch (error) {
            sessionStorage.removeItem('access_token');
            localStorage.removeItem('access_token');
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
        } catch {
            // Ignore backend logout errors — still clear local session
        } finally {
            sessionStorage.removeItem('access_token');
            localStorage.removeItem('access_token');
            deleteCookie('access_token');
            set({ user: null, isAuthenticated: false, token: null });
        }
    },

    initialize: async () => {
        const { isInitialized } = get();
        if (isInitialized) return;

        // Check both storages — localStorage (rememberMe) takes priority over sessionStorage
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

        if (!token) {
            set({ isInitialized: true });
            return;
        }

        try {
            // Verify token is still valid by fetching current user
            const response = await authApi.getMe();
            const user = mapBackendUserToFrontendUser(response);
            set({ user, isAuthenticated: true, isInitialized: true, token });
        } catch {
            // Token is invalid or expired — clear everything
            sessionStorage.removeItem('access_token');
            localStorage.removeItem('access_token');
            deleteCookie('access_token');
            set({ user: null, isAuthenticated: false, isInitialized: true, token: null });
        }
    },

    hasPermission: (check: PermissionCheck) => {
        const { user } = get();
        if (!user || !user.roles) return false;

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
        if (!user || !user.roles) return false;

        // SYSTEM_ADMIN has access to all modules
        if (user.roles.some(r => r.name === 'SYSTEM_ADMIN')) return true;

        const allPermissions = get().getAllPermissions();
        return allPermissions.some(p => p.module === module && p.action === 'view');
    },

    hasRole: (roleName: string) => {
        const { user } = get();
        if (!user || !user.roles) return false;

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
        if (!user || !user.roles || !user.permissions) return [];

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
function mapScopeTypeToTenantType(scopeType: string): TenantType {
    const mapping: Record<string, TenantType> = {
        'SYSTEM': 'bureau', // Map SYSTEM to bureau
        'REGION': 'bureau',
        'ZONE': 'zone',
        'WOREDA': 'woreda',
        'KEBELE': 'kebele',
        'INSTITUTION': 'school',
    };
    return mapping[scopeType] || 'school';
}

export default useAuthStore;

