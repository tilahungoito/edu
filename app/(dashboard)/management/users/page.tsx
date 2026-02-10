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
    CheckCircle as ActivateIcon,
    Cancel as DeactivateIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ConfirmDialog } from '@/app/components/common/ConfirmDialog';

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [confirmAction, setConfirmAction] = useState<{
        open: boolean;
        type: 'activate' | 'deactivate' | null;
        userId: string | null;
        userName: string | null;
    }>({
        open: false,
        type: null,
        userId: null,
        userName: null,
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

    const handleAction = async (action: 'activate' | 'deactivate', userId: string) => {
        try {
            if (action === 'activate') await usersService.activate(userId);
            else if (action === 'deactivate') await usersService.deactivate(userId);

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
            flex: 1,
            minWidth: 180,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main', fontWeight: 600 }}>
                        {params.value?.[0]}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{params.value}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: -0.5 }}>{params.row.email}</Typography>
                    </Box>
                </Box>
            ),
        },
        { field: 'role', headerName: 'Role', width: 120 },
        { field: 'tenant', headerName: 'Scope', width: 150 },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
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
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                        User Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage system users and their administrative permissions
                    </Typography>
                </Box>
            </Box>

            <DataTable
                title="System Users"
                subtitle="View and manage administrative personnel across different scopes"
                rows={mappedUsers}
                columns={columns}
                loading={loading}
                module="management"
                onAdd={() => setDialogOpen(true)}
                onView={() => { }}
                onDelete={async (user) => {
                    await usersService.remove(user.id);
                    fetchUsers();
                }}
                renderRowActions={(user, handleClose) => (
                    user.status === 'inactive' ? (
                        <MuiMenuItem
                            onClick={() => {
                                setConfirmAction({
                                    open: true,
                                    type: 'activate',
                                    userId: user.id,
                                    userName: user.name,
                                });
                                handleClose();
                            }}
                        >
                            <ActivateIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                            Activate
                        </MuiMenuItem>
                    ) : (
                        <MuiMenuItem
                            onClick={() => {
                                setConfirmAction({
                                    open: true,
                                    type: 'deactivate',
                                    userId: user.id,
                                    userName: user.name,
                                });
                                handleClose();
                            }}
                        >
                            <DeactivateIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                            Deactivate
                        </MuiMenuItem>
                    )
                )}
                onRefresh={fetchUsers}
                showDensitySelector={true}
                statusField="status"
                statusColors={{
                    'active': 'success',
                    'inactive': 'error'
                }}
                toolbarActions={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchUsers}
                            size="small"
                            sx={{ borderRadius: 2 }}
                        >
                            Refresh
                        </Button>
                    </Box>
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

            <ConfirmDialog
                open={confirmAction.open}
                title={`${confirmAction.type?.charAt(0).toUpperCase()}${confirmAction.type?.slice(1)} ${confirmAction.userName}`}
                message={`Are you sure you want to ${confirmAction.type} this user?`}
                confirmColor={confirmAction.type === 'activate' ? 'success' : 'warning'}
                onConfirm={() => {
                    if (confirmAction.type && confirmAction.userId) {
                        handleAction(confirmAction.type, confirmAction.userId);
                    }
                    setConfirmAction({ open: false, type: null, userId: null, userName: null });
                }}
                onClose={() => setConfirmAction({ open: false, type: null, userId: null, userName: null })}
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
