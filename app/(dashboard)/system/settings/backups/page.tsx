'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Snackbar, 
    Alert as MuiAlert, 
    LinearProgress, 
    Chip, 
    MenuItem,
    Tooltip,
    IconButton,
    alpha,
    useTheme,
    Divider
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { backupsService, Backup } from '@/app/lib/api/backups.service';
import {
    Backup as BackupIcon,
    Restore as RestoreIcon,
    CloudDownload as DownloadIcon,
    Add as AddIcon,
    History as HistoryIcon,
    DeleteOutline as DeleteIcon,
} from '@mui/icons-material';

export default function BackupsPage() {
    const theme = useTheme();
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const data = await backupsService.getAll();
            setBackups(data);
        } catch (error) {
            console.error('Error fetching backups:', error);
            setNotification({
                open: true,
                message: 'Failed to load backup history',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    const handleCreateBackup = async () => {
        setCreating(true);
        setNotification({
            open: true,
            message: 'Generating system backup... This may take a moment.',
            severity: 'info',
        });

        try {
            await backupsService.create();
            await fetchBackups();
            setNotification({
                open: true,
                message: 'Backup created successfully',
                severity: 'success',
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Failed to create backup',
                severity: 'error',
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (backup: Backup) => {
        try {
            await backupsService.download(backup.id, backup.filename);
            setNotification({
                open: true,
                message: 'Download started',
                severity: 'success',
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Download failed',
                severity: 'error',
            });
        }
    };

    const handleRestore = async (backup: Backup) => {
        if (!confirm(`Are you sure you want to restore backup from ${new Date(backup.createdAt).toLocaleString()}? Current data will be overwritten.`)) {
            return;
        }

        setNotification({
            open: true,
            message: 'Restoring system from backup...',
            severity: 'info',
        });

        try {
            await backupsService.restore(backup.id);
            setNotification({
                open: true,
                message: 'System restored successfully. You may need to refresh the page.',
                severity: 'success',
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Restore failed',
                severity: 'error',
            });
        }
    };

    const handleDelete = async (backup: Backup) => {
        if (!confirm('Are you sure you want to delete this backup log?')) return;

        try {
            await backupsService.delete(backup.id);
            fetchBackups();
            setNotification({
                open: true,
                message: 'Backup log deleted successfully',
                severity: 'success',
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Failed to delete backup log',
                severity: 'error',
            });
        }
    };

    const columns: GridColDef<Backup>[] = [
        {
            field: 'createdAt',
            headerName: 'Date Created',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <HistoryIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={500}>
                        {new Date(params.value).toLocaleString()}
                    </Typography>
                </Box>
            )
        },
        { 
            field: 'filename', 
            headerName: 'Filename', 
            flex: 1.2, 
            minWidth: 250,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                    {params.value}
                </Typography>
            )
        },
        { 
            field: 'size', 
            headerName: 'Size', 
            width: 120,
            renderCell: (params) => (
                <Chip label={params.value} size="small" variant="soft" />
            )
        },
        { 
            field: 'type', 
            headerName: 'Type', 
            width: 120,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    variant="outlined"
                    color={params.value === 'Automatic' ? 'secondary' : 'default'}
                />
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            renderCell: (params) => {
                const status = params.value;
                return (
                    <Chip
                        label={status}
                        color={status === 'Success' ? 'success' : status === 'Processing' ? 'info' : 'error'}
                        size="small"
                        variant="filled"
                        sx={{ fontWeight: 600, minWidth: 90 }}
                    />
                );
            }
        },
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '1440px', mx: 'auto' }}>
            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                        System Backups
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Secure your data and manage system restoration points
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateBackup}
                        disabled={creating}
                        sx={{ 
                            borderRadius: 2.5, 
                            px: 4, 
                            py: 1.5,
                            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
                            '&:hover': {
                                boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                            }
                        }}
                    >
                        {creating ? 'Generating Backup...' : 'Create Manual Backup'}
                    </Button>
                </Box>
            </Box>

            {creating && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="caption" color="primary" fontWeight={700} sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>
                        Process in progress: Database Dump
                    </Typography>
                    <LinearProgress sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
                </Box>
            )}

            <DataTable
                title="Backup Vault"
                subtitle={`${backups.length} secure checkpoints available`}
                rows={backups}
                columns={columns}
                loading={loading}
                module="system"
                onDelete={handleDelete}
                onRefresh={fetchBackups}
                showDensitySelector={true}
                renderRowActions={(row, handleClose) => [
                    <MenuItem
                        key="download"
                        onClick={() => { handleDownload(row); handleClose(); }}
                        sx={{ py: 1.5 }}
                    >
                        <DownloadIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
                        Download Archive
                    </MenuItem>,
                    <MenuItem
                        key="restore"
                        onClick={() => { handleRestore(row); handleClose(); }}
                        sx={{ py: 1.5, color: 'warning.main' }}
                    >
                        <RestoreIcon fontSize="small" sx={{ mr: 1.5 }} />
                        Restore This Point
                    </MenuItem>,
                    <Divider key="div" />,
                    <MenuItem
                        key="delete"
                        onClick={() => { handleDelete(row); handleClose(); }}
                        sx={{ py: 1.5, color: 'error.main' }}
                    >
                        <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
                        Permanent Delete
                    </MenuItem>
                ]}
            />

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <MuiAlert severity={notification.severity} variant="filled" sx={{ width: '100%', borderRadius: 3, boxShadow: 6 }}>
                    {notification.message}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
}
