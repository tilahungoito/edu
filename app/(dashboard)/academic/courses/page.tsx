'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    ImportContacts as CourseIcon,
    SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables/DataTable';
import { CourseDialog } from '@/app/components/management/CourseDialog';
import { CourseTransferDialog } from '@/app/components/management/CourseTransferDialog';
import coursesService, { Course } from '@/app/lib/api/courses.service';
import { useAuthStore } from '@/app/lib/store';

export default function CoursesPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const { data: courses, isLoading, refetch } = useQuery({
        queryKey: ['courses'],
        queryFn: () => coursesService.getAll(),
    });

    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'code',
            headerName: 'Course Code',
            width: 120,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={700} color="secondary">
                    {params.value}
                </Typography>
            )
        },
        { field: 'name', headerName: 'Course Name', flex: 1, minWidth: 200 },
        {
            field: 'credits',
            headerName: 'Credits',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={`${params.value} CR`}
                    size="small"
                    variant="soft"
                    color="primary"
                    sx={{ fontWeight: 700, borderRadius: '6px' }}
                />
            )
        },
        {
            field: 'instructor',
            headerName: 'Instructor',
            flex: 1,
            minWidth: 180,
            valueGetter: (params, row) => row.instructor?.username || 'Unassigned',
            renderCell: (params: GridRenderCellParams) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                        {params.value}
                    </Typography>
                    {params.value === 'Unassigned' && (
                        <Chip label="Assign" size="small" variant="outlined" color="warning" sx={{ height: 20, fontSize: '10px' }} />
                    )}
                </Box>
            )
        },
        {
            field: 'institution',
            headerName: 'Institution',
            flex: 1,
            minWidth: 180,
            valueGetter: (params, row) => (row as any).institution?.name || 'Local',
        },
    ], [theme]);

    const handleAdd = () => {
        setSelectedCourse(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (course: Course) => {
        setSelectedCourse(course);
        setIsDialogOpen(true);
    };

    const handleTransfer = (course: Course) => {
        setSelectedCourse(course);
        setIsTransferDialogOpen(true);
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <CourseIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            Course Management
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Define and manage courses, curriculum, and instructor assignments.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        sx={{ borderRadius: 2.5 }}
                    >
                        Create Course
                    </Button>
                </Box>
            </Box>

            <DataTable
                title="Academic Courses"
                subtitle="Manage curriculum and assigned instructors"
                columns={columns}
                rows={courses || []}
                loading={isLoading}
                module="courses"
                onAdd={handleAdd}
                onEdit={handleEdit}
                onView={(course) => console.log('View course:', course)}
                onRefresh={refetch}
                showSearch={true}
                toolbarActions={
                    <Button
                        size="small"
                        variant="soft"
                        startIcon={<TransferIcon />}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                        onClick={() => selectedCourse && handleTransfer(selectedCourse)}
                        disabled={!selectedCourse}
                    >
                        Transfer Instructor
                    </Button>
                }
            />

            <CourseDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => refetch()}
                course={selectedCourse}
            />

            <CourseTransferDialog
                open={isTransferDialogOpen}
                onClose={() => setIsTransferDialogOpen(false)}
                onSuccess={() => refetch()}
                course={selectedCourse}
            />
        </Box>
    );
}
