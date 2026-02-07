/**
 * Shared type definitions for roles
 * This ensures consistency between frontend components
 */

export type Role =
    | 'SYSTEM_ADMIN'
    | 'REGIONAL_ADMIN'
    | 'ZONE_ADMIN'
    | 'WOREDA_ADMIN'
    | 'KEBELE_ADMIN'
    | 'INSTITUTION_ADMIN'
    | 'REGISTRAR'
    | 'INSTRUCTOR'
    | 'ACCOUNTANT'
    | 'STUDENT';

export const ROLES = {
    SYSTEM_ADMIN: 'SYSTEM_ADMIN' as Role,
    REGIONAL_ADMIN: 'REGIONAL_ADMIN' as Role,
    ZONE_ADMIN: 'ZONE_ADMIN' as Role,
    WOREDA_ADMIN: 'WOREDA_ADMIN' as Role,
    KEBELE_ADMIN: 'KEBELE_ADMIN' as Role,
    INSTITUTION_ADMIN: 'INSTITUTION_ADMIN' as Role,
    REGISTRAR: 'REGISTRAR' as Role,
    INSTRUCTOR: 'INSTRUCTOR' as Role,
    ACCOUNTANT: 'ACCOUNTANT' as Role,
    STUDENT: 'STUDENT' as Role,
};
