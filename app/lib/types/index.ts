// Main type exports
export * from './entities';
export * from './permissions';

// ====================================
// FILTER TYPES
// ====================================

export type FilterOperator =
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterOrEqual'
    | 'lessOrEqual'
    | 'between'
    | 'in'
    | 'notIn'
    | 'isEmpty'
    | 'isNotEmpty';

export type FilterLogic = 'and' | 'or';

export interface FilterCondition {
    id: string;
    field: string;
    operator: FilterOperator;
    value: unknown;
    valueTo?: unknown; // For 'between' operator
}

export interface FilterGroup {
    id: string;
    logic: FilterLogic;
    conditions: (FilterCondition | FilterGroup)[];
}

export interface SavedFilter {
    id: string;
    name: string;
    description?: string;
    module: string;
    filter: FilterGroup;
    isDefault: boolean;
    isShared: boolean;
    createdBy: string;
    createdAt: Date;
}

// ====================================
// TABLE TYPES
// ====================================

export interface ColumnDefinition<T = unknown> {
    field: keyof T | string;
    headerName: string;
    width?: number;
    minWidth?: number;
    flex?: number;
    sortable?: boolean;
    filterable?: boolean;
    hideable?: boolean;
    type?: 'string' | 'number' | 'date' | 'boolean' | 'actions';
    valueFormatter?: (value: unknown) => string;
    renderCell?: (row: T) => React.ReactNode;
}

export interface TableState {
    page: number;
    pageSize: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    filters?: FilterGroup;
    selectedRows: string[];
    columnVisibility: Record<string, boolean>;
    density: 'compact' | 'standard' | 'comfortable';
}

// ====================================
// API RESPONSE TYPES
// ====================================

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// ====================================
// NOTIFICATION TYPES
// ====================================

export type NotificationType =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'transfer_request'
    | 'budget_request'
    | 'inventory_request';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: Date;
}

// ====================================
// EXPORT TYPES
// ====================================

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ExportOptions {
    format: ExportFormat;
    filename: string;
    title?: string;
    columns: string[];
    filters?: FilterGroup;
    includeHeaders: boolean;
    dateRange?: {
        start: Date;
        end: Date;
    };
}
