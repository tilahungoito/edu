'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Avatar, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { mockStaff, mockSchools } from '@/app/lib/mock-data';

const staffColumns: GridColDef[] = [
    {
        field: 'fullName',
        headerName: 'Full Name',
        flex: 1,
        minWidth: 200,
        valueGetter: (value, row) => `${row.firstName} ${row.lastName} ${row.fatherName}`,
    },
    { field: 'employeeId', headerName: 'Employee ID', width: 130 },
    { field: 'schoolName', headerName: 'School', width: 180 },
    {
        field: 'position',
        headerName: 'Position',
        width: 130,
        renderCell: (params) => {
            const positionColors: Record<string, 'primary' | 'secondary' | 'warning' | 'success'> = {
                principal: 'primary',
                vice_principal: 'secondary',
                department_head: 'warning',
                teacher: 'success',
            };
            const label = typeof params.value === 'string' ? params.value.replace('_', ' ') : '';
            return (
                <Chip
                    label={label?.charAt(0).toUpperCase() + label?.slice(1)}
                    size="small"
                    color={(positionColors[params.value as string] || 'default') as any}
                />
            );
        }
    },
    { field: 'subject', headerName: 'Subject', width: 120 },
    {
        field: 'educationLevel',
        headerName: 'Education',
        width: 100,
        valueFormatter: ({ value }) => (typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : ''),
    },
    {
        field: 'gender',
        headerName: 'Gender',
        width: 80,
        valueFormatter: ({ value }) => (value === 'male' ? 'M' : 'F'),
    },
    { field: 'yearsOfExperience', headerName: 'Experience', width: 100, type: 'number' },
    {
        field: 'salary',
        headerName: 'Salary',
        width: 100,
        type: 'number',
        valueFormatter: ({ value }) => (typeof value === 'number' ? `${value.toLocaleString()} ETB` : '-'),
    },
    { field: 'status', headerName: 'Status', width: 100 },
];

export default function StaffPage() {
    const [loading, setLoading] = useState(true);
    const [selectedSchool, setSelectedSchool] = useState<string>('');
    const scopedStaff = useScopedData(mockStaff, 'staff');

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const filteredStaff = selectedSchool
        ? scopedStaff.filter(s => s.schoolId === selectedSchool)
        : scopedStaff;

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
                statusField="status"
                statusColors={{
                    active: 'success',
                    inactive: 'error',
                    suspended: 'warning',
                }}
                checkboxSelection
                toolbarActions={
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by School</InputLabel>
                        <Select
                            value={selectedSchool}
                            label="Filter by School"
                            onChange={(e) => setSelectedSchool(e.target.value)}
                        >
                            <MenuItem value="">All Schools</MenuItem>
                            {mockSchools.map(school => (
                                <MenuItem key={school.id} value={school.id}>{school.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                }
            />
        </Box>
    );
}
