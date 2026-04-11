'use client';

import React, { useState, useMemo } from 'react';
import { Box, Typography, Chip, Button, IconButton, alpha, useTheme, CircularProgress } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { KPIGrid } from '@/app/components/analytics';
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryRequestsService, CreateInventoryRequestData, InventoryRequestStatus } from '@/app/lib/api/inventory-requests.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { toast } from 'react-hot-toast';
import { InventoryRequestDialog } from '@/app/components/management/InventoryRequestDialog';

export default function InventoryRequestsPage() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const [openAddDialog, setOpenAddDialog] = useState(false);

    // Queries
    const { data: requests = [], isLoading, isFetching } = useQuery({
        queryKey: ['inventory-requests', user?.tenantId],
        queryFn: () => inventoryRequestsService.getAll({ institutionId: user?.tenantId || '' }),
        enabled: !!user?.tenantId,
    });

    // Real-time synchronization
    useRealTime('inventory_request_created', () => {
        queryClient.invalidateQueries({ queryKey: ['inventory-requests'] });
    });
    useRealTime('inventory_request_status_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['inventory-requests'] });
    });
    useRealTime('inventory_request_deleted', () => {
        queryClient.invalidateQueries({ queryKey: ['inventory-requests'] });
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateInventoryRequestData) => inventoryRequestsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-requests'] });
            toast.success('Inventory request submitted successfully');
            setOpenAddDialog(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: (params: { id: string; status: InventoryRequestStatus; comment?: string }) => 
            inventoryRequestsService.updateStatus(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-requests'] });
            toast.success('Request status updated');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => inventoryRequestsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-requests'] });
            toast.success('Request removed');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete request');
        }
    });

    const columns: GridColDef[] = [
        { 
            field: 'id', 
            headerName: 'Request ID', 
            width: 120,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {params.value?.substring(0, 8).toUpperCase()}
                </Typography>
            )
        },
        { field: 'itemType', headerName: 'Item', width: 180 },
        { field: 'quantity', headerName: 'Qty', width: 100, type: 'number' },
        {
            field: 'priority',
            headerName: 'Priority',
            width: 120,
            renderCell: (params) => {
                const priority = params.value?.toLowerCase();
                const colors: Record<string, 'info' | 'warning' | 'error'> = {
                    low: 'info',
                    medium: 'info',
                    high: 'warning',
                    urgent: 'error',
                };
                return (
                    <Chip
                        label={params.value?.toUpperCase()}
                        size="small"
                        color={colors[priority] || 'default'}
                        sx={{ fontWeight: 800, borderRadius: 1.5 }}
                    />
                );
            },
        },
        { 
            field: 'status', 
            headerName: 'Status', 
            width: 160,
            renderCell: (params) => {
                const status = params.value as InventoryRequestStatus;
                const colors: Record<string, 'primary' | 'warning' | 'success' | 'error' | 'default'> = {
                    'DRAFT': 'default',
                    'PENDING_SCHOOL': 'warning',
                    'PENDING_WOREDA': 'warning',
                    'PENDING_ZONE': 'warning',
                    'PENDING_BUREAU': 'warning',
                    'APPROVED': 'success',
                    'REJECTED': 'error',
                    'CANCELLED': 'error',
                };
                return (
                    <Chip
                        label={status.replace(/_/g, ' ')}
                        size="small"
                        color={colors[status] || 'default'}
                        variant={status === 'APPROVED' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 600, px: 1 }}
                    />
                );
            }
        },
        { 
            field: 'createdAt', 
            headerName: 'Requested Date', 
            width: 150, 
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '' 
        },
        { 
            field: 'requester', 
            headerName: 'Requester', 
            width: 180,
            valueGetter: (value, row) => row.requester?.firstName ? `${row.requester.firstName} ${row.requester.lastName || ''}` : row.requester?.username || 'Unknown'
        },
    ];

    const kpis = useMemo(() => {
        const total = requests.length;
        const pending = requests.filter(r => r.status.startsWith('PENDING')).length;
        const approved = requests.filter(r => r.status === 'APPROVED').length;
        
        return [
            { label: 'Total Requests', value: total, icon: 'Inventory', trend: 'stable' },
            { label: 'Pending Approval', value: pending, icon: 'Warning', trend: pending > 0 ? 'up' : 'stable', color: 'warning' },
            { label: 'Approved Requests', value: approved, icon: 'CheckCircle', trend: 'up', color: 'success' },
        ];
    }, [requests]);

    return (
        <Box sx={{ p: { xs: 2.5, md: 3, lg: 5 }, className: "animate-fade-in" }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1.5 }}>
                            Supply & Asset Requests
                        </Typography>
                        {(isLoading || isFetching) && <CircularProgress size={20} thickness={5} />}
                    </Box>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage resource requests from schools, woredas, and zones
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <IconButton onClick={() => queryClient.invalidateQueries({ queryKey: ['inventory-requests'] })} disabled={isFetching} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <RefreshIcon />
                    </IconButton>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={() => setOpenAddDialog(true)}
                        sx={{ borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700, textTransform: 'none' }}
                    >
                        New Request
                    </Button>
                </Box>
            </Box>

            <Box sx={{ mb: 5 }}>
                <KPIGrid kpis={kpis as any} loading={isLoading} />
            </Box>

            <DataTable
                title="Requests Registry"
                subtitle="Track and manage all submitted supply requests"
                rows={requests}
                columns={columns}
                loading={isLoading}
                onAdd={() => setOpenAddDialog(true)}
                onDelete={(row) => deleteMutation.mutate(row.id)}
                module="inventory"
                resourceType="inventory_request"
                statusField="status"
            />

            <InventoryRequestDialog
                open={openAddDialog}
                onClose={() => setOpenAddDialog(false)}
                onSubmit={(data) => createMutation.mutate(data)}
                loading={createMutation.isPending}
            />
        </Box>
    );
}
