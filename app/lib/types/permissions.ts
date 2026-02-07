// ====================================
// PERMISSION & AUTH TYPES
// ====================================

import { TenantType } from './entities';
export type { TenantType };

// Available modules in the system
export type ModuleType =
    | 'dashboard'
    | 'analytics'
    | 'management'
    | 'hr'
    | 'inventory'
    | 'budget'
    | 'reports'
    | 'settings'
    | 'audit'
    | 'students'
    | 'enrollment'
    | 'grading'
    | 'courses'
    | 'academic'
    | 'finance'
    | 'payments';

// Actions that can be performed
export type ActionType =
    | 'view'
    | 'create'
    | 'edit'
    | 'delete'
    | 'approve'
    | 'reject'
    | 'export'
    | 'assign';

// Scope of the permission
export type PermissionScope =
    | 'own'       // Only their own data
    | 'children'  // Their level and all children
    | 'all';      // Everything (bureau level)

// Resource types for granular permissions
export type ResourceType =
    | 'zone'
    | 'woreda'
    | 'school'
    | 'staff'
    | 'transfer'
    | 'asset'
    | 'supply'
    | 'budget'
    | 'user'
    | 'region'
    | 'enrollment'
    | 'course'
    | 'grade'
    | 'payment'
    | 'institution';

// Single permission
export interface Permission {
    id: string;
    module: ModuleType;
    action: ActionType;
    scope: PermissionScope;
    resourceType?: ResourceType;
    description?: string;
}

// Role with multiple permissions
export interface Role {
    id: string;
    name: string;
    description: string;
    tenantType: TenantType;
    permissions: Permission[];
    isSystemRole: boolean; // Cannot be modified
}

// User entity with permissions
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;

    // Tenant association
    tenantType: TenantType;
    tenantId: string; // ID of the zone/woreda/school they belong to
    tenantName?: string;

    // Roles and permissions
    roles: Role[];
    permissions: Permission[]; // Direct permissions (override roles)

    // Status
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Auth state
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// Tenant context
export interface TenantContext {
    tenantType: TenantType;
    tenantId: string;
    tenantName: string;

    // Parent hierarchy for breadcrumbs
    hierarchy: TenantHierarchy[];

    // For bureau users - currently selected view
    selectedZone?: string;
    selectedWoreda?: string;
    selectedSchool?: string;
}

export interface TenantHierarchy {
    type: TenantType;
    id: string;
    name: string;
}

// ====================================
// PERMISSION CHECK HELPERS
// ====================================

export interface PermissionCheck {
    module: ModuleType;
    action: ActionType;
    resourceType?: ResourceType;
}

// Menu item with permission
export interface MenuItem {
    id: string;
    label: string;
    labelAmharic?: string;
    icon?: string;
    path: string;
    permission?: PermissionCheck;
    allowedTenantTypes?: TenantType[];
    children?: MenuItem[];
    badge?: number;
}

// ====================================
// DEFAULT ROLES
// ====================================

export const DEFAULT_ROLES: Partial<Role>[] = [
    {
        name: 'Bureau Admin',
        description: 'Full access to all bureau-level functions',
        tenantType: 'bureau',
        isSystemRole: true,
    },
    {
        name: 'Zone Admin',
        description: 'Full access to zone and children',
        tenantType: 'zone',
        isSystemRole: true,
    },
    {
        name: 'Woreda Admin',
        description: 'Full access to woreda and schools',
        tenantType: 'woreda',
        isSystemRole: true,
    },
    {
        name: 'School Admin',
        description: 'Full access to school functions',
        tenantType: 'school',
        isSystemRole: true,
    },
    {
        name: 'Viewer',
        description: 'View-only access',
        tenantType: 'bureau',
        isSystemRole: true,
    },
];
