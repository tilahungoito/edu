'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, alpha, Avatar } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { usersService } from '@/app/lib/api/users.service';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import type { User } from '@/app/lib/api/api-client';
import { UserDialog } from '@/app/components/management/UserDialog';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import { toast } from 'react-hot-toast';

// Roles that can create users
const CREATE_ROLES = [
    'SYSTEM_ADMIN',
    'REGIONAL_ADMIN',
    'ZONE_ADMIN',
    'WOREDA_ADMIN',
    'KEBELE_ADMIN',
    'INSTITUTION_ADMIN'
];

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const user = useAuthStore(state => state.user);

    // Check if user can create other users
    const canCreate = user?.roles?.some(r => CREATE_ROLES.includes(r.name)) ?? false;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await usersService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
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

    const handleToggleStatus = async (userRecord: any) => {
        try {
            if (userRecord.isActive) {
                await usersService.deactivate(userRecord.id);
                toast.success('User deactivated successfully');
            } else {
                await usersService.activate(userRecord.id);
                toast.success('User activated successfully');
            }
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user status');
        }
    };

    const handleDelete = async (userRecord: any) => {
        try {
            await usersService.remove(userRecord.id);
            toast.success('User removed successfully');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to remove user');
        }
    };

    const handleEdit = (userRecord: any) => {
        setSelectedUser(userRecord);
        setDialogOpen(true);
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
    ];

    const mappedUsers = users.map(u => ({
        ...u,
        name: (u as any).firstName ? `${(u as any).firstName} ${(u as any).lastName}` : (u.username || u.email),
        role: (u.role as any)?.name || 'User',
        tenant: u.scopeType || 'System',
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
                onAdd={canCreate ? () => { setSelectedUser(null); setDialogOpen(true); } : undefined}
                allowedRoles={CREATE_ROLES}
                onEdit={handleEdit}
                onView={(row) => {
                    console.log('Viewing user:', row);
                }}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onRefresh={fetchUsers}
                showDensitySelector={true}
                statusField="isActive"
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
                user={selectedUser}
                onClose={() => {
                    setDialogOpen(false);
                    setSelectedUser(null);
                }}
                onSuccess={() => {
                    fetchUsers();
                    toast.success(selectedUser ? 'User updated successfully' : 'User created successfully');
                }}
            />
        </Box>
    );
}

