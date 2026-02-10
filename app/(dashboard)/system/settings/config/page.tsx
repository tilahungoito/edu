'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Snackbar, Alert as MuiAlert } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { systemSettingsService, SystemSetting } from '@/app/lib/api/system-settings.service';
import { SystemSettingDialog } from '@/app/components/management/SystemSettingDialog';

export default function GlobalConfigPage() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSetting, setEditingSetting] = useState<SystemSetting | undefined>(undefined);
    const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await systemSettingsService.getAll();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setNotification({
                open: true,
                message: 'Failed to load system settings',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleDelete = async (setting: SystemSetting) => {
        try {
            await systemSettingsService.remove(setting.key);
            setNotification({
                open: true,
                message: 'Setting deleted successfully',
                severity: 'success',
            });
            fetchSettings();
        } catch (error: any) {
            setNotification({
                open: true,
                message: error.message || 'Failed to delete setting',
                severity: 'error',
            });
        }
    };

    const handleEdit = (setting: SystemSetting) => {
        setEditingSetting(setting);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingSetting(undefined);
        setDialogOpen(true);
    };

    const handleDialogSuccess = () => {
        fetchSettings();
        setNotification({
            open: true,
            message: `Setting ${editingSetting ? 'updated' : 'created'} successfully`,
            severity: 'success',
        });
    };

    const columns: GridColDef[] = [
        { field: 'key', headerName: 'Key', flex: 1, minWidth: 200 },
        { field: 'value', headerName: 'Value', flex: 1, minWidth: 200 },
        { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 250 },
        { field: 'type', headerName: 'Type', width: 120 },
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                    Global Configuration
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Manage system-wide settings and parameters
                </Typography>
            </Box>

            <DataTable
                title="System Settings"
                subtitle="Configure global variables and application behavior"
                rows={settings}
                columns={columns}
                loading={loading}
                module="system" // Assuming 'system' module exists in types or strings are allowed
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchSettings}
                showDensitySelector={true}
            />

            <SystemSettingDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSuccess={handleDialogSuccess}
                setting={editingSetting}
            />

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <MuiAlert severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
                    {notification.message}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
}
