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
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN', 'INSTITUTION_ADMIN', 'INSTRUCTOR', 'STUDENT', 'REGISTRAR'],
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
        // School Types Report
        {
            id: 'management-school-types',
            label: 'School Types Report',
            labelAmharic: 'የትምህርት ቤት ዓይነቶች',
            icon: 'Assessment',
            path: '/management/schools/types',
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
            id: 'academic-promotions',
            label: 'Promotions',
            labelAmharic: 'የተማሪዎች እድገት',
            icon: 'TrendingUp',
            path: '/academic/promotions',
            permission: { module: 'academic', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR'],
        },
        {
            id: 'academic-history',
            label: 'Academic Timeline',
            labelAmharic: 'የትምህርት ታሪክ',
            icon: 'History',
            path: '/academic/student-history',
            allowedRoles: ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR', 'INSTRUCTOR', 'STUDENT'],
        },
        {
            id: 'academic-configuration',
            label: 'Configuration',
            labelAmharic: 'ማዋቀሪያ',
            icon: 'Settings',
            allowedRoles: ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR'],
            children: [
                {
                    id: 'ac-calendar',
                    label: 'Academic Year/Periods',
                    path: '/academic/config/periods',
                    permission: { module: 'academic', action: 'edit', resourceType: 'calendar' },
                    allowedTenantTypes: ['bureau', 'school'],
                    allowedRoles: ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR'],
                },
                {
                    id: 'ac-subjects',
                    label: 'Subject Registry',
                    path: '/academic/config/subjects',
                    permission: { module: 'academic', action: 'edit', resourceType: 'subject' },
                    allowedTenantTypes: ['bureau'],
                    allowedRoles: ['SYSTEM_ADMIN'],
                },
            ]
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
            allowedRoles: ['INSTRUCTOR', 'STUDENT', 'REGISTRAR', 'INSTITUTION_ADMIN'],
        },
        {
            id: 'academic-schedule',
            label: 'Schedule',
            labelAmharic: 'የክፍል ፕሮግራም',
            icon: 'CalendarMonth',
            path: '/academic/schedule',
            allowedRoles: ['INSTRUCTOR', 'STUDENT'],
        },
        {
            id: 'academic-sections',
            label: 'Classroom Sections',
            labelAmharic: 'ክፍሎች',
            icon: 'Groups',
            path: '/academic/sections',
            permission: { module: 'academic', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR'],
        },
        {
            id: 'academic-curriculum-templates',
            label: 'Curriculum Templates',
            labelAmharic: 'የስርዓተ ትምህርት ቀመሮች',
            icon: 'Assignment',
            path: '/academic/curriculum-templates',
            allowedRoles: ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR'],
        },
    ],
});

