'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    Divider,
    Button,
    Snackbar,
    Alert as MuiAlert,
    CircularProgress,
    Chip,
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Security as SecurityIcon,
    School as SchoolIcon,
    Groups as GroupsIcon,
    Inventory as InventoryIcon,
    AccountBalance as FinanceIcon,
    Message as MessageIcon,
    Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { modulesService, ModuleStatus } from '@/app/lib/api/modules.service';

const getModuleIcon = (key: string) => {
    switch (key) {
        case 'MODULE_HR': return <GroupsIcon />;
        case 'MODULE_INVENTORY': return <InventoryIcon />;
        case 'MODULE_FINANCE': return <FinanceIcon />;
        case 'MODULE_PAYMENTS': return <FinanceIcon />;
        case 'MODULE_ACADEMIC': return <SchoolIcon />;
        case 'MODULE_ATTENDANCE': return <AssessmentIcon />;
        case 'MODULE_MESSAGING': return <MessageIcon />;
        case 'MODULE_REPORTS': return <AssessmentIcon />;
        default: return <SettingsIcon />;
    }
};

export default function ModuleManagementPage() {
    const [modules, setModules] = useState<ModuleStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const fetchModules = async () => {
        setLoading(true);
        try {
            const data = await modulesService.getAll();
            setModules(data);
        } catch (error) {
            console.error('Error fetching modules:', error);
            setNotification({
                open: true,
                message: 'Failed to load module status',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModules();
    }, []);

    const handleToggle = async (key: string, currentStatus: boolean) => {
        try {
            await modulesService.toggle(key, !currentStatus);
            setModules(prev => prev.map(m => m.key === key ? { ...m, enabled: !currentStatus } : m));
            setNotification({
                open: true,
                message: `Module ${!currentStatus ? 'enabled' : 'disabled'} successfully`,
                severity: 'success',
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Failed to update module status',
                severity: 'error',
            });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Group modules by category
    const groupedModules = modules.reduce((acc, module) => {
        acc[module.category] = [...(acc[module.category] || []), module];
        return acc;
    }, {} as Record<string, ModuleStatus[]>);

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                    Module Management
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Enable or disable system features and modules
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {Object.entries(groupedModules).map(([category, categoryModules]) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={category}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={700} gutterBottom color="primary">
                                    {category} Modules
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    {categoryModules.map((module) => (
                                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={module.key}>
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    borderRadius: 2,
                                                    borderColor: module.enabled ? 'primary.main' : 'divider',
                                                    bgcolor: module.enabled ? 'primary.50' : 'background.paper',
                                                    transition: 'all 0.3s ease',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box sx={{ color: module.enabled ? 'primary.main' : 'text.disabled' }}>
                                                        {getModuleIcon(module.key)}
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight={600}>
                                                            {module.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {module.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Switch
                                                    checked={module.enabled}
                                                    onChange={() => handleToggle(module.key, module.enabled)}
                                                    color="primary"
                                                />
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Notification Snackbar */}
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
