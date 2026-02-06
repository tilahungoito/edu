'use client';

import React from 'react';
import { Box, Typography, Button, Avatar, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { Add as AddIcon } from '@mui/icons-material';

import { usersService } from '@/app/lib/api/users.service';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useState, useEffect } from 'react';
import type { User } from '@/app/lib/api/api-client';

const columns: GridColDef[] = [
    {
        field: 'name',
        headerName: 'Name',
        width: 200,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>{params.value?.[0]}</Avatar>
                <Typography variant="body2">{params.value}</Typography>
            </Box>
        ),
    },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'role', headerName: 'Role', width: 150 },
    { field: 'tenant', headerName: 'Tenant', width: 180 },
    {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => <Chip label={params.value?.toString().toUpperCase()} size="small" color="success" />,
    },
];

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

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

    const mappedUsers = users.map(u => ({
        id: u.id,
        name: u.username || u.email,
        email: u.email,
        role: (u.role as any)?.name || 'User',
        tenant: u.scopeType || 'System',
        status: u.isActive ? 'active' : 'inactive'
    }));

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        User Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage system users and their administrative permissions
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>
                    Add User
                </Button>
            </Box>

            <DataTable
                title="System Users"
                rows={mappedUsers}
                columns={columns}
                loading={loading}
                module="management"
            />
        </Box>
    );
}
