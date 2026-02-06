'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Avatar, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { staffService } from '@/app/lib/api/staff.service';

const staffColumns: GridColDef[] = [
    {
        field: 'username',
        headerName: 'Username',
        flex: 1,
        minWidth: 150,
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    {
        field: 'role',
        headerName: 'Role',
        width: 150,
        valueGetter: (value, row) => row.role?.name || '',
        renderCell: (params) => {
            // Simple mapping for role colors
            const role = params.value as string;
            let color: 'default' | 'primary' | 'secondary' | 'warning' | 'error' | 'success' = 'default';
            if (role.includes('ADMIN')) color = 'primary';
            if (role === 'INSTRUCTOR') color = 'success';
            if (role === 'STUDENT') color = 'secondary';

            return (
                <Chip
                    label={role.replace('_', ' ')}
                    size="small"
                    color={color}
                />
            );
        }
    },
    { field: 'scopeType', headerName: 'Scope', width: 100 },
    {
        field: 'isActive',
        headerName: 'Status',
        width: 100,
        renderCell: (params) => (
            <Chip
                label={params.value ? 'Active' : 'Inactive'}
                color={params.value ? 'success' : 'error'}
                size="small"
            />
        )
    },
];

export default function StaffPage() {
    const [loading, setLoading] = useState(true);
    const [selectedSchool, setSelectedSchool] = useState<string>('');
    const [staff, setStaff] = useState<any[]>([]);

    // We would need a way to fetch schools for the filter too, 
    // but for now let's just make the staff list distinct or remove the school filter if dependencies are missing.
    // Assuming we want to fetch all staff for now.

    const fetchStaff = async () => {
        setLoading(true);
        try {
            // Ideally we get the school ID from the user's scope or context
            // For now, let's fetch all users who are not students? Or just all users.
            // The backend filter `role` can be used if we want specific roles.
            // Let's fetch all users for now and we can filter client side if needed.
            const data = await staffService.getAllStaff();
            setStaff(data);
        } catch (error) {
            console.error('Failed to fetch staff', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const filteredStaff = selectedSchool
        ? staff.filter(s => s.scopeId === selectedSchool)
        : staff;

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    Staff Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage all staff members across schools
                </Typography>
            </Box>

            <DataTable
                title="All Staff"
                subtitle={`${filteredStaff.length} staff members`}
                columns={staffColumns}
                rows={filteredStaff}
                loading={loading}
                module="hr"
                onAdd={() => console.log('Add staff')}
                onEdit={(staff) => console.log('Edit staff', staff)}
                onView={(staff) => console.log('View staff', staff)}
                onDelete={(staff) => console.log('Delete staff', staff)}
                statusField="isActive"
                statusColors={{
                    true: 'success',
                    false: 'error',
                }}
                checkboxSelection
            />
        </Box>
    );
}
