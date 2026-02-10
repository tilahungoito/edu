'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useTenantStore, useAuthStore } from '../store';
import type { TenantType, TenantHierarchy } from '../types';

interface TenantContextValue {
    tenantType: TenantType;
    tenantId: string;
    tenantName: string;
    hierarchy: TenantHierarchy[];

    // Current selections
    selectedZoneId: string | null;
    selectedWoredaId: string | null;
    selectedSchoolId: string | null;

    // Effective context (considering selections)
    effectiveTenantId: string;
    effectiveTenantType: TenantType;

    // Actions
    selectZone: (zoneId: string | null) => void;
    selectWoreda: (woredaId: string | null) => void;
    selectSchool: (schoolId: string | null) => void;
    clearSelections: () => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
    children: React.ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
    const user = useAuthStore(state => state.user);
    const tenantStore = useTenantStore();

    // Sync tenant context with authenticated user
    useEffect(() => {
        if (user) {
            tenantStore.setTenantContext(
                user.tenantType,
                user.tenantId,
                user.tenantName || ''
            );
        }
    }, [user]);

    const value: TenantContextValue = {
        tenantType: tenantStore.tenantType,
        tenantId: tenantStore.tenantId,
        tenantName: tenantStore.tenantName,
        hierarchy: tenantStore.hierarchy,
        selectedZoneId: tenantStore.selectedZoneId,
        selectedWoredaId: tenantStore.selectedWoredaId,
        selectedSchoolId: tenantStore.selectedSchoolId,
        effectiveTenantId: tenantStore.getEffectiveTenantId(),
        effectiveTenantType: tenantStore.getEffectiveTenantType(),
        selectZone: tenantStore.selectZone,
        selectWoreda: tenantStore.selectWoreda,
        selectSchool: tenantStore.selectSchool,
        clearSelections: tenantStore.clearSelections,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}

/**
 * useTenant - Hook to access tenant context
 */
export function useTenant(): TenantContextValue {
    const context = useContext(TenantContext);

    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }

    return context;
}

/**
 * TenantBoundary - Component that renders children only if tenant context is available
 */
interface TenantBoundaryProps {
    children: React.ReactNode;
    allowedTenantTypes?: TenantType[];
    fallback?: React.ReactNode;
}

export function TenantBoundary({
    children,
    allowedTenantTypes,
    fallback = null
}: TenantBoundaryProps): React.ReactNode {
    const context = useContext(TenantContext);

    if (!context || !context.tenantId) {
        return fallback;
    }

    if (allowedTenantTypes && !allowedTenantTypes.includes(context.tenantType)) {
        return fallback;
    }

    return children;
}

/**
 * withTenantScope - HOC to inject tenant scope into data fetching
 */
export function withTenantScope<P extends object>(
    WrappedComponent: React.ComponentType<P & { tenantScope: TenantContextValue }>
) {
    return function TenantScopedComponent(props: P) {
        const tenantScope = useTenant();
        return <WrappedComponent {...props} tenantScope={tenantScope} />;
    };
}

export default TenantProvider;
