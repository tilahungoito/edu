import type { ModuleType, PermissionCheck, MenuItem } from '../types';

// ====================================
// MODULE REGISTRY
// ====================================

export interface ModuleConfig {
    id: ModuleType;
    name: string;
    description: string;
    icon: string;
    basePath: string;
    requiredPermission: PermissionCheck;
    menuItems: MenuItem[];
    isEnabled: boolean;
    order: number;
    category?: string;
}

class ModuleRegistry {
    private modules: Map<ModuleType, ModuleConfig> = new Map();

    register(config: ModuleConfig): void {
        this.modules.set(config.id, config);
    }

    unregister(moduleId: ModuleType): void {
        this.modules.delete(moduleId);
    }

    get(moduleId: ModuleType): ModuleConfig | undefined {
        return this.modules.get(moduleId);
    }

    getAll(): ModuleConfig[] {
        return Array.from(this.modules.values())
            .filter(m => m.isEnabled)
            .sort((a, b) => a.order - b.order);
    }

    getMenuItems(): MenuItem[] {
        return this.getAll().flatMap(m => m.menuItems);
    }

    isModuleEnabled(moduleId: ModuleType): boolean {
        const module = this.modules.get(moduleId);
        return module?.isEnabled ?? false;
    }

    enableModule(moduleId: ModuleType): void {
        const module = this.modules.get(moduleId);
        if (module) {
            module.isEnabled = true;
        }
    }

    disableModule(moduleId: ModuleType): void {
        const module = this.modules.get(moduleId);
        if (module) {
            module.isEnabled = false;
        }
    }
}

// Singleton instance
export const moduleRegistry = new ModuleRegistry();

// ====================================
// DEFAULT MODULE REGISTRATIONS
// ====================================

// Dashboard Module
moduleRegistry.register({
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Overview and KPI dashboards',
    icon: 'Dashboard',
    basePath: '/dashboard',
    requiredPermission: { module: 'dashboard', action: 'view' },
    isEnabled: true,
    order: 1,
    category: 'Main',
    menuItems: [
        {
            id: 'dashboard-overview',
            label: 'Overview',
            labelAmharic: 'አጠቃላይ እይታ',
            icon: 'Dashboard',
            path: '/dashboard',
            permission: { module: 'dashboard', action: 'view' },
        },
    ],
});

// Analytics Module
moduleRegistry.register({
    id: 'analytics',
    name: 'Analytics',
    description: 'Data analysis and reporting',
    icon: 'Analytics',
    basePath: '/analytics',
    requiredPermission: { module: 'analytics', action: 'view' },
    isEnabled: true,
    order: 2,
    category: 'Main',
    menuItems: [
        {
            id: 'analytics-overview',
            label: 'Analytics Overview',
            labelAmharic: 'የትንታኔ አጠቃላይ እይታ',
            icon: 'BarChart',
            path: '/analytics',
            permission: { module: 'analytics', action: 'view' },
            children: [
                {
                    id: 'analytics-performance',
                    label: 'Performance',
                    path: '/analytics/performance',
                    permission: { module: 'analytics', action: 'view' },
                },
                {
                    id: 'analytics-enrollment',
                    label: 'Enrollment',
                    path: '/analytics/enrollment',
                    permission: { module: 'analytics', action: 'view' },
                },
            ],
        },
    ],
});

// Management Module
moduleRegistry.register({
    id: 'management',
    name: 'Management',
    description: 'Entity management (Zones, Woredas, Schools)',
    icon: 'Business',
    basePath: '/management',
    requiredPermission: { module: 'management', action: 'view' },
    isEnabled: true,
    order: 3,
    category: 'Entities',
    menuItems: [
        {
            id: 'management-regions',
            label: 'Regions',
            labelAmharic: 'ክልሎች',
            icon: 'Map',
            path: '/management/regions',
            permission: { module: 'management', action: 'view', resourceType: 'region' },
            allowedTenantTypes: ['bureau'],
        },
        {
            id: 'management-zones',
            label: 'Zones',
            labelAmharic: 'ዞኖች',
            icon: 'Map',
            path: '/management/zones',
            permission: { module: 'management', action: 'view', resourceType: 'zone' },
            allowedTenantTypes: ['bureau'],
        },
        {
            id: 'management-woredas',
            label: 'Woredas',
            labelAmharic: 'ወረዳዎች',
            icon: 'LocationCity',
            path: '/management/woredas',
            permission: { module: 'management', action: 'view', resourceType: 'woreda' },
            allowedTenantTypes: ['bureau', 'zone'],
        },
        {
            id: 'management-schools',
            label: 'Schools',
            labelAmharic: 'ትምህርት ቤቶች',
            icon: 'School',
            path: '/management/schools',
            permission: { module: 'management', action: 'view', resourceType: 'school' },
            allowedTenantTypes: ['bureau', 'zone', 'woreda'],
        },
        {
            id: 'management-users',
            label: 'Users',
            labelAmharic: 'ተጠቃሚዎች',
            icon: 'People',
            path: '/management/users',
            permission: { module: 'management', action: 'view', resourceType: 'user' },
            allowedTenantTypes: ['bureau', 'zone', 'woreda'],
        },
    ],
});

