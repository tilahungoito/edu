'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    useTheme,
    alpha,
    Breadcrumbs,
    Link as MuiLink,
    Chip,
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleConfigService } from '@/app/lib/api/schedules.service';
import { institutionsService } from '@/app/lib/api/institutions.service';
import { useAuthStore } from '@/app/lib/store';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import Link from 'next/link';
import DataTable from '@/app/components/tables/DataTable';
import { GridColDef } from '@mui/x-data-grid';
import { toast } from 'react-hot-toast';

export default function AcademicPeriodsPage() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const searchParams = useSearchParams();
    const overrideId = searchParams.get('institutionId');
    const effectiveInstitutionId = overrideId || user?.tenantId;

    const [open, setOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        isActive: true,
    });

    const { data: periods, isLoading } = useQuery({
        queryKey: ['academic-periods', effectiveInstitutionId],
        queryFn: () => scheduleConfigService.getPeriods(effectiveInstitutionId || ''),
        enabled: !!effectiveInstitutionId,
    });

    const { data: institution } = useQuery({
        queryKey: ['institution', overrideId],
        queryFn: () => institutionsService.getById(overrideId!),
        enabled: !!overrideId,
    });

    // --- Real-time Updates ---
    useRealTime('period_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['academic-periods'] });
    });
    useRealTime('period_created', () => {
        queryClient.invalidateQueries({ queryKey: ['academic-periods'] });
    });
    useRealTime('period_deleted', () => {
        queryClient.invalidateQueries({ queryKey: ['academic-periods'] });
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => {
            if (!effectiveInstitutionId) {
                throw new Error('No institution context found. Please ensure you are logged in as a school administrator or managing a specific school.');
            }
            return scheduleConfigService.createPeriod({ ...data, institutionId: effectiveInstitutionId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-periods'] });
            toast.success('Academic period created successfully');
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to create academic period');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => scheduleConfigService.updatePeriod(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-periods'] });
            toast.success('Academic period updated successfully');
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to update academic period');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => scheduleConfigService.deletePeriod(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-periods'] });
            toast.success('Academic period deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to delete academic period');
        }
    });

    const handleOpen = (period?: any) => {
        if (period) {
            setSelectedPeriod(period);
            setFormData({
                name: period.name,
                startDate: period.startDate.split('T')[0],
                endDate: period.endDate.split('T')[0],
                isActive: period.isActive,
            });
        } else {
            setSelectedPeriod(null);
            setFormData({
                name: '',
                startDate: '',
                endDate: '',
                isActive: true,
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedPeriod(null);
    };

    const handleSubmit = () => {
        if (selectedPeriod) {
            updateMutation.mutate({ id: selectedPeriod.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Period Name', flex: 1 },
        {
            field: 'startDate',
            headerName: 'Start Date',
            flex: 1,
            valueFormatter: (params) => new Date(params).toLocaleDateString()
        },
        {
            field: 'endDate',
            headerName: 'End Date',
            flex: 1,
            valueFormatter: (params) => new Date(params).toLocaleDateString()
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            bgcolor: params.value ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                            color: params.value ? theme.palette.success.main : theme.palette.error.main,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            letterSpacing: 0.5,
                        }}
                    >
                        {params.value ? 'ACTIVE' : 'INACTIVE'}
                    </Box>
                    {params.value && (
                        <Chip
                            label="Current"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                        />
                    )}
                </Box>
            ),
        }
    ];

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }} className="animate-fade-in">
            {overrideId && (
                <Breadcrumbs sx={{ mb: 2 }}>
                    <MuiLink component={Link} href="/management/schools" underline="hover" color="inherit">
                        Schools
                    </MuiLink>
                    <Typography color="text.primary">Academic Periods</Typography>
                </Breadcrumbs>
            )}

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <CalendarIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            {institution ? `${institution.name} Periods` : 'Academic Periods'}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {institution
                            ? `Managing academic years and teaching semesters for ${institution.name}.`
                            : 'Manage academic years and teaching semesters.'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                    New Period
                </Button>
            </Box>

            <DataTable
                title="Academic Periods"
                rows={periods || []}
                columns={columns}
                loading={isLoading}
                module="academic"
                onAdd={() => handleOpen()}
                onEdit={(period: any) => handleOpen(period)}
                onDelete={(period: any) => deleteMutation.mutate(period.id)}
                onView={(period: any) => {}}
                onToggleStatus={(period: any) => updateMutation.mutate({ id: period.id, data: { isActive: !period.isActive } })}
            />

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {selectedPeriod ? 'Edit Academic Period' : 'New Academic Period'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Period Name"
                                fullWidth
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., 2025/26 Semester I"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Start Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="End Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleClose} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                        {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Period'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