// Institution Setup Module (Admin Quick-Start Wizard)
moduleRegistry.register({
    id: 'institution-setup' as any,
    name: 'School Setup',
    description: 'Quick setup wizard: sections → courses → instructor assignment',
    icon: 'School',
    basePath: '/academic/setup',
    requiredPermission: { module: 'academic', action: 'view' },
    isEnabled: true,
    order: 6.5,
    category: 'Institution Setup',
    menuItems: [
        {
            id: 'setup-hub',
            label: 'Setup Hub',
            labelAmharic: 'የትምህርት ቤት ዝግጅት',
            icon: 'School',
            path: '/academic/setup',
            allowedRoles: ['INSTITUTION_ADMIN'],
        },
        {
            id: 'setup-sections',
            label: 'Sections',
            labelAmharic: 'ክፍሎች',
            icon: 'Groups',
            path: '/academic/sections',
            allowedRoles: ['INSTITUTION_ADMIN', 'REGISTRAR'],
        },
        {
            id: 'setup-courses',
            label: 'Courses',
            labelAmharic: 'ኮርሶች',
            icon: 'Assignment',
            path: '/academic/courses',
            allowedRoles: ['INSTITUTION_ADMIN', 'REGISTRAR', 'INSTRUCTOR'],
        },
        {
            id: 'setup-templates',
            label: 'Curriculum Templates',
            labelAmharic: 'ቀመሮች',
            icon: 'ContentCopy',
            path: '/academic/curriculum-templates',
            allowedRoles: ['INSTITUTION_ADMIN'],
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
            id: 'hr-overview',
            label: 'HR Overview',
            labelAmharic: 'የሰው ሀብት',
            icon: 'People',
            path: '/hr',
            permission: { module: 'hr', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN'],
        },
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
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN', 'INSTRUCTOR', 'STUDENT'],
        },
        {
            id: 'hr-approvals',
            label: 'Transfer Approvals',
            labelAmharic: 'ዝውውር ማጽደቅ',
            icon: 'VerifiedUser',
            path: '/hr/approvals',
            permission: { module: 'hr', action: 'edit', resourceType: 'transfer' },
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
        {
            id: 'inventory-assets',
            label: 'Assets',
            labelAmharic: 'ቋሚ ንብረት',
            icon: 'Devices',
            path: '/inventory/assets',
            permission: { module: 'inventory', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN', 'ACCOUNTANT'],
        },
        {
            id: 'inventory-supplies',
            label: 'Supplies',
            labelAmharic: 'አላቂ እቃዎች',
            icon: 'LocalShipping',
            path: '/inventory/supplies',
            permission: { module: 'inventory', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN', 'ACCOUNTANT'],
        },
        {
            id: 'inventory-requests',
            label: 'Requests',
            labelAmharic: 'ጥያቄዎች',
            icon: 'RequestQuote',
            path: '/inventory/requests',
            permission: { module: 'inventory', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN', 'INSTRUCTOR'],
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
        {
            id: 'budget-allocations',
            label: 'Allocations',
            labelAmharic: 'በጀት ምደባ',
            icon: 'AccountTree',
            path: '/budget/allocations',
            permission: { module: 'budget', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'ACCOUNTANT'],
        },
        {
            id: 'budget-expenditure',
            label: 'Expenditures',
            labelAmharic: 'ወጪዎች',
            icon: 'Receipt',
            path: '/budget/expenditure',
            permission: { module: 'budget', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'ACCOUNTANT'],
        },
        {
            id: 'budget-requests',
            label: 'Budget Requests',
            labelAmharic: 'በጀት ጥያቄ',
            icon: 'RequestQuote',
            path: '/budget/requests',
            permission: { module: 'budget', action: 'view' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN', 'ACCOUNTANT'],
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
            path: '/management/audit',
            permission: { module: 'monitoring', action: 'view', resourceType: 'staff' },
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
            path: '/management/users',
            permission: { module: 'system', action: 'view', resourceType: 'user' },
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN', 'INSTITUTION_ADMIN'],
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

// Messaging Module
moduleRegistry.register({
    id: 'messaging',
    name: 'Messages',
    description: 'Direct and group messaging',
    icon: 'Chat',
    basePath: '/messages',
    requiredPermission: { module: 'messaging', action: 'view' },
    isEnabled: true,
    order: 3.5,
    category: 'Communication',
    menuItems: [
        {
            id: 'messaging-inbox',
            label: 'Messages',
            icon: 'Chat',
            path: '/messages',
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN', 'INSTITUTION_ADMIN', 'SCHOOL_LEADER', 'TEACHER', 'INSTRUCTOR', 'STUDENT', 'REGISTRAR', 'ACCOUNTANT'],
        },
        {
            id: 'messaging-support',
            label: 'Support Tickets',
            icon: 'SupportAgent',
            path: '/communication/support',
            allowedRoles: ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN', 'INSTITUTION_ADMIN', 'SCHOOL_LEADER', 'TEACHER', 'INSTRUCTOR', 'STUDENT', 'REGISTRAR', 'ACCOUNTANT'],
        },
    ],
});

export default moduleRegistry;
