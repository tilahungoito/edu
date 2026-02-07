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
            children: [
                {
                    id: 'analytics-performance',
                    label: 'Performance',
                    path: '/analytics/performance',
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

// Communication Module (System Admin Broadcaster)
moduleRegistry.register({
    id: 'communication',
    name: 'Communication',
    description: 'System-wide announcements and support',
    icon: 'Notifications',
    basePath: '/communication',
    requiredPermission: { module: 'communication', action: 'view' },
    isEnabled: true,
    order: 3,
    category: 'Main',
    menuItems: [
        {
            id: 'comm-announcements',
            label: 'Announcements',
            icon: 'Notifications',
            path: '/communication/announcements',
            permission: { module: 'communication', action: 'view', resourceType: 'announcement' },
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN'],
        },
        {
            id: 'comm-help',
            label: 'Help Requests',
            icon: 'ContactSupport',
            path: '/communication/support',
        },
    ],
});

// Management Module
moduleRegistry.register({
    id: 'management',
    name: 'Management',
    description: 'Entity management (Regions, Zones, Woredas, Kebeles, Schools)',
    icon: 'Business',
    basePath: '/management',
    requiredPermission: { module: 'management', action: 'view' },
    isEnabled: true,
    order: 4,
    category: 'Hierarchy',
    menuItems: [
        // Regions: Only System Admin can see and manage
        {
            id: 'management-regions',
            label: 'Regions',
            labelAmharic: 'ክልሎች',
            icon: 'Map',
            path: '/management/regions',
            permission: { module: 'management', action: 'view', resourceType: 'region' },
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN'],
        },
        // Zones: System Admin & Regional Admin
        {
            id: 'management-zones',
            label: 'Zones',
            labelAmharic: 'ዞኖች',
            icon: 'LocationCity',
            path: '/management/zones',
            permission: { module: 'management', action: 'view', resourceType: 'zone' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN'],
        },
        // Woredas: System Admin, Regional Admin, Zone Admin
        {
            id: 'management-woredas',
            label: 'Woredas',
            labelAmharic: 'ወረዳዎች',
            icon: 'Business',
            path: '/management/woredas',
            permission: { module: 'management', action: 'view', resourceType: 'woreda' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN'],
        },
        // Kebeles: System Admin, Regional Admin, Zone Admin, Woreda Admin
        {
            id: 'management-kebeles',
            label: 'Kebeles',
            labelAmharic: 'ቀበሌዎች',
            icon: 'LocationCity',
            path: '/management/kebeles',
            permission: { module: 'management', action: 'view', resourceType: 'kebele' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN'],
        },
        // Schools/Institutions: All hierarchy admins including Kebele Admin
        {
            id: 'management-schools',
            label: 'Schools',
            labelAmharic: 'ትምህርት ቤቶች',
            icon: 'School',
            path: '/management/schools',
            permission: { module: 'management', action: 'view', resourceType: 'institution' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN'],
        },
    ],
});

// Students Module (Registrar Focus)
moduleRegistry.register({
    id: 'students',
    name: 'Students',
    description: 'Student registration and records',
    icon: 'People',
    basePath: '/students',
    requiredPermission: { module: 'students', action: 'view' },
    isEnabled: true,
    order: 5,
    category: 'Core',
    menuItems: [
        {
            id: 'students-list',
            label: 'All Students',
            labelAmharic: 'ሁሉም ተማሪዎች',
            icon: 'People',
            path: '/students',
            permission: { module: 'students', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR'],
        },
        {
            id: 'students-registration',
            label: 'Registration',
            labelAmharic: 'ምዝገባ',
            icon: 'Badge',
            path: '/students/register',
            permission: { module: 'students', action: 'create' },
            allowedRoles: ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR'],
        },
    ],
});

// Academic Module (Instructor/Student Focus)
moduleRegistry.register({
    id: 'academic',
    name: 'Academic',
    description: 'Course and grade management',
    icon: 'School',
    basePath: '/academic',
    requiredPermission: { module: 'academic', action: 'view' },
    isEnabled: true,
    order: 6,
    category: 'Core',
    menuItems: [
        {
            id: 'academic-courses',
            label: 'My Courses',
            labelAmharic: 'የእኔ ኮርሶች',
            icon: 'School',
            path: '/academic/courses',
            permission: { module: 'courses', action: 'view' },
            allowedRoles: ['INSTRUCTOR', 'STUDENT'],
        },
        {
            id: 'academic-grades',
            label: 'Grades',
            labelAmharic: 'ውጤቶች',
            icon: 'Assessment',
            path: '/academic/grades',
            permission: { module: 'grading', action: 'view' },
            allowedRoles: ['INSTRUCTOR', 'STUDENT', 'REGISTRAR'],
        },
        {
            id: 'academic-attendance',
            label: 'Attendance',
            labelAmharic: 'መገኘት',
            icon: 'CalendarMonth',
            path: '/academic/attendance',
            permission: { module: 'academic', action: 'view' },
            allowedRoles: ['INSTRUCTOR', 'STUDENT', 'REGISTRAR'],
        },
    ],
});

// Academic Config Module (System Admin Standardizer)
moduleRegistry.register({
    id: 'academic-config',
    name: 'Academic Config',
    description: 'Global academic standards',
    icon: 'CalendarMonth',
    basePath: '/academic/config',
    requiredPermission: { module: 'academic', action: 'edit' },
    isEnabled: true,
    order: 7,
    category: 'Academic Config',
    menuItems: [
        {
            id: 'ac-calendar',
            label: 'Academic Year/Periods',
            icon: 'CalendarMonth',
            path: '/academic/config/periods',
            permission: { module: 'academic', action: 'edit', resourceType: 'calendar' },
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN'],
        },
        {
            id: 'ac-subjects',
            label: 'Subject Registry',
            icon: 'Assignment',
            path: '/academic/config/subjects',
            permission: { module: 'academic', action: 'edit', resourceType: 'subject' },
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN'],
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
    order: 8,
    category: 'Staffing',
    menuItems: [
        {
            id: 'hr-staff',
            label: 'Staff List',
            labelAmharic: 'የሠራተኞች ዝርዝር',
            icon: 'Badge',
            path: '/hr/staff',
            permission: { module: 'hr', action: 'view', resourceType: 'staff' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN'],
        },
        {
            id: 'hr-transfers',
            label: 'Transfers',
            labelAmharic: 'ዝውውሮች',
            icon: 'SwapHoriz',
            path: '/hr/transfers',
            permission: { module: 'hr', action: 'view', resourceType: 'transfer' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN'],
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
    order: 9,
    category: 'Operations',
    menuItems: [
        {
            id: 'inventory-overview',
            label: 'Inventory',
            labelAmharic: 'ንብረት',
            icon: 'Inventory2',
            path: '/inventory',
            permission: { module: 'inventory', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN', 'ACCOUNTANT'],
        },
    ],
});

// Finance Module
moduleRegistry.register({
    id: 'finance',
    name: 'Finance & Payments',
    description: 'Payment and financial management',
    icon: 'AccountBalance',
    basePath: '/finance',
    requiredPermission: { module: 'finance', action: 'view' },
    isEnabled: true,
    order: 10,
    category: 'Finance',
    menuItems: [
        {
            id: 'finance-payments',
            label: 'Payments',
            labelAmharic: 'ክፍያዎች',
            icon: 'Receipt',
            path: '/finance/payments',
            permission: { module: 'payments', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN', 'ACCOUNTANT'],
        },
    ],
});

// Budget Module
moduleRegistry.register({
    id: 'budget',
    name: 'Budget & Planning',
    description: 'Budget allocation and planning',
    icon: 'AccountBalance',
    basePath: '/budget',
    requiredPermission: { module: 'budget', action: 'view' },
    isEnabled: true,
    order: 11,
    category: 'Finance',
    menuItems: [
        {
            id: 'budget-overview',
            label: 'Budget Overview',
            labelAmharic: 'የበጀት አጠቃላይ እይታ',
            icon: 'PieChart',
            path: '/budget',
            permission: { module: 'budget', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'ACCOUNTANT'],
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
    order: 12,
    category: 'Reports',
    menuItems: [
        {
            id: 'reports-generator',
            label: 'Report Generator',
            labelAmharic: 'ሪፖርት ማመንጫ',
            icon: 'Description',
            path: '/reports',
            permission: { module: 'reports', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN', 'ACCOUNTANT', 'REGISTRAR'],
        },
        {
            id: 'reports-scheduled',
            label: 'Scheduled Reports',
            labelAmharic: 'የታቀዱ ሪፖርቶች',
            icon: 'Schedule',
            path: '/reports/scheduled',
            permission: { module: 'reports', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN', 'ACCOUNTANT'],
        },
    ],
});

// Monitoring Module (System Health)
moduleRegistry.register({
    id: 'monitoring',
    name: 'Monitoring',
    description: 'System health and audit logs',
    icon: 'Dns',
    basePath: '/system/monitoring',
    requiredPermission: { module: 'monitoring', action: 'view' },
    isEnabled: true,
    order: 13,
    category: 'System',
    menuItems: [
        {
            id: 'mon-audit',
            label: 'Audit Logs',
            icon: 'Description',
            path: '/system/monitoring/audit',
            permission: { module: 'monitoring', action: 'view', resourceType: 'staff' }, // Reusing staff for now or adjust
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN'],
        },
        {
            id: 'mon-health',
            label: 'System Health',
            icon: 'Dns',
            path: '/system/monitoring/health',
            permission: { module: 'monitoring', action: 'view' },
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN'],
        },
    ],
});

// System Settings Module
moduleRegistry.register({
    id: 'system',
    name: 'System Settings',
    description: 'Global configuration and management',
    icon: 'SettingsSuggest',
    basePath: '/system/settings',
    requiredPermission: { module: 'system', action: 'edit' },
    isEnabled: true,
    order: 14,
    category: 'System',
    menuItems: [
        {
            id: 'sys-config',
            label: 'Global Configuration',
            icon: 'SettingsSuggest',
            path: '/system/settings/config',
            permission: { module: 'system', action: 'edit' },
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN'],
        },
        {
            id: 'sys-modules',
            label: 'Module Management',
            icon: 'AppRegistration',
            path: '/system/settings/modules',
            permission: { module: 'system', action: 'edit' },
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN'],
        },
        {
            id: 'sys-backups',
            label: 'Backups',
            icon: 'Storage',
            path: '/system/settings/backups',
            permission: { module: 'system', action: 'edit', resourceType: 'backup' },
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN'],
        },
        {
            id: 'sys-users',
            label: 'All Users',
            icon: 'ManageAccounts',
            path: '/system/users',
            permission: { module: 'system', action: 'view', resourceType: 'user' },
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN'],
        },
    ],
});

// Settings Module (Standard Settings)
moduleRegistry.register({
    id: 'settings',
    name: 'Settings',
    description: 'General configuration',
    icon: 'Settings',
    basePath: '/settings',
    requiredPermission: { module: 'settings', action: 'view' },
    isEnabled: true,
    order: 15,
    category: 'System',
    menuItems: [
        {
            id: 'settings-general',
            label: 'Profile Settings',
            icon: 'Tune',
            path: '/settings',
            permission: { module: 'settings', action: 'view' },
        },
        {
            id: 'settings-roles',
            label: 'Roles & Permissions',
            icon: 'VerifiedUser',
            path: '/settings/roles',
            permission: { module: 'settings', action: 'edit' },
            allowedTenantTypes: ['bureau'],
            allowedRoles: ['SYSTEM_ADMIN'],
        },
    ],
});

export default moduleRegistry;
