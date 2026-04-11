'use client';

import React, { useState, useMemo } from 'react';
import { Box, Typography, alpha, useTheme, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { 
    Refresh as RefreshIcon,
    MenuBook as MenuBookIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { subjectsService, Subject, CreateSubjectDto } from '@/app/lib/api/subjects.service';
import { SubjectDialog } from '@/app/components/management/SubjectDialog';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealTime } from '@/app/lib/hooks/useRealTime';

export default function SubjectRegistryPage() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Subject | null>(null);

    // --- Queries ---
    const { data: subjects = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => subjectsService.getAll(),
    });

    // --- Real-time Updates ---
    useRealTime('subject_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['subjects'] });
    });
    useRealTime('subject_created', () => {
        queryClient.invalidateQueries({ queryKey: ['subjects'] });
    });
    useRealTime('subject_deleted', () => {
        queryClient.invalidateQueries({ queryKey: ['subjects'] });
    });

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: (data: CreateSubjectDto) => subjectsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            toast.success('Subject created successfully');
            setDialogOpen(false);
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create subject')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<CreateSubjectDto> }) => 
            subjectsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            toast.success('Subject updated successfully');
            setDialogOpen(false);
            setEditData(null);
        },
        onError: (error: any) => toast.error(error.message || 'Failed to update subject')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => subjectsService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            toast.success('Subject removed from registry');
        },
        onError: (error: any) => toast.error(error.message || 'Failed to delete subject')
    });

    const handleFormSubmit = async (data: CreateSubjectDto, id?: string) => {
        if (id) {
            updateMutation.mutate({ id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const subjectColumns: GridColDef<Subject>[] = [
        { 
            field: 'name', 
            headerName: 'Subject Name', 
            flex: 1.5, 
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                        p: 0.8, 
                        borderRadius: 1.5, 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        display: 'flex' 
                    }}>
                        <MenuBookIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
                </Box>
            )
        },
        { 
            field: 'code', 
            headerName: 'Code', 
            width: 120,
            renderCell: (params) => (
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ bgcolor: alpha(theme.palette.divider, 0.5), px: 1, py: 0.5, borderRadius: 1 }}>
                    {params.value}
                </Typography>
            )
        },
        { field: 'description', headerName: 'Description', flex: 2, minWidth: 250 },
        { 
            field: 'createdAt', 
            headerName: 'Added On', 
            width: 150,
            valueFormatter: (value) => value ? new Date(value as string).toLocaleDateString() : '-'
        }
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1.5 }}>
                            Subject Configuration
                        </Typography>
                        {(isLoading || isFetching) && <CircularProgress size={20} />}
                    </Box>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage the global registry of all core subjects available across curriculum tracks.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Refresh Registry">
                        <IconButton onClick={() => refetch()} disabled={isFetching} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <IconButton 
                        color="primary" 
                        onClick={() => {
                            setEditData(null);
                            setDialogOpen(true);
                        }}
                        sx={{ 
                            bgcolor: theme.palette.primary.main, 
                            color: 'white',
                            '&:hover': { bgcolor: theme.palette.primary.dark }
                        }}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
            </Box>

            <DataTable
                title="Academic Subjects"
                subtitle={`${subjects.length} subjects registered in the system`}
                columns={subjectColumns as any}
                rows={subjects}
                loading={isLoading}
                module="academic"
                resourceType="subject"
                allowedRoles={['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'REGION_ADMIN', 'INSTITUTION_ADMIN']}
                onAdd={() => {
                    setEditData(null);
                    setDialogOpen(true);
                }}
                onEdit={(subject) => {
                    setEditData(subject);
                    setDialogOpen(true);
                }}
                onDelete={(subject) => {
                    if (window.confirm(`Are you sure you want to remove ${subject.name}?`)) {
                        deleteMutation.mutate(subject.id);
                    }
                }}
                onRefresh={refetch}
                checkboxSelection
            />

            <SubjectDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditData(null);
                }}
                onSubmit={handleFormSubmit as any}
                editData={editData}
            />
        </Box>
    );
}
