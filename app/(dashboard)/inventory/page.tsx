'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { inventoryService, Asset } from '@/app/lib/api/inventory.service';
import type { KPIData } from '@/app/lib/types';

const assetColumns: GridColDef[] = [
    { field: 'assetCode', headerName: 'Asset Code', width: 140 },
    { field: 'name', headerName: 'Asset Name', flex: 1, minWidth: 180 },
    {
        field: 'category',
        headerName: 'Category',
        width: 120,
        renderCell: (params) => {
            const categoryColors: Record<string, 'primary' | 'secondary' | 'warning' | 'success'> = {
                electronics: 'primary',
                furniture: 'secondary',
                equipment: 'warning',
                vehicles: 'success',
                books: 'info' as any,
                science: 'secondary',
            };
            return (
                <Chip
                    label={params.value?.charAt(0).toUpperCase() + params.value?.slice(1)}
                    size="small"
                    color={(categoryColors[params.value?.toLowerCase() as string] || 'default') as any}
                    variant="outlined"
                />
            );
        }
    },
    { field: 'quantity', headerName: 'Qty', width: 80, type: 'number' },
    {
        field: 'unitValue',
        headerName: 'Unit Value',
        width: 120,
        type: 'number',
        valueFormatter: (value) => (typeof value === 'number' ? `${(value as number).toLocaleString()} ETB` : ''),
    },
    {
        field: 'totalValue',
        headerName: 'Total Value',
        width: 130,
        type: 'number',
        valueFormatter: (value) => (typeof value === 'number' ? `${(value as number).toLocaleString()} ETB` : ''),
    },
    {
        field: 'condition',
        headerName: 'Condition',
        width: 100,
        renderCell: (params) => {
            const conditionColors: Record<string, 'success' | 'warning' | 'error' | 'primary'> = {
                new: 'primary',
                good: 'success',
                fair: 'warning',
                poor: 'error',
            };
            return (
                <Chip
                    label={params.value?.charAt(0).toUpperCase() + params.value?.slice(1)}
                    size="small"
                    color={conditionColors[params.value?.toLowerCase() as string] || 'default'}
                />
            );
        }
    },
    { field: 'location', headerName: 'Location', flex: 1, minWidth: 200 },
    { field: 'status', headerName: 'Status', width: 100 },
];

export default function InventoryPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<string>('');

    // Scoped data hook (if applicable for filtering frontend-side)
    const scopedAssets = useScopedData(assets, 'inventory');

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getAll();
            setAssets(data);
        } catch (error) {
            console.error('Failed to fetch assets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    // Real-time updates
    useRealTime('asset_created', (newAsset: Asset) => {
        setAssets(prev => [newAsset, ...prev]);
    });

    useRealTime('asset_updated', (updatedAsset: Asset) => {
        setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    });

    useRealTime('asset_deleted', ({ id }: { id: string }) => {
        setAssets(prev => prev.filter(a => a.id !== id));
    });

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

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    Inventory Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Track and manage assets across all education institutions
                </Typography>
            </Box>

            {/* KPIs */}
            <Box {... (loading ? {} : { sx: { mb: 4 } })}>
                <KPIGrid kpis={kpis} loading={loading} columns={4} />
            </Box>

            {/* Assets Table */}
            <DataTable
                title="Assets Inventory"
                subtitle={`${filteredAssets.length} assets`}
                columns={assetColumns}
                rows={filteredAssets}
                loading={loading}
                module="inventory"
                onAdd={() => console.log('Add asset dialog')}
                onEdit={(asset) => console.log('Edit asset dialog', asset)}
                onView={(asset) => console.log('View asset dialog', asset)}
                onDelete={async (asset) => {
                    if (confirm('Are you sure you want to delete this asset?')) {
                        await inventoryService.delete(asset.id);
                    }
                }}
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
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={categoryFilter}
                            label="Category"
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
        </Box>
    );
}
