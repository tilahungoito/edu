import { systemSettingsService } from './system-settings.service';
import { ModuleType } from '../types';

export interface ModuleStatus {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
    category: 'Core' | 'Academic' | 'Administrative' | 'Finance' | 'Communication';
    dependencies?: string[];
    health?: 'healthy' | 'degraded' | 'offline';
    version?: string;
}

const DEFAULT_MODULES: ModuleStatus[] = [
    { 
        key: 'MODULE_MESSAGING', 
        name: 'Messaging', 
        description: 'Internal communication, notifications, and mailing system', 
        enabled: true, 
        category: 'Communication',
        health: 'healthy',
        version: '2.1.0'
    },
    { 
        key: 'MODULE_REPORTS', 
        name: 'Reports & Analytics', 
        description: 'System-wide data analysis, automated reporting, and PDF generation', 
        enabled: true, 
        category: 'Core',
        health: 'healthy',
        version: '1.5.0'
    },
    { 
        key: 'MODULE_ACADEMIC', 
        name: 'Academics', 
        description: 'Curriculum management, course scheduling, and student grading', 
        enabled: true, 
        category: 'Academic',
        health: 'healthy',
        version: '3.0.1'
    },
    { 
        key: 'MODULE_ATTENDANCE', 
        name: 'Attendance', 
        description: 'Automated student and staff attendance tracking', 
        enabled: true, 
        category: 'Academic',
        dependencies: ['MODULE_ACADEMIC'],
        health: 'healthy',
        version: '1.2.0'
    },
    { 
        key: 'MODULE_HR', 
        name: 'Human Resources', 
        description: 'Staff profiles, contract management, and performance reviews', 
        enabled: true, 
        category: 'Administrative',
        health: 'healthy',
        version: '2.4.0'
    },
    { 
        key: 'MODULE_INVENTORY', 
        name: 'Inventory', 
        description: 'Asset tracking, procurement, and supply management', 
        enabled: true, 
        category: 'Administrative',
        health: 'healthy',
        version: '1.8.0'
    },
    { 
        key: 'MODULE_FINANCE', 
        name: 'Finance & Budget', 
        description: 'Institutional budgeting, expense tracking, and financial audits', 
        enabled: true, 
        category: 'Finance',
        health: 'healthy',
        version: '2.0.0'
    },
    { 
        key: 'MODULE_PAYMENTS', 
        name: 'Student Payments', 
        description: 'Tuition fees, scholarship management, and invoicing', 
        enabled: true, 
        category: 'Finance',
        health: 'healthy',
        version: '1.4.2'
    },
];

export const modulesService = {
    getAll: async (): Promise<ModuleStatus[]> => {
        try {
            const settings = await systemSettingsService.getAll();

            return DEFAULT_MODULES.map(module => {
                const settingKey = `${module.key}_ENABLED`;
                const setting = settings.find(s => s.key === settingKey);

                // If setting exists, use its value. If not, default to true (or the module's default).
                // We assume 'true' string means enabled.
                const isEnabled = setting ? setting.value === 'true' : module.enabled;

                return {
                    ...module,
                    enabled: isEnabled
                };
            });
        } catch (error) {
            console.error('Failed to fetch module status:', error);
            // Return defaults on error
            return DEFAULT_MODULES;
        }
    },

    toggle: async (moduleKey: string, enabled: boolean): Promise<void> => {
        const settingKey = `${moduleKey}_ENABLED`;
        const value = String(enabled);

        try {
            const setting = await systemSettingsService.getByKey(settingKey).catch(() => null);

            if (setting) {
                await systemSettingsService.update(settingKey, { value });
            } else {
                await systemSettingsService.create({
                    key: settingKey,
                    value,
                    description: `Status for ${moduleKey}`,
                    type: 'boolean'
                });
            }
        } catch (error) {
            console.error(`Failed to toggle module ${moduleKey}:`, error);
            throw error;
        }
    }
};

export default modulesService;
