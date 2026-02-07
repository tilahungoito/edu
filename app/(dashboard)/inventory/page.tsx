'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
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
import type { KPIData } from '@/app/lib/types';


// Using imported mockAssets from central mock-data

const inventoryKPIs: KPIData[] = [
    { label: 'Total Assets', value: 4250, trend: 'up', changePercent: 5.2, icon: 'Inventory' },
    { label: 'Total Value', value: 12500000, trend: 'up', changePercent: 8.1, icon: 'Budget' },
    { label: 'Assets in Good Condition', value: 85, trend: 'stable', icon: 'Groups' },
    { label: 'Pending Requests', value: 23, trend: 'down', changePercent: -12, icon: 'Badge' },
];

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
            };
            return (
                <Chip
                    label={params.value?.charAt(0).toUpperCase() + params.value?.slice(1)}
                    size="small"
                    color={categoryColors[params.value as string] || 'default'}
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
                    color={conditionColors[params.value as string] || 'default'}
                />
            );
        }
    },
    { field: 'location', headerName: 'Location', flex: 1, minWidth: 200 },
    { field: 'status', headerName: 'Status', width: 100 },
];

export default function InventoryPage() {
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const scopedAssets = useScopedData(mockAssets, 'inventory');

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    let filteredAssets: any[] = scopedAssets;
    if (categoryFilter) {
        filteredAssets = filteredAssets.filter((a: any) => a.category === categoryFilter);
    }

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
            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={inventoryKPIs} loading={loading} columns={4} />
            </Box>

            {/* Assets Table */}
            <DataTable
                title="Assets Inventory"
                subtitle={`${filteredAssets.length} assets`}
                columns={assetColumns}
                rows={filteredAssets.map(a => ({ ...a, id: a.id || String(Math.random()) }))}
                loading={loading}
                module="inventory"
                onAdd={() => console.log('Add asset')}
                onEdit={(asset) => console.log('Edit asset', asset)}
                onView={(asset) => console.log('View asset', asset)}
                onDelete={(asset) => console.log('Delete asset', asset)}
                statusField="status"
                statusColors={{
                    active: 'success',
                    inactive: 'error',
                    disposed: 'warning',
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
                            <MenuItem value="electronics">Electronics</MenuItem>
                            <MenuItem value="furniture">Furniture</MenuItem>
                            <MenuItem value="equipment">Equipment</MenuItem>
                            <MenuItem value="vehicles">Vehicles</MenuItem>
                        </Select>
                    </FormControl>
                }
            />
        </Box>
    );
}
