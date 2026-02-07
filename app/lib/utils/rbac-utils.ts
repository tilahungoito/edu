import { Role } from '../types/roles';

/**
 * RBAC Utilities for frontend role and permission checking
 */

// Role hierarchy definition - matches backend
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
    SYSTEM_ADMIN: [
        'REGIONAL_ADMIN',
        'ZONE_ADMIN',
        'WOREDA_ADMIN',
        'KEBELE_ADMIN',
        'INSTITUTION_ADMIN',
        'REGISTRAR',
        'INSTRUCTOR',
        'ACCOUNTANT',
        'STUDENT',
    ],
    REGIONAL_ADMIN: [
        'ZONE_ADMIN',
        'WOREDA_ADMIN',
        'KEBELE_ADMIN',
        'INSTITUTION_ADMIN',
        'REGISTRAR',
        'INSTRUCTOR',
        'ACCOUNTANT',
        'STUDENT',
    ],
    ZONE_ADMIN: [
        'WOREDA_ADMIN',
        'KEBELE_ADMIN',
        'INSTITUTION_ADMIN',
        'REGISTRAR',
        'INSTRUCTOR',
        'ACCOUNTANT',
        'STUDENT',
    ],
    WOREDA_ADMIN: [
        'KEBELE_ADMIN',
        'INSTITUTION_ADMIN',
        'REGISTRAR',
        'INSTRUCTOR',
        'ACCOUNTANT',
        'STUDENT',
    ],
    KEBELE_ADMIN: ['INSTITUTION_ADMIN', 'REGISTRAR', 'INSTRUCTOR', 'ACCOUNTANT', 'STUDENT'],
    INSTITUTION_ADMIN: ['REGISTRAR', 'INSTRUCTOR', 'ACCOUNTANT', 'STUDENT'],
    REGISTRAR: [],
    INSTRUCTOR: [],
    ACCOUNTANT: [],
    STUDENT: [],
};

/**
 * Check if a user with a given role can manage/create users with another role
 */
export function canManageRole(userRole: Role, targetRole: Role): boolean {
    if (userRole === 'SYSTEM_ADMIN') return true;
    const allowedRoles = ROLE_HIERARCHY[userRole];
    return allowedRoles?.includes(targetRole) ?? false;
}

/**
 * Check if a user role has hierarchical access to content meant for another role
 * E.g., SYSTEM_ADMIN can access all content, REGIONAL_ADMIN can access regional content
 */
export function hasHierarchicalAccess(userRole: Role, requiredRole: Role): boolean {
    if (userRole === requiredRole) return true;
    if (userRole === 'SYSTEM_ADMIN') return true;

    const subordinateRoles = ROLE_HIERARCHY[userRole];
    return subordinateRoles?.includes(requiredRole) ?? false;
}

/**
 * Get all roles that a user can manage
 */
export function getManagedRoles(userRole: Role): Role[] {
    if (userRole === 'SYSTEM_ADMIN') {
        return Object.keys(ROLE_HIERARCHY) as Role[];
    }
    return ROLE_HIERARCHY[userRole] ?? [];
}

/**
 * Check if a role is an admin role
 */
export function isAdminRole(role: Role): boolean {
    return [
        'SYSTEM_ADMIN',
        'REGIONAL_ADMIN',
        'ZONE_ADMIN',
        'WOREDA_ADMIN',
        'KEBELE_ADMIN',
        'INSTITUTION_ADMIN',
    ].includes(role);
}

/**
 * Get the hierarchy level of a role (0 = highest, SYSTEM_ADMIN)
 */
export function getRoleLevel(role: Role): number {
    const levels: Record<Role, number> = {
        SYSTEM_ADMIN: 0,
        REGIONAL_ADMIN: 1,
        ZONE_ADMIN: 2,
        WOREDA_ADMIN: 3,
        KEBELE_ADMIN: 4,
        INSTITUTION_ADMIN: 5,
        REGISTRAR: 6,
        INSTRUCTOR: 6,
        ACCOUNTANT: 6,
        STUDENT: 7,
    };
    return levels[role] ?? 99;
}
