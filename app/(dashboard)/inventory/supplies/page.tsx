'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';

const mockSupplies = [
    { id: 'SUP-001', name: 'A4 Paper (Reams)', stock: 500, unit: 'Reams', threshold: 100, status: 'In Stock' },
    { id: 'SUP-002', name: 'Chalk Boxes', stock: 50, unit: 'Boxes', threshold: 150, status: 'Low Stock' },
];

const columns: GridColDef[] = [
    { field: 'id', headerName: 'SKU', width: 120 },
    { field: 'name', headerName: 'Supply Name', width: 250 },
    { field: 'stock', headerName: 'Current Stock', width: 150, type: 'number' },
    { field: 'unit', headerName: 'Unit', width: 120 },
    {
        field: 'status',
        headerName: 'Status',
        width: 150,
        renderCell: (params) => (
            <Chip
                label={params.value as string}
                color={params.value === 'Low Stock' ? 'error' : 'success'}
                size="small"
            />
        )
    },
];

export default function SuppliesPage() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>Supply Management</Typography>
                <Typography variant="body1" color="text.secondary">Manage consumable supplies and distribution</Typography>
            </Box>
            <DataTable
                title="Supply Inventory"
                rows={mockSupplies}
                columns={columns}
                loading={false}
                module="inventory"
            />
        </Box>
    );
}
