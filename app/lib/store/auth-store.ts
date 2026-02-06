import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
    User,
    Permission,
    PermissionCheck,
    ModuleType,
    ActionType,
    ResourceType
} from '../types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;

    // Permission checks
    hasPermission: (check: PermissionCheck) => boolean;
    hasModuleAccess: (module: ModuleType) => boolean;
    canPerformAction: (module: ModuleType, action: ActionType, resourceType?: ResourceType) => boolean;
    getAllPermissions: () => Permission[];
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
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
                    // TODO: Replace with actual API call
                    // Mock login for development
                    const mockUser = getMockUser(email);

                    if (mockUser && password === 'demo123') {
                        set({ user: mockUser, isAuthenticated: true, isLoading: false });
                        return true;
                    }

                    set({ isLoading: false });
                    return false;
                } catch (error) {
                    console.error('Login error:', error);
                    set({ isLoading: false });
                    return false;
                }
            },

            logout: () => {
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
        }),
        {
            name: 'tigray-edu-auth',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);

// Mock user data for development
function getMockUser(email: string): User | null {
    const mockUsers: Record<string, User> = {
        'bureau@edu.gov.et': {
            id: 'user-bureau-001',
            email: 'bureau@edu.gov.et',
            firstName: 'Amanuel',
            lastName: 'Tesfaye',
            tenantType: 'bureau',
            tenantId: 'bureau-001',
            tenantName: 'Tigray Education Bureau',
            roles: [{
                id: 'role-bureau-admin',
                name: 'Bureau Admin',
                description: 'Full bureau access',
                tenantType: 'bureau',
                isSystemRole: true,
                permissions: generateBureauPermissions(),
            }],
            permissions: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        'zone@edu.gov.et': {
            id: 'user-zone-001',
            email: 'zone@edu.gov.et',
            firstName: 'Kidist',
            lastName: 'Hailu',
            tenantType: 'zone',
            tenantId: 'zone-001',
            tenantName: 'Mekelle Zone',
            roles: [{
                id: 'role-zone-admin',
                name: 'Zone Admin',
                description: 'Full zone access',
                tenantType: 'zone',
                isSystemRole: true,
                permissions: generateZonePermissions(),
            }],
            permissions: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        'woreda@edu.gov.et': {
            id: 'user-woreda-001',
            email: 'woreda@edu.gov.et',
            firstName: 'Bereket',
            lastName: 'Gebru',
            tenantType: 'woreda',
            tenantId: 'woreda-001',
            tenantName: 'Ayder Woreda',
            roles: [{
                id: 'role-woreda-admin',
                name: 'Woreda Admin',
                description: 'Full woreda access',
                tenantType: 'woreda',
                isSystemRole: true,
                permissions: generateWoredaPermissions(),
            }],
            permissions: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        'school@edu.gov.et': {
            id: 'user-school-001',
            email: 'school@edu.gov.et',
            firstName: 'Yohannes',
            lastName: 'Mehari',
            tenantType: 'school',
            tenantId: 'school-001',
            tenantName: 'Ayder Primary School',
            roles: [{
                id: 'role-school-admin',
                name: 'School Admin',
                description: 'Full school access',
                tenantType: 'school',
                isSystemRole: true,
                permissions: generateSchoolPermissions(),
            }],
            permissions: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    };

    return mockUsers[email] || null;
}

// Permission generators for each level
function generateBureauPermissions(): Permission[] {
    const modules: ModuleType[] = ['dashboard', 'analytics', 'management', 'hr', 'inventory', 'budget', 'reports', 'settings'];
    const actions: ActionType[] = ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'export', 'assign'];

    return modules.flatMap(module =>
        actions.map(action => ({
            id: `perm-bureau-${module}-${action}`,
            module,
            action,
            scope: 'all' as const,
        }))
    );
}

function generateZonePermissions(): Permission[] {
    const modules: ModuleType[] = ['dashboard', 'analytics', 'management', 'hr', 'inventory', 'budget', 'reports'];
    const actions: ActionType[] = ['view', 'create', 'edit', 'delete', 'approve', 'export', 'assign'];

    return modules.flatMap(module =>
        actions.map(action => ({
            id: `perm-zone-${module}-${action}`,
            module,
            action,
            scope: 'children' as const,
        }))
    );
}

function generateWoredaPermissions(): Permission[] {
    const modules: ModuleType[] = ['dashboard', 'analytics', 'management', 'hr', 'inventory', 'budget', 'reports'];
    const actions: ActionType[] = ['view', 'create', 'edit', 'approve', 'export'];

    return modules.flatMap(module =>
        actions.map(action => ({
            id: `perm-woreda-${module}-${action}`,
            module,
            action,
            scope: 'children' as const,
        }))
    );
}

function generateSchoolPermissions(): Permission[] {
    const modules: ModuleType[] = ['dashboard', 'analytics', 'hr', 'inventory', 'budget', 'reports'];
    const actions: ActionType[] = ['view', 'create', 'edit', 'export'];

    return modules.flatMap(module =>
        actions.map(action => ({
            id: `perm-school-${module}-${action}`,
            module,
            action,
            scope: 'own' as const,
        }))
    );
}

export default useAuthStore;
