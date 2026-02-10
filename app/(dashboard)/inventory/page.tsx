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
    { field: 'assetCode', headerName: 'Code', width: 110 },
    { field: 'name', headerName: 'Asset Name', flex: 1.2, minWidth: 160 },
    {
        field: 'category',
        headerName: 'Category',
        width: 100,
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
            };
            return (
                <Chip
                    label={params.value?.charAt(0).toUpperCase() + params.value?.slice(1)}
                    size="small"
                    color={conditionColors[params.value?.toLowerCase() as string] || 'default'}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                />
            );
        }
    },
    { field: 'location', headerName: 'Location', flex: 1, minWidth: 150 },
    { field: 'status', headerName: 'Status', width: 90 },
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
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                    Inventory Management
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Real-time tracking and management of institutional assets
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
                onAdd={() => { }}
                onEdit={() => { }}
                onView={() => { }}
                onDelete={async (asset) => {
                    await inventoryService.delete(asset.id);
                    fetchAssets(); // Refresh after delete
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
