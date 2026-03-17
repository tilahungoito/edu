'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Snackbar, Alert as MuiAlert, Tabs, Tab, Chip, Tooltip, IconButton } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { systemSettingsService, SystemSetting } from '@/app/lib/api/system-settings.service';
import { SystemSettingDialog } from '@/app/components/management/SystemSettingDialog';
import { ContentCopy as CopyIcon } from '@mui/icons-material';

const CATEGORIES = ['ALL', 'GENERAL', 'SECURITY', 'ACADEMIC', 'NOTIFICATIONS', 'UI'];

export default function GlobalConfigPage() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSetting, setEditingSetting] = useState<SystemSetting | undefined>(undefined);
    const [activeTab, setActiveTab] = useState(0);
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

    const filteredSettings = useMemo(() => {
        const category = CATEGORIES[activeTab];
        if (category === 'ALL') return settings;
        return settings.filter(s => s.category === category);
    }, [settings, activeTab]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setNotification({
            open: true,
            message: 'Key copied to clipboard',
            severity: 'success',
        });
    };

    const handleDelete = async (setting: SystemSetting) => {
        if (!confirm(`Are you sure you want to delete the setting "${setting.key}"?`)) return;
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
    };

    const columns: GridColDef<SystemSetting>[] = [
        { 
            field: 'key', 
            headerName: 'Key', 
            flex: 1, 
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                        {params.value}
                    </Typography>
                    <Tooltip title="Copy Key">
                        <IconButton size="small" onClick={() => copyToClipboard(params.value)}>
                            <CopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        },
        { 
            field: 'value', 
            headerName: 'Value', 
            flex: 1, 
            minWidth: 200,
            renderCell: (params) => {
                const { type, value } = params.row;
                if (type === 'boolean') {
                    return (
                        <Chip 
                            label={value === 'true' ? 'Enabled' : 'Disabled'} 
                            color={value === 'true' ? 'success' : 'default'}
                            size="small"
                            variant="soft"
                        />
                    );
                }
                if (type === 'json') {
                    return (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            {value.length > 30 ? value.substring(0, 30) + '...' : value}
                        </Typography>
                    );
                }
                return value;
            }
        },
        { field: 'category', headerName: 'Category', width: 120, renderCell: (params) => (
            <Chip label={params.value} size="small" variant="outlined" />
        )},
        { field: 'type', headerName: 'Type', width: 100 },
        { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 250 },
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '1440px', mx: 'auto' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                        Global Configuration
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage system-wide settings and parameters
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {CATEGORIES.map((cat) => (
                        <Tab key={cat} label={cat} sx={{ fontWeight: 600 }} />
                    ))}
                </Tabs>
            </Box>

            <DataTable
                title={`${CATEGORIES[activeTab]} Settings`}
                subtitle={`Viewing ${filteredSettings.length} configuration parameters`}
                rows={filteredSettings}
                columns={columns}
                loading={loading}
                module="system"
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
                autoHideDuration={4000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <MuiAlert severity={notification.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {notification.message}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
}
