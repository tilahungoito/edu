'use client';

import React from 'react';
import { Box, Typography, Button, Grid, alpha, Avatar, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';

import { usersService } from '@/app/lib/api/users.service';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useState, useEffect } from 'react';
import type { User } from '@/app/lib/api/api-client';
import { UserDialog } from '@/app/components/management/UserDialog';
import { IconButton, Tooltip, Menu, MenuItem as MuiMenuItem, Snackbar, Alert as MuiAlert } from '@mui/material';
import {
    MoreVert as MoreIcon,
    CheckCircle as ActivateIcon,
    Cancel as DeactivateIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Add as AddIcon
} from '@mui/icons-material';

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await usersService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Listen for real-time updates
    useRealTime('STATS_UPDATED', () => {
        fetchUsers();
    });

    const handleAction = async (action: 'activate' | 'deactivate' | 'delete', userId: string) => {
        try {
            if (action === 'activate') await usersService.activate(userId);
            else if (action === 'deactivate') await usersService.deactivate(userId);
            else if (action === 'delete') await usersService.remove(userId);

            setNotification({
                open: true,
                message: `User ${action}d successfully`,
                severity: 'success',
            });
            fetchUsers();
        } catch (error: any) {
            setNotification({
                open: true,
                message: error.message || `Failed to ${action} user`,
                severity: 'error',
            });
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            width: 300,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                        {params.value?.[0]}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{params.value}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{params.row.email}</Typography>
                    </Box>
                </Box>
            ),
        },
        { field: 'role', headerName: 'Role', width: 180 },
        { field: 'tenant', headerName: 'Scope', width: 220 },
        {
            field: 'status',
            headerName: 'Status',
            width: 150,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {params.row.status === 'inactive' ? (
                        <Tooltip title="Activate">
                            <IconButton size="small" color="success" onClick={() => handleAction('activate', params.row.id)}>
                                <ActivateIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title={params.row.role === 'SYSTEM_ADMIN' ? "Cannot deactivate System Admin" : "Deactivate"}>
                            <span>
                                <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleAction('deactivate', params.row.id)}
                                    disabled={params.row.role === 'SYSTEM_ADMIN'}
                                >
                                    <DeactivateIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                    <Tooltip title={params.row.role === 'SYSTEM_ADMIN' ? "Cannot delete System Admin" : "Delete"}>
                        <span>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleAction('delete', params.row.id)}
                                disabled={params.row.role === 'SYSTEM_ADMIN'}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const mappedUsers = users.map(u => ({
        id: u.id,
        name: (u as any).firstName ? `${(u as any).firstName} ${(u as any).lastName}` : (u.username || u.email),
        email: u.email,
        role: (u.role as any)?.name || 'User',
        tenant: u.scopeType || 'System',
        status: u.isActive ? 'active' : 'inactive'
    }));

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                    User Management
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Manage system users and their administrative permissions
                </Typography>
            </Box>

            <DataTable
                title="System Users"
                subtitle="View and manage administrative personnel across different scopes"
                rows={mappedUsers}
                columns={columns}
                loading={loading}
                module="management"
                onAdd={() => setDialogOpen(true)}
                onRefresh={fetchUsers}
                statusField="status"
                statusColors={{
                    'active': 'success',
                    'inactive': 'error'
                }}
                toolbarActions={
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchUsers}
                        size="small"
                        sx={{ borderRadius: 2 }}
                    >
                        Refresh
                    </Button>
                }
            />

            <UserDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSuccess={() => {
                    fetchUsers();
                    setNotification({ open: true, message: 'User created successfully', severity: 'success' });
                }}
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
