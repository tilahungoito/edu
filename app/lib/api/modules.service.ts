import { systemSettingsService } from './system-settings.service';
import { ModuleType } from '../types';

export interface ModuleStatus {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
    category: 'Core' | 'Academic' | 'Administrative' | 'Finance';
}

const DEFAULT_MODULES: ModuleStatus[] = [
    { key: 'MODULE_HR', name: 'Human Resources', description: 'Manage staff, contracts, and payroll', enabled: true, category: 'Administrative' },
    { key: 'MODULE_INVENTORY', name: 'Inventory', description: 'Track assets and supplies', enabled: true, category: 'Administrative' },
    { key: 'MODULE_FINANCE', name: 'Finance', description: 'Budgeting and expenses', enabled: true, category: 'Finance' },
    { key: 'MODULE_PAYMENTS', name: 'Payments', description: 'Student fee collection', enabled: true, category: 'Finance' },
    { key: 'MODULE_ACADEMIC', name: 'Academics', description: 'Curriculum and grading', enabled: true, category: 'Academic' },
    { key: 'MODULE_ATTENDANCE', name: 'Attendance', description: 'Student and staff attendance', enabled: true, category: 'Academic' },
    { key: 'MODULE_MESSAGING', name: 'Messaging', description: 'Internal communication system', enabled: true, category: 'Core' },
    { key: 'MODULE_REPORTS', name: 'Reports', description: 'System-wide analytics and reporting', enabled: true, category: 'Core' },
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
