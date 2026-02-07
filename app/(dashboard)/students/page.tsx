'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    alpha,
    useTheme,
    Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Download as DownloadIcon,
    FilterAlt as FilterIcon,
    Upload as UploadIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables/DataTable';
import { StudentDialog } from '@/app/components/management/StudentDialog';
import studentsService, { Student } from '@/app/lib/api/students.service';
import { useAuthStore } from '@/app/lib/store';

export default function StudentsPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const { data: students, isLoading, refetch } = useQuery({
        queryKey: ['students'],
        queryFn: () => studentsService.getAll(),
    });

    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'username',
            headerName: 'Student',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            color: theme.palette.secondary.main,
                            fontSize: '0.875rem',
                            fontWeight: 700
                        }}
                    >
                        {params.row.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={600}>
                            {params.row.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {params.row.email}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'id',
            headerName: 'Student ID',
            width: 150,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    #{params.value.slice(0, 8).toUpperCase()}
                </Typography>
            )
        },
        { field: 'program', headerName: 'Program', width: 150 },
        {
            field: 'year',
            headerName: 'Year',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={`Year ${params.value}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                />
            )
        },
        { field: 'phone', headerName: 'Phone', width: 150 },
        {
            field: 'institution',
            headerName: 'Institution',
            flex: 1,
            minWidth: 180,
            valueGetter: (params, row) => row.institution?.name || 'N/A',
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Active' : 'Inactive'}
                    size="small"
                    color={params.value ? 'success' : 'error'}
                    variant="soft"
                    sx={{ fontWeight: 700, borderRadius: '6px' }}
                />
            ),
        },
    ], [theme]);

    const handleAdd = () => {
        setSelectedStudent(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (student: Student) => {
        setSelectedStudent(student);
        setIsDialogOpen(true);
    };

    const handleView = (student: Student) => {
        // Navigate to student profile or show details
        console.log('View student:', student);
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{
                mb: 4,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                        Students Directory
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage and track student information across your {user?.tenantType || 'institution'}.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="soft"
                        startIcon={<DownloadIcon />}
                        sx={{ borderRadius: 2.5 }}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        sx={{ borderRadius: 2.5 }}
                    >
                        Register Student
                    </Button>
                </Box>
            </Box>

            <DataTable
                title="All Students"
                subtitle={`Showing ${students?.length || 0} students based on your permissions`}
                columns={columns}
                rows={students || []}
                loading={isLoading}
                module="students"
                onAdd={handleAdd}
                onEdit={handleEdit}
                onView={handleView}
                onRefresh={refetch}
                showSearch={true}
                toolbarActions={
                    <Button
                        size="small"
                        startIcon={<UploadIcon />}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        Import CSV
                    </Button>
                }
            />

            <StudentDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => {
                    refetch();
                    // Optional: show toast notification
                }}
                student={selectedStudent}
            />
        </Box>
    );
}