// HR Module
moduleRegistry.register({
    id: 'hr',
    name: 'Human Resources',
    description: 'Staff and transfer management',
    icon: 'People',
    basePath: '/hr',
    requiredPermission: { module: 'hr', action: 'view' },
    isEnabled: true,
    order: 4,
    category: 'HR & Staffing',
    menuItems: [
        {
            id: 'hr-staff',
            label: 'Staff',
            labelAmharic: 'ሠራተኞች',
            icon: 'Badge',
            path: '/hr/staff',
            permission: { module: 'hr', action: 'view', resourceType: 'staff' },
        },
        {
            id: 'hr-transfers',
            label: 'Transfers',
            labelAmharic: 'ዝውውሮች',
            icon: 'SwapHoriz',
            path: '/hr/transfers',
            permission: { module: 'hr', action: 'view', resourceType: 'transfer' },
        },
        {
            id: 'hr-approvals',
            label: 'Approvals',
            labelAmharic: 'ማጽደቆች',
            icon: 'HowToReg',
            path: '/hr/approvals',
            permission: { module: 'hr', action: 'approve', resourceType: 'transfer' },
        },
    ],
});

// Inventory Module
moduleRegistry.register({
    id: 'inventory',
    name: 'Inventory',
    description: 'Asset and supply management',
    icon: 'Inventory',
    basePath: '/inventory',
    requiredPermission: { module: 'inventory', action: 'view' },
    isEnabled: true,
    order: 5,
    category: 'Operations',
    menuItems: [
        {
            id: 'inventory-overview',
            label: 'Inventory Overview',
            labelAmharic: 'የእቃ ቆጠራ አጠቃላይ እይታ',
            icon: 'Inventory2',
            path: '/inventory',
            permission: { module: 'inventory', action: 'view' },
        },
        {
            id: 'inventory-assets',
            label: 'Assets',
            labelAmharic: 'ንብረቶች',
            icon: 'Devices',
            path: '/inventory/assets',
            permission: { module: 'inventory', action: 'view', resourceType: 'asset' },
        },
        {
            id: 'inventory-supplies',
            label: 'Supplies',
            labelAmharic: 'አቅርቦቶች',
            icon: 'LocalShipping',
            path: '/inventory/supplies',
            permission: { module: 'inventory', action: 'view', resourceType: 'supply' },
        },
        {
            id: 'inventory-requests',
            label: 'Requests',
            labelAmharic: 'ጥያቄዎች',
            icon: 'Inbox',
            path: '/inventory/requests',
            permission: { module: 'inventory', action: 'view' },
        },
    ],
});

// Budget Module
moduleRegistry.register({
    id: 'budget',
    name: 'Budget',
    description: 'Budget allocation and expenditure',
    icon: 'AccountBalance',
    basePath: '/budget',
    requiredPermission: { module: 'budget', action: 'view' },
    isEnabled: true,
    order: 6,
    category: 'Operations',
    menuItems: [
        {
            id: 'budget-overview',
            label: 'Budget Overview',
            labelAmharic: 'የበጀት አጠቃላይ እይታ',
            icon: 'PieChart',
            path: '/budget',
            permission: { module: 'budget', action: 'view' },
        },
        {
            id: 'budget-allocations',
            label: 'Allocations',
            labelAmharic: 'ምደባዎች',
            icon: 'AccountTree',
            path: '/budget/allocations',
            permission: { module: 'budget', action: 'view' },
        },
        {
            id: 'budget-expenditure',
            label: 'Expenditure',
            labelAmharic: 'ወጪዎች',
            icon: 'Receipt',
            path: '/budget/expenditure',
            permission: { module: 'budget', action: 'view' },
        },
        {
            id: 'budget-requests',
            label: 'Budget Requests',
            labelAmharic: 'የበጀት ጥያቄዎች',
            icon: 'RequestQuote',
            path: '/budget/requests',
            permission: { module: 'budget', action: 'view' },
        },
    ],
});

// Reports Module
moduleRegistry.register({
    id: 'reports',
    name: 'Reports',
    description: 'Generate and export reports',
    icon: 'Assessment',
    basePath: '/reports',
    requiredPermission: { module: 'reports', action: 'view' },
    isEnabled: true,
    order: 7,
    category: 'Reports',
    menuItems: [
        {
            id: 'reports-generator',
            label: 'Report Generator',
            labelAmharic: 'ሪፖርት ማመንጫ',
            icon: 'Description',
            path: '/reports',
            permission: { module: 'reports', action: 'view' },
        },
        {
            id: 'reports-scheduled',
            label: 'Scheduled Reports',
            labelAmharic: 'የታቀዱ ሪፖርቶች',
            icon: 'Schedule',
            path: '/reports/scheduled',
            permission: { module: 'reports', action: 'view' },
        },
    ],
});

// Settings Module
moduleRegistry.register({
    id: 'settings',
    name: 'Settings',
    description: 'System configuration',
    icon: 'Settings',
    basePath: '/settings',
    requiredPermission: { module: 'settings', action: 'view' },
    isEnabled: true,
    order: 8,
    category: 'System',
    menuItems: [
        {
            id: 'settings-general',
            label: 'General Settings',
            labelAmharic: 'አጠቃላይ ቅንብሮች',
            icon: 'Tune',
            path: '/settings',
            permission: { module: 'settings', action: 'view' },
        },
        {
            id: 'settings-roles',
            label: 'Roles & Permissions',
            labelAmharic: 'ሚናዎች እና ፈቃዶች',
            icon: 'Security',
            path: '/settings/roles',
            permission: { module: 'settings', action: 'edit' },
        },
        {
            id: 'settings-audit',
            label: 'Audit Logs',
            labelAmharic: 'የኦዲት ምዝግብ ማስታወሻዎች',
            icon: 'Description',
            path: '/management/audit',
            permission: { module: 'audit', action: 'view' },
            allowedTenantTypes: ['bureau'],
        },
    ],
});

export default moduleRegistry;
