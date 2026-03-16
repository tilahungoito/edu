'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    alpha,
    useTheme,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem
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
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { institutionsService } from '@/app/lib/api/institutions.service';

export default function StudentsPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [institutions, setInstitutions] = useState<any[]>([]);

    const { data: students, isLoading, refetch } = useQuery({
        queryKey: ['students', selectedInstitution],
        queryFn: () => studentsService.getAll({ institutionId: selectedInstitution || undefined }),
    });

    // Fetch institutions for filtering
    useQuery({
        queryKey: ['institutions'],
        queryFn: async () => {
            const data = await institutionsService.getAll();
            setInstitutions(data);
            return data;
        }
    });

    // Listen for real-time updates
    useRealTime('STATS_UPDATED', () => {
        refetch();
    });

    // Initialize filter based on user scope
    useState(() => {
        if (user?.tenantType === 'school') {
            setSelectedInstitution(user.tenantId || '');
        }
    });

    const scopedStudents = useScopedData(students || [], 'student');
    const filteredStudents = scopedStudents;

    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'username',
            headerName: 'Student',
            flex: 1.2,
            minWidth: 150,
            valueGetter: (value, row) => row.user?.username || '-',
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
                        {params.row.user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                            {params.row.user?.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: -0.5 }}>
                            {params.row.user?.email}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'id',
            headerName: 'ID',
            width: 100,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.secondary' }}>
                    #{params.value.slice(0, 6).toUpperCase()}
                </Typography>
            )
        },
        { field: 'program', headerName: 'Program', width: 130 },
        {
            field: 'year',
            headerName: 'Year',
            width: 80,
            renderCell: (params) => (
                <Chip
                    label={`Y${params.value}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                />
            )
        },
        {
            field: 'phone',
            headerName: 'Phone',
            width: 130,
            valueGetter: (value, row) => row.user?.phone || '-'
        },
        {
            field: 'institution',
            headerName: 'Institution',
            flex: 1,
            minWidth: 150,
            valueGetter: (params, row) => row.institution?.name || 'N/A',
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            valueGetter: (value, row) => row.user?.isActive,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Active' : 'Inactive'}
                    size="small"
                    color={params.value ? 'success' : 'error'}
                    variant="soft"
                    sx={{ fontWeight: 700, borderRadius: '6px', height: 24 }}
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

    const handleDelete = async (student: Student) => {
        try {
            await studentsService.delete(student.id);
            refetch();
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };


    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{
                mb: 5,
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', lg: 'flex-end' },
                gap: 3
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                        Students Directory
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
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
                subtitle={`Showing ${filteredStudents.length} students`}
                columns={columns}
                rows={filteredStudents}
                loading={isLoading}
                module="students"
                onAdd={handleAdd}
                onEdit={handleEdit}
                onView={() => { }}
                onDelete={handleDelete}
                onRefresh={refetch}
                showSearch={true}
                toolbarActions={
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {user?.tenantType !== 'school' && (
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Filter by Institution</InputLabel>
                                <Select
                                    value={selectedInstitution}
                                    label="Filter by Institution"
                                    onChange={(e) => setSelectedInstitution(e.target.value)}
                                >
                                    <MenuItem value="">All Institutions</MenuItem>
                                    {institutions.map(inst => (
                                        <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <Button
                            size="small"
                            startIcon={<UploadIcon />}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Import CSV
                        </Button>
                    </Box>
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
