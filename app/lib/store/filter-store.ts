import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
    FilterGroup,
    FilterCondition,
    FilterLogic,
    FilterOperator,
    SavedFilter
} from '../types';

interface FilterState {
    // Current active filter
    activeFilter: FilterGroup | null;

    // Saved filters by module
    savedFilters: SavedFilter[];

    // Quick filter values (for header search, etc.)
    quickSearch: string;

    // Hierarchy filters
    selectedZoneId: string | null;
    selectedWoredaId: string | null;
    selectedSchoolId: string | null;

    // Date range filter
    dateFrom: Date | null;
    dateTo: Date | null;

    // Actions
    setActiveFilter: (filter: FilterGroup | null) => void;
    addCondition: (condition: Omit<FilterCondition, 'id'>) => void;
    removeCondition: (conditionId: string) => void;
    updateCondition: (conditionId: string, updates: Partial<FilterCondition>) => void;
    setFilterLogic: (logic: FilterLogic) => void;
    clearFilter: () => void;

    // Saved filters
    saveFilter: (name: string, description?: string, isShared?: boolean) => void;
    loadFilter: (filterId: string) => void;
    deleteFilter: (filterId: string) => void;

    // Quick filters
    setQuickSearch: (search: string) => void;
    setHierarchyFilter: (level: 'zone' | 'woreda' | 'school', id: string | null) => void;
    setDateRange: (from: Date | null, to: Date | null) => void;
    clearAllFilters: () => void;

    // Helpers
    hasActiveFilters: () => boolean;
    getFilterSummary: () => string;
}

// Generate UUID without external dependency
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const useFilterStore = create<FilterState>()(
    persist(
        (set, get) => ({
            activeFilter: null,
            savedFilters: [],
            quickSearch: '',
            selectedZoneId: null,
            selectedWoredaId: null,
            selectedSchoolId: null,
            dateFrom: null,
            dateTo: null,

            setActiveFilter: (filter) => set({ activeFilter: filter }),

            addCondition: (condition) => {
                const state = get();
                const newCondition: FilterCondition = {
                    ...condition,
                    id: generateId(),
                };

                if (!state.activeFilter) {
                    // Create new filter group
                    set({
                        activeFilter: {
                            id: generateId(),
                            logic: 'and',
                            conditions: [newCondition],
                        },
                    });
                } else {
                    // Add to existing filter
                    set({
                        activeFilter: {
                            ...state.activeFilter,
                            conditions: [...state.activeFilter.conditions, newCondition],
                        },
                    });
                }
            },

            removeCondition: (conditionId) => {
                const state = get();
                if (!state.activeFilter) return;

                const newConditions = state.activeFilter.conditions.filter(
                    c => 'id' in c && c.id !== conditionId
                );

                if (newConditions.length === 0) {
                    set({ activeFilter: null });
                } else {
                    set({
                        activeFilter: {
                            ...state.activeFilter,
                            conditions: newConditions,
                        },
                    });
                }
            },

            updateCondition: (conditionId, updates) => {
                const state = get();
                if (!state.activeFilter) return;

                const newConditions = state.activeFilter.conditions.map(c => {
                    if ('id' in c && c.id === conditionId) {
                        return { ...c, ...updates };
                    }
                    return c;
                });

                set({
                    activeFilter: {
                        ...state.activeFilter,
                        conditions: newConditions,
                    },
                });
            },

            setFilterLogic: (logic) => {
                const state = get();
                if (!state.activeFilter) return;

                set({
                    activeFilter: {
                        ...state.activeFilter,
                        logic,
                    },
                });
            },

            clearFilter: () => set({ activeFilter: null }),

            saveFilter: (name, description, isShared = false) => {
                const state = get();
                if (!state.activeFilter) return;

                const savedFilter: SavedFilter = {
                    id: generateId(),
                    name,
                    description,
                    module: 'general', // Would be set based on current page
                    filter: state.activeFilter,
                    isDefault: false,
                    isShared,
                    createdBy: 'current-user', // Would get from auth
                    createdAt: new Date(),
                };

                set({
                    savedFilters: [...state.savedFilters, savedFilter],
                });
            },

            loadFilter: (filterId) => {
                const state = get();
                const filter = state.savedFilters.find(f => f.id === filterId);
                if (filter) {
                    set({ activeFilter: filter.filter });
                }
            },

            deleteFilter: (filterId) => {
                set({
                    savedFilters: get().savedFilters.filter(f => f.id !== filterId),
                });
            },

            setQuickSearch: (search) => set({ quickSearch: search }),

            setHierarchyFilter: (level, id) => {
                if (level === 'zone') {
                    set({
                        selectedZoneId: id,
                        selectedWoredaId: null,
                        selectedSchoolId: null,
                    });
                } else if (level === 'woreda') {
                    set({
                        selectedWoredaId: id,
                        selectedSchoolId: null,
                    });
                } else {
                    set({ selectedSchoolId: id });
                }
            },

            setDateRange: (from, to) => set({ dateFrom: from, dateTo: to }),

            clearAllFilters: () => set({
                activeFilter: null,
                quickSearch: '',
                selectedZoneId: null,
                selectedWoredaId: null,
                selectedSchoolId: null,
                dateFrom: null,
                dateTo: null,
            }),

            hasActiveFilters: () => {
                const state = get();
                return !!(
                    state.activeFilter ||
                    state.quickSearch ||
                    state.selectedZoneId ||
                    state.selectedWoredaId ||
                    state.selectedSchoolId ||
                    state.dateFrom ||
                    state.dateTo
                );
            },

            getFilterSummary: () => {
                const state = get();
                const parts: string[] = [];

                if (state.quickSearch) parts.push(`Search: "${state.quickSearch}"`);
                if (state.selectedZoneId) parts.push('Zone filter');
                if (state.selectedWoredaId) parts.push('Woreda filter');
                if (state.selectedSchoolId) parts.push('School filter');
                if (state.dateFrom || state.dateTo) parts.push('Date range');
                if (state.activeFilter) {
                    parts.push(`${state.activeFilter.conditions.length} conditions`);
                }

                return parts.join(' • ') || 'No filters';
            },
        }),
        {
            name: 'tigray-edu-filters',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                savedFilters: state.savedFilters,
            }),
        }
    )
);

export default useFilterStore;
