'use client';

import React from 'react';
import { Box, Typography, Button, Avatar, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { Add as AddIcon } from '@mui/icons-material';

const mockUsers = [
    { id: 'user-001', name: 'Amanuel Tesfaye', email: 'amanuel@edu.gov.et', role: 'Bureau Admin', tenant: 'Bureau', status: 'active' },
    { id: 'user-002', name: 'Kidist Hailu', email: 'kidist@edu.gov.et', role: 'Zone Admin', tenant: 'Mekelle Zone', status: 'active' },
    { id: 'user-003', name: 'Bereket Gebru', email: 'bereket@edu.gov.et', role: 'Woreda Admin', tenant: 'Ayder Woreda', status: 'active' },
];

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
                rows={mockUsers}
                columns={columns}
                loading={false}
                module="management"
            />
        </Box>
    );
}
