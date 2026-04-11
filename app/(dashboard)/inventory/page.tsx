'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { KPIGrid } from '@/app/components/analytics';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { inventoryService, Asset, CreateAssetDto } from '@/app/lib/api/inventory.service';
import { AssetDialog } from '@/app/components/management/AssetDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import type { KPIData } from '@/app/lib/types';

export default function InventoryPage() {
    const queryClient = useQueryClient();
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Queries
    const { data: assets = [], isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: () => inventoryService.getAll(),
    });

    // Real-time synchronization
    useRealTime('inventory_created', () => queryClient.invalidateQueries({ queryKey: ['inventory'] }));
    useRealTime('inventory_updated', () => queryClient.invalidateQueries({ queryKey: ['inventory'] }));
    useRealTime('inventory_deleted', () => queryClient.invalidateQueries({ queryKey: ['inventory'] }));

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateAssetDto) => inventoryService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Asset registered successfully');
            setDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to register asset');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (params: { id: string; data: Partial<CreateAssetDto> }) => inventoryService.update(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Asset updated successfully');
            setDialogOpen(false);
            setSelectedAsset(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update asset');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => inventoryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Asset removed successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete asset');
        }
    });

    // Data Processing
    const scopedAssets = useScopedData(assets, 'inventory');
    const filteredAssets = useMemo(() => {
        if (!categoryFilter) return scopedAssets;
        return scopedAssets.filter((a) => a.category.toLowerCase() === categoryFilter.toLowerCase());
    }, [scopedAssets, categoryFilter]);

    const kpis: KPIData[] = useMemo(() => {
        const totalAssets = assets.length;
        const totalValue = assets.reduce((sum, a) => sum + (a.totalValue || 0), 0);
        const goodCondition = assets.filter(a => ['new', 'good'].includes(a.condition.toLowerCase())).length;
        const goodPercent = totalAssets > 0 ? Math.round((goodCondition / totalAssets) * 100) : 0;

        return [
            { label: 'Total Assets', value: totalAssets, trend: 'up', changePercent: 0, icon: 'Inventory' },
            { label: 'Total Value', value: totalValue, trend: 'up', changePercent: 0, icon: 'Budget' },
            { label: 'Good Condition', value: `${goodPercent}%`, trend: 'stable', icon: 'Groups' },
            { label: 'Categories', value: new Set(assets.map(a => a.category)).size, trend: 'stable', icon: 'Badge' },
        ];
    }, [assets]);

    const handleSaveAsset = async (data: any, id?: string) => {
        if (id) {
            updateMutation.mutate({ id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const assetColumns: GridColDef[] = [
        { field: 'assetCode', headerName: 'Code', width: 110 },
        { field: 'name', headerName: 'Asset Name', flex: 1.2, minWidth: 160 },
        {
            field: 'category',
            headerName: 'Category',
            width: 120,
            renderCell: (params) => {
                const colors: Record<string, 'primary' | 'secondary' | 'warning' | 'success' | 'info'> = {
                    electronics: 'primary',
                    furniture: 'secondary',
                    equipment: 'warning',
                    vehicles: 'success',
                    books: 'info',
                    science: 'secondary',
                };
                const val = params.value?.toLowerCase() || '';
                return (
                    <Chip
                        label={params.value || 'None'}
                        size="small"
                        color={(colors[val] || 'default') as any}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                );
            }
        },
        { field: 'quantity', headerName: 'Qty', width: 60, type: 'number' },
        {
            field: 'unitValue',
            headerName: 'Value (Unit)',
            width: 100,
            type: 'number',
            valueFormatter: (value) => (typeof value === 'number' ? `${(value as number).toLocaleString()}` : ''),
        },
        {
            field: 'condition',
            headerName: 'Cond.',
            width: 80,
            renderCell: (params) => {
                const conditionColors: Record<string, 'success' | 'warning' | 'error' | 'primary'> = {
                    new: 'primary',
                    good: 'success',
                    fair: 'warning',
                    poor: 'error',
                    broken: 'error',
                };
                return (
                    <Chip
                        label={params.value?.toString().toUpperCase()}
                        size="small"
                        color={conditionColors[params.value?.toLowerCase() as string] || 'default'}
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                );
            }
        },
        { field: 'location', headerName: 'Location', flex: 1, minWidth: 150 },
        { field: 'status', headerName: 'Status', width: 110 },
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                    Inventory Management
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Real-time tracking and management of institutional assets
                </Typography>
            </Box>

            <Box {... (isLoading ? {} : { sx: { mb: 4 } })}>
                <KPIGrid kpis={kpis} loading={isLoading} columns={4} />
            </Box>

            <DataTable
                title="Assets Inventory"
                subtitle={`${filteredAssets.length} assets registered`}
                columns={assetColumns}
                rows={filteredAssets}
                loading={isLoading}
                module="inventory"
                resourceType="asset"
                onAdd={() => {
                    setSelectedAsset(null);
                    setDialogOpen(true);
                }}
                onEdit={(asset) => {
                    setSelectedAsset(asset);
                    setDialogOpen(true);
                }}
                onDelete={(asset) => deleteMutation.mutate(asset.id)}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['inventory'] })}
                statusField="status"
                statusColors={{
                    active: 'success',
                    inactive: 'error',
                    disposed: 'warning',
                    'in stock': 'success',
                    'limited': 'warning',
                    'out of stock': 'error',
                }}
                checkboxSelection
                toolbarActions={
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Category Filter</InputLabel>
                        <Select
                            value={categoryFilter}
                            label="Category Filter"
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <MenuItem value="">All Categories</MenuItem>
                            {Array.from(new Set(assets.map(a => a.category))).map(cat => (
                                <MenuItem key={cat} value={cat.toLowerCase()}>{cat}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                }
            />

            <AssetDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setSelectedAsset(null);
                }}
                onSubmit={handleSaveAsset}
                editData={selectedAsset}
            />
        </Box>
    );
}
