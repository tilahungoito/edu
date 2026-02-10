'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Snackbar, Alert as MuiAlert, LinearProgress, Chip, MenuItem } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { backupsService, Backup } from '@/app/lib/api/backups.service';
import {
    Backup as BackupIcon,
    Restore as RestoreIcon,
    CloudDownload as DownloadIcon,
    Add as AddIcon
} from '@mui/icons-material';

export default function BackupsPage() {
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
                message: 'System restored successfully',
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
                message: 'Backup log deleted',
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

    const columns: GridColDef[] = [
        {
            field: 'createdAt',
            headerName: 'Date Created',
            flex: 1,
            minWidth: 200,
            valueFormatter: (value: any) => value ? new Date(value).toLocaleString() : ''
        },
        { field: 'filename', headerName: 'Filename', flex: 1, minWidth: 200 },
        { field: 'size', headerName: 'Size', width: 120 },
        { field: 'type', headerName: 'Type', width: 120 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={params.value === 'Success' ? 'success' : 'error'}
                    size="small"
                />
            )
        },
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                        System Backups
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage database backups and system restoration points
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateBackup}
                    disabled={creating}
                    size="large"
                >
                    {creating ? 'Backing up...' : 'Create Backup'}
                </Button>
            </Box>

            {creating && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

            <DataTable
                title="Backup History"
                subtitle="List of available system backups"
                rows={backups}
                columns={columns}
                loading={loading}
                module="system"
                onDelete={handleDelete}
                onRefresh={fetchBackups}
                showDensitySelector={true}
                renderRowActions={(row, handleClose) => [
                    <MenuItem
                        key="restore"
                        onClick={() => { handleRestore(row); handleClose(); }}
                        sx={{ color: 'warning.main' }}
                    >
                        <RestoreIcon fontSize="small" sx={{ mr: 1 }} />
                        Restore
                    </MenuItem>,
                    <MenuItem
                        key="download"
                        onClick={() => { alert('Download simulation: ' + row.filename); handleClose(); }}
                    >
                        <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                        Download
                    </MenuItem>
                ]}
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
