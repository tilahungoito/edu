import { systemSettingsService } from './system-settings.service';

export interface Backup {
    id: string;
    createdAt: string;
    size: string;
    type: 'Automatic' | 'Manual';
    status: 'Success' | 'Failed';
    filename: string;
}

const BACKUPS_KEY = 'SYSTEM_BACKUPS';

export const backupsService = {
    getAll: async (): Promise<Backup[]> => {
        try {
            const setting = await systemSettingsService.getByKey(BACKUPS_KEY).catch(() => null);
            if (!setting || !setting.value) return [];
            return JSON.parse(setting.value);
        } catch (error) {
            console.error('Failed to parse backups:', error);
            return [];
        }
    },

    create: async (): Promise<Backup> => {
        // Simulate backup creation delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const backups = await backupsService.getAll();
        const newBackup: Backup = {
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            size: `${(Math.random() * 50 + 10).toFixed(2)} MB`,
            type: 'Manual',
            status: 'Success',
            filename: `backup_${new Date().toISOString().split('T')[0]}.sql`,
        };

        const updatedBackups = [newBackup, ...backups];

        // Save to system settings
        try {
            const setting = await systemSettingsService.getByKey(BACKUPS_KEY).catch(() => null);
            if (setting) {
                await systemSettingsService.update(BACKUPS_KEY, { value: JSON.stringify(updatedBackups) });
            } else {
                await systemSettingsService.create({
                    key: BACKUPS_KEY,
                    value: JSON.stringify(updatedBackups),
                    description: 'System backup history',
                    type: 'json'
                });
            }
        } catch (error) {
            console.error('Failed to save backup:', error);
            throw error;
        }

        return newBackup;
    },

    restore: async (id: string): Promise<void> => {
        // Simulate restore delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(`Restoring backup ${id}...`);
    },

    delete: async (id: string): Promise<void> => {
        const backups = await backupsService.getAll();
        const updatedBackups = backups.filter(b => b.id !== id);

        const setting = await systemSettingsService.getByKey(BACKUPS_KEY);
        await systemSettingsService.update(BACKUPS_KEY, { value: JSON.stringify(updatedBackups) });
    }
};

export default backupsService;
