import { create } from 'zustand';
import type { TenantType, TenantHierarchy } from '../types';

interface TenantState {
    // Current tenant context
    tenantType: TenantType;
    tenantId: string;
    tenantName: string;

    // Full hierarchy path
    hierarchy: TenantHierarchy[];

    // For users who can view multiple levels (bureau/zone users)
    selectedZoneId: string | null;
    selectedWoredaId: string | null;
    selectedSchoolId: string | null;

    // Actions
    setTenantContext: (type: TenantType, id: string, name: string) => void;
    setHierarchy: (hierarchy: TenantHierarchy[]) => void;
    selectZone: (zoneId: string | null) => void;
    selectWoreda: (woredaId: string | null) => void;
    selectSchool: (schoolId: string | null) => void;
    clearSelections: () => void;

    // Helpers
    getEffectiveTenantId: () => string;
    getEffectiveTenantType: () => TenantType;
    getBreadcrumbs: () => TenantHierarchy[];
}

export const useTenantStore = create<TenantState>()((set, get) => ({
    tenantType: 'bureau',
    tenantId: '',
    tenantName: '',
    hierarchy: [],
    selectedZoneId: null,
    selectedWoredaId: null,
    selectedSchoolId: null,

    setTenantContext: (type, id, name) => {
        set({
            tenantType: type,
            tenantId: id,
            tenantName: name,
            // Clear selections when context changes
            selectedZoneId: null,
            selectedWoredaId: null,
            selectedSchoolId: null,
        });
    },

    setHierarchy: (hierarchy) => set({ hierarchy }),

    selectZone: (zoneId) => {
        set({
            selectedZoneId: zoneId,
            // Clear child selections when parent changes
            selectedWoredaId: null,
            selectedSchoolId: null,
        });
    },

    selectWoreda: (woredaId) => {
        set({
            selectedWoredaId: woredaId,
            selectedSchoolId: null,
        });
    },

    selectSchool: (schoolId) => {
        set({ selectedSchoolId: schoolId });
    },

    clearSelections: () => {
        set({
            selectedZoneId: null,
            selectedWoredaId: null,
            selectedSchoolId: null,
        });
    },

    getEffectiveTenantId: () => {
        const state = get();

        // Return the most specific selection
        if (state.selectedSchoolId) return state.selectedSchoolId;
        if (state.selectedWoredaId) return state.selectedWoredaId;
        if (state.selectedZoneId) return state.selectedZoneId;
        return state.tenantId;
    },

    getEffectiveTenantType: () => {
        const state = get();

        if (state.selectedSchoolId) return 'school';
        if (state.selectedWoredaId) return 'woreda';
        if (state.selectedZoneId) return 'zone';
        return state.tenantType;
    },

    getBreadcrumbs: () => {
        const state = get();
        const breadcrumbs: TenantHierarchy[] = [];

        // Always start with base tenant
        breadcrumbs.push({
            type: state.tenantType,
            id: state.tenantId,
            name: state.tenantName,
        });

        // Add selections if present
        // These would need to be enriched with actual names from data
        if (state.selectedZoneId && state.tenantType === 'bureau') {
            breadcrumbs.push({
                type: 'zone',
                id: state.selectedZoneId,
                name: 'Selected Zone', // Would be replaced with actual name
            });
        }

        if (state.selectedWoredaId) {
            breadcrumbs.push({
                type: 'woreda',
                id: state.selectedWoredaId,
                name: 'Selected Woreda',
            });
        }

        if (state.selectedSchoolId) {
            breadcrumbs.push({
                type: 'school',
                id: state.selectedSchoolId,
                name: 'Selected School',
            });
        }

        return breadcrumbs;
    },
}));

export default useTenantStore;
