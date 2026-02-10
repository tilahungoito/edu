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

    const isInstructor = user?.roles?.some(r => r.name === 'INSTRUCTOR');

    const { data: courses, isLoading, refetch } = useQuery({
        queryKey: ['courses', user?.id],
        queryFn: () => coursesService.getAll({
            instructorId: isInstructor ? user?.id : undefined,
            institutionId: user?.tenantType === 'school' ? user?.tenantId : undefined
        }),
    });

    const columns = useMemo<GridColDef[]>(() => [
        { field: 'name', headerName: 'Course Name', flex: 1.2, minWidth: 180 },
        {
            field: 'credit',
            headerName: 'Credits',
            width: 80,
            renderCell: (params) => (
                <Chip
                    label={`${params.value} CR`}
                    size="small"
                    variant="soft"
                    color="primary"
                    sx={{ fontWeight: 700, borderRadius: '6px', height: 24 }}
                />
            )
        },
        {
            field: 'instructor',
            headerName: 'Instructor',
            flex: 1,
            minWidth: 160,
            valueGetter: (params, row) => row.instructor?.username || 'Unassigned',
            renderCell: (params: GridRenderCellParams) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                        {params.value}
                    </Typography>
                    {params.value === 'Unassigned' && (
                        <Chip label="Assign" size="small" variant="outlined" color="warning" sx={{ height: 18, fontSize: '9px' }} />
                    )}
                </Box>
            )
        },
        {
            field: 'institution',
            headerName: 'Institution',
            flex: 1,
            minWidth: 150,
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

    const handleAssign = (course: Course) => {
        setSelectedCourse(course);
        setIsTransferDialogOpen(true);
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
                        Academic Courses
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage curriculum and assigned instructors across your {user?.tenantType || 'institution'}.
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
                onView={() => { }}
                onDelete={async (course) => {
                    if (course.id) {
                        try {
                            await coursesService.remove(course.id);
                            refetch();
                        } catch (error) {
                            console.error('Failed to delete course:', error);
                        }
                    }
                }}
                onRefresh={refetch}
                showSearch={true}
                toolbarActions={
                    <Button
                        size="small"
                        variant="soft"
                        startIcon={<TransferIcon />}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                        onClick={() => selectedCourse && handleAssign(selectedCourse)}
                        disabled={!selectedCourse}
                    >
                        Assign Instructor
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
