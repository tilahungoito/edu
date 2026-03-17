'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Switch,
    Divider,
    Button,
    Snackbar,
    Alert as MuiAlert,
    CircularProgress,
    Chip,
    Tooltip,
    alpha,
    useTheme,
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
    CheckCircle as HealthyIcon,
    Warning as DegradedIcon,
    Error as OfflineIcon,
    WarningAmber as DependencyIcon,
} from '@mui/icons-material';
import { modulesService, ModuleStatus } from '@/app/lib/api/modules.service';

const getModuleIcon = (key: string) => {
    const iconStyle = { fontSize: 28 };
    switch (key) {
        case 'MODULE_HR': return <GroupsIcon sx={iconStyle} />;
        case 'MODULE_INVENTORY': return <InventoryIcon sx={iconStyle} />;
        case 'MODULE_FINANCE': return <FinanceIcon sx={iconStyle} />;
        case 'MODULE_PAYMENTS': return <FinanceIcon sx={iconStyle} />;
        case 'MODULE_ACADEMIC': return <SchoolIcon sx={iconStyle} />;
        case 'MODULE_ATTENDANCE': return <AssessmentIcon sx={iconStyle} />;
        case 'MODULE_MESSAGING': return <MessageIcon sx={iconStyle} />;
        case 'MODULE_REPORTS': return <AssessmentIcon sx={iconStyle} />;
        default: return <SettingsIcon sx={iconStyle} />;
    }
};

const HealthIndicator = ({ status }: { status?: ModuleStatus['health'] }) => {
    switch (status) {
        case 'healthy':
            return <Chip icon={<HealthyIcon />} label="Healthy" color="success" size="small" variant="soft" sx={{ borderRadius: 1.5 }} />;
        case 'degraded':
            return <Chip icon={<DegradedIcon />} label="Degraded" color="warning" size="small" variant="soft" sx={{ borderRadius: 1.5 }} />;
        case 'offline':
            return <Chip icon={<OfflineIcon />} label="Offline" color="error" size="small" variant="soft" sx={{ borderRadius: 1.5 }} />;
        default:
            return null;
    }
};

export default function ModuleManagementPage() {
    const theme = useTheme();
    const [modules, setModules] = useState<ModuleStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingKey, setUpdatingKey] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
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

    const handleToggle = async (key: string, currentStatus: boolean, dependencies?: string[]) => {
        // Check if disabling a module that other enabled modules depend on
        if (currentStatus) {
            const dependentModules = modules.filter(m => m.enabled && m.dependencies?.includes(key));
            if (dependentModules.length > 0) {
                setNotification({
                    open: true,
                    message: `Cannot disable. Other modules (${dependentModules.map(m => m.name).join(', ')}) depend on this.`,
                    severity: 'warning',
                });
                return;
            }
        }

        // Check if enabling a module whose dependencies are disabled
        if (!currentStatus && dependencies) {
            const missingDependencies = dependencies.filter(depKey => {
                const dep = modules.find(m => m.key === depKey);
                return !dep || !dep.enabled;
            });
            if (missingDependencies.length > 0) {
                const names = missingDependencies.map(dk => modules.find(m => m.key === dk)?.name || dk).join(', ');
                setNotification({
                    open: true,
                    message: `Please enable prerequisite modules first: ${names}`,
                    severity: 'warning',
                });
                return;
            }
        }

        setUpdatingKey(key);
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
        } finally {
            setUpdatingKey(null);
        }
    };

    const handleBulkAction = async (enable: boolean) => {
        if (!confirm(`Are you sure you want to ${enable ? 'enable' : 'disable'} all optional modules?`)) return;
        setLoading(true);
        try {
            // Simplified bulk action: iterate and toggle
            // In a real app, we'd have a backend endpoint for this
            for (const module of modules) {
                if (module.enabled !== enable) {
                    await modulesService.toggle(module.key, enable);
                }
            }
            fetchModules();
        } catch (error) {
            setNotification({ open: true, message: 'Bulk update failed', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const groupedModules = useMemo(() => {
        return modules.reduce((acc, module) => {
            acc[module.category] = [...(acc[module.category] || []), module];
            return acc;
        }, {} as Record<string, ModuleStatus[]>);
    }, [modules]);

    if (loading && modules.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '1600px', mx: 'auto' }}>
            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1, color: 'text.primary' }}>
                        Module Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Enable, disable, and monitor the health of system-wide features.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={() => handleBulkAction(false)}
                        disabled={loading}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Disable All
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => handleBulkAction(true)}
                        disabled={loading}
                        sx={{ borderRadius: 2, px: 3, boxShadow: 'none' }}
                    >
                        Enable All
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {Object.entries(groupedModules).map(([category, categoryModules]) => (
                    <Grid size={{ xs: 12 }} key={category}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="h5" fontWeight={700} color="text.primary">
                                {category}
                            </Typography>
                            <Chip label={categoryModules.length} size="small" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} />
                        </Box>
                        <Grid container spacing={3}>
                            {categoryModules.map((module) => (
                                <Grid size={{ xs: 12, md: 6, lg: 4, xl: 3 }} key={module.key}>
                                    <Card 
                                        sx={{ 
                                            borderRadius: 4, 
                                            position: 'relative',
                                            overflow: 'visible',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                                            },
                                            border: '1px solid',
                                            borderColor: module.enabled ? alpha(theme.palette.primary.main, 0.1) : 'divider',
                                            bgcolor: module.enabled ? 'background.paper' : alpha(theme.palette.action.disabledBackground, 0.3),
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                                                <Box 
                                                    sx={{ 
                                                        p: 1.5, 
                                                        borderRadius: 3, 
                                                        bgcolor: module.enabled ? alpha(theme.palette.primary.main, 0.1) : 'action.selected',
                                                        color: module.enabled ? 'primary.main' : 'text.disabled',
                                                        display: 'flex'
                                                    }}
                                                >
                                                    {getModuleIcon(module.key)}
                                                </Box>
                                                <Switch
                                                    checked={module.enabled}
                                                    onChange={() => handleToggle(module.key, module.enabled, module.dependencies)}
                                                    color="primary"
                                                    disabled={updatingKey === module.key}
                                                />
                                            </Box>

                                            <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
                                                {module.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ height: 40, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', mb: 2.5 }}>
                                                {module.description}
                                            </Typography>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                                <HealthIndicator status={module.health} />
                                                {module.version && (
                                                    <Chip label={`v${module.version}`} size="small" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: '0.7rem' }} />
                                                )}
                                            </Box>

                                            {module.dependencies && module.dependencies.length > 0 && (
                                                <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: alpha(theme.palette.divider, 0.5) }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary' }}>
                                                        <DependencyIcon sx={{ fontSize: 16 }} />
                                                        <Typography variant="caption" fontWeight={600}>
                                                            Requires: {module.dependencies.map(dep => dep.replace('MODULE_', '')).join(', ')}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <Divider sx={{ mt: 5, mb: 1, opacity: 0.5 }} />
                    </Grid>
                ))}
            </Grid>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <MuiAlert severity={notification.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, boxShadow: 3 }}>
                    {notification.message}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
}
