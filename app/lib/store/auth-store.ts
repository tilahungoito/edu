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

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;

    // Permission checks
    hasPermission: (check: PermissionCheck) => boolean;
    hasModuleAccess: (module: ModuleType) => boolean;
    canPerformAction: (module: ModuleType, action: ActionType, resourceType?: ResourceType) => boolean;
    getAllPermissions: () => Permission[];
}

// NO PERSISTENCE - users must login every time
export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,

    setUser: (user) => set({
        user,
        isAuthenticated: !!user
    }),

    login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
            // Call real backend API
            const response: LoginResponse = await authApi.login({ email, password });

            // Store token in sessionStorage (cleared on browser close)
            sessionStorage.setItem('access_token', response.access_token);

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
            set({ isLoading: false, user: null, isAuthenticated: false });

            const errorMessage = error instanceof Error
                ? error.message
                : 'Invalid email or password';

            return { success: false, error: errorMessage };
        }
    },

    logout: () => {
        sessionStorage.removeItem('access_token');
        set({ user: null, isAuthenticated: false });
    },

    hasPermission: (check: PermissionCheck) => {
        const { user } = get();
        if (!user) return false;

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

        const allPermissions = get().getAllPermissions();
        return allPermissions.some(p => p.module === module && p.action === 'view');
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

