'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    FormControl,
    Select,
    MenuItem,
    Chip,
    LinearProgress,
    Button,
    IconButton,
    Tabs,
    Tab,
    alpha,
    useTheme,
    CircularProgress,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { KPIGrid } from '@/app/components/analytics';
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    RequestQuote as RequestIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService, CreateBudgetAllocationDto, CreateBudgetRequestDto } from '@/app/lib/api/budget.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { toast } from 'react-hot-toast';
import { BudgetAllocationDialog } from '@/app/components/management/BudgetAllocationDialog';
import { BudgetRequestDialog } from '@/app/components/management/BudgetRequestDialog';

export default function BudgetPage() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const [tabValue, setTabValue] = useState(0);
    const [yearFilter, setYearFilter] = useState<number>(2024);
    const [openAllocDialog, setOpenAllocDialog] = useState(false);
    const [openReqDialog, setOpenReqDialog] = useState(false);

    const isAdmin = user?.roles?.some(r => 
        ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN'].includes(r.name)
    );

    // Queries
    const { data: allocations = [], isLoading: isLoadingAlloc } = useQuery({
        queryKey: ['budget-allocations', user?.tenantId, yearFilter],
        queryFn: () => budgetService.getAllAllocations({ institutionId: user?.tenantId || '', fiscalYear: yearFilter }),
        enabled: !!user?.tenantId,
    });

    const { data: requests = [], isLoading: isLoadingReq } = useQuery({
        queryKey: ['budget-requests', user?.tenantId],
        queryFn: () => budgetService.getAllRequests({ institutionId: user?.tenantId || '' }),
        enabled: !!user?.tenantId,
    });

    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['budget-stats', user?.tenantId, yearFilter],
        queryFn: () => budgetService.getStats({ institutionId: user?.tenantId || '', fiscalYear: yearFilter }),
        enabled: !!user?.tenantId,
    });

    // Real-time synchronization
    useRealTime('budget_allocated', () => {
        queryClient.invalidateQueries({ queryKey: ['budget-allocations'] });
        queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
    });
    useRealTime('budget_request_created', () => {
        queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
    });
    useRealTime('budget_status_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
        queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
    });

    // Mutations
    const createAllocMutation = useMutation({
        mutationFn: (data: CreateBudgetAllocationDto) => budgetService.createAllocation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-allocations'] });
            queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
            toast.success('Budget allocation created');
            setOpenAllocDialog(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create allocation');
        }
    });

    const createReqMutation = useMutation({
        mutationFn: (data: CreateBudgetRequestDto) => budgetService.createRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
            toast.success('Budget request submitted');
            setOpenReqDialog(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        }
    });

    const budgetKPIs = useMemo(() => [
        { label: 'Total Allocated', value: stats?.totalAllocated || 0, trend: 'stable', icon: 'Budget' },
        { label: 'Spent Amount', value: stats?.totalSpent || 0, trend: 'up', icon: 'People', color: 'warning' },
        { label: 'Remaining', value: stats?.totalRemaining || 0, trend: 'stable', icon: 'Badge', color: 'success' },
        { label: 'Utilization', value: `${(stats?.utilizationRate || 0).toFixed(1)}%`, trend: 'up', icon: 'Inventory' },
    ], [stats]);

    const budgetColumns: GridColDef[] = [
        { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (value, row) => row.institution?.name || 'Local Dept' },
        {
            field: 'category',
            headerName: 'Category',
            width: 140,
            renderCell: (params) => (
                <Chip
                    label={params.value?.toUpperCase()}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                />
            )
        },
        { field: 'allocatedAmount', headerName: 'Allocated', width: 140, type: 'number', valueFormatter: (value) => `${(value / 1000).toFixed(1)}K ETB` },
        { field: 'spentAmount', headerName: 'Spent', width: 120, type: 'number' },
        {
            field: 'utilization',
            headerName: 'Utilization',
            width: 150,
            renderCell: (params) => {
                const percent = (params.row.spentAmount / params.row.allocatedAmount) * 100;
                return (
                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={Math.min(percent, 100)} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                        <Typography variant="caption" fontWeight={700}>{percent.toFixed(0)}%</Typography>
                    </Box>
                );
            }
        },
        { field: 'status', headerName: 'Status', width: 110 }
    ];

    const requestColumns: GridColDef[] = [
        { 
            field: 'id', 
            headerName: 'Request ID', 
            width: 110, 
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {(params.value as string)?.substring(0, 8).toUpperCase()}
                </Typography>
            )
        },
        { field: 'amount', headerName: 'Requested (ETB)', width: 140, type: 'number' },
        { field: 'purpose', headerName: 'Purpose', flex: 1 },
        { 
            field: 'status', 
            headerName: 'Status', 
            width: 150,
            renderCell: (params) => {
                const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
                    'APPROVED': 'success',
                    'REJECTED': 'error',
                    'PENDING_SCHOOL': 'warning',
                    'PENDING_WOREDA': 'warning',
                    'PENDING_ZONE': 'warning',
                    'PENDING_BUREAU': 'warning',
                };
                return (
                    <Chip 
                        label={params.value?.replace(/_/g, ' ')} 
                        size="small" 
                        color={colors[params.value as string] || 'default'} 
                        sx={{ fontWeight: 800 }} 
                    />
                );
            }
        },
        { field: 'createdAt', headerName: 'Date', width: 120, valueFormatter: (value) => new Date(value).toLocaleDateString() }
    ];

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['budget-allocations'] });
        queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
        queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
    };

    return (
        <Box sx={{ p: { xs: 2.5, md: 3, lg: 5 }, className: "animate-fade-in" }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1.5 }}>
                            Budget & Financials
                        </Typography>
                        {(isLoadingAlloc || isLoadingReq) && <CircularProgress size={20} />}
                    </Box>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Monitor institutional spending and manage budget allocation requests
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value as number)} sx={{ borderRadius: '10px' }}>
                            {[2024, 2023, 2022].map(y => <MenuItem key={y} value={y}>FY {y}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <IconButton onClick={handleRefresh} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <RefreshIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={isAdmin ? <AddIcon /> : <RequestIcon />}
                        onClick={() => isAdmin ? setOpenAllocDialog(true) : setOpenReqDialog(true)}
                        sx={{ borderRadius: '10px', px: 3, fontWeight: 700 }}
                    >
                        {isAdmin ? 'New Allocation' : 'Request Budget'}
                    </Button>
                </Box>
            </Box>

            <Box sx={{ mb: 5 }}>
                <KPIGrid kpis={budgetKPIs as any} loading={isLoadingStats} columns={4} />
            </Box>

            <Box sx={{ mb: 4 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tab label="Allocations Overview" sx={{ fontWeight: 700, textTransform: 'none' }} />
                    <Tab label="Budget Requests" sx={{ fontWeight: 700, textTransform: 'none' }} />
                </Tabs>

                {tabValue === 0 ? (
                    <DataTable
                        title="Allocations Portfolio"
                        subtitle="Detailed breakdown of distributed funds by category"
                        rows={allocations}
                        columns={budgetColumns}
                        loading={isLoadingAlloc}
                        module="budget"
                        resourceType="budget_allocation"
                    />
                ) : (
                    <DataTable
                        title="Budget Requests"
                        subtitle="Track supplementary budget requests and status updates"
                        rows={requests}
                        columns={requestColumns}
                        loading={isLoadingReq}
                        module="budget"
                        resourceType="budget_request"
                        statusField="status"
                    />
                )}
            </Box>

            <BudgetAllocationDialog
                open={openAllocDialog}
                onClose={() => setOpenAllocDialog(false)}
                onSubmit={(data) => createAllocMutation.mutate(data)}
                loading={createAllocMutation.isPending}
            />

            <BudgetRequestDialog
                open={openReqDialog}
                onClose={() => setOpenReqDialog(false)}
                onSubmit={(data) => createReqMutation.mutate({ ...data, institutionId: user?.tenantId || '' })}
                loading={createReqMutation.isPending}
            />
        </Box>
    );
}
