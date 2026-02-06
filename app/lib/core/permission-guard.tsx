'use client';

import React from 'react';
import { useAuthStore } from '../store';
import type { PermissionCheck, ModuleType, ActionType, ResourceType } from '../types';

interface PermissionGateProps {
    permission: PermissionCheck;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * PermissionGate - Conditionally render children based on user permissions
 * 
 * @example
 * <PermissionGate permission={{ module: 'hr', action: 'create' }}>
 *   <CreateButton />
 * </PermissionGate>
 */
export function PermissionGate({
    permission,
    children,
    fallback = null
}: PermissionGateProps): React.ReactNode {
    const hasPermission = useAuthStore(state => state.hasPermission);

    if (hasPermission(permission)) {
        return children;
    }

    return fallback;
}

interface RequirePermissionProps {
    module: ModuleType;
    action: ActionType;
    resourceType?: ResourceType;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * RequirePermission - Alternative API for permission gating
 */
export function RequirePermission({
    module,
    action,
    resourceType,
    children,
    fallback = null,
}: RequirePermissionProps): React.ReactNode {
    return (
        <PermissionGate
            permission={{ module, action, resourceType }}
            fallback={fallback}
        >
            {children}
        </PermissionGate>
    );
}

interface ModuleGateProps {
    module: ModuleType;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * ModuleGate - Check if user has access to a module (view permission)
 */
export function ModuleGate({
    module,
    children,
    fallback = null
}: ModuleGateProps): React.ReactNode {
    const hasModuleAccess = useAuthStore(state => state.hasModuleAccess);

    if (hasModuleAccess(module)) {
        return children;
    }

    return fallback;
}

// ====================================
// PERMISSION HOOKS
// ====================================

/**
 * usePermission - Hook to check permissions imperatively
 */
export function usePermission(permission: PermissionCheck): boolean {
    return useAuthStore(state => state.hasPermission(permission));
}

/**
 * useModuleAccess - Hook to check module access
 */
export function useModuleAccess(module: ModuleType): boolean {
    return useAuthStore(state => state.hasModuleAccess(module));
}

/**
 * useCanPerformAction - Hook to check action permission
 */
export function useCanPerformAction(
    module: ModuleType,
    action: ActionType,
    resourceType?: ResourceType
): boolean {
    return useAuthStore(state =>
        state.canPerformAction(module, action, resourceType)
    );
}

/**
 * useAllPermissions - Get all user permissions
 */
export function useAllPermissions() {
    return useAuthStore(state => state.getAllPermissions());
}

export default PermissionGate;
