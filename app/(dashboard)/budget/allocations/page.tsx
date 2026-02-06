'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';

const mockAllocations = [
    { id: 'ALC-001', tenant: 'Mekelle Zone', amount: 50000000, source: 'Regional Block Grant', date: new Date('2024-01-01') },
    { id: 'ALC-002', tenant: 'Adigrat Zone', amount: 42000000, source: 'Regional Block Grant', date: new Date('2024-01-01') },
];

const columns: GridColDef[] = [
    { field: 'tenant', headerName: 'Administrative Unit', width: 250 },
    {
        field: 'amount',
        headerName: 'Allocated Amount',
        width: 200,
        type: 'number',
        valueFormatter: ({ value }) => typeof value === 'number' ? `${(value / 1000000).toFixed(1)}M ETB` : '-'
    },
    { field: 'source', headerName: 'Funding Source', width: 220 },
    {
        field: 'date',
        headerName: 'Date',
        width: 130,
        valueFormatter: ({ value }) => value && typeof value === 'object' && 'toLocaleDateString' in value ? (value as Date).toLocaleDateString() : ''
    },
];

export default function BudgetAllocationsPage() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>Budget Allocations</Typography>
                <Typography variant="body1" color="text.secondary">Manage disbursement of funds across administrative levels</Typography>
            </Box>
            <DataTable
                title="Allocations"
                rows={mockAllocations}
                columns={columns}
                loading={false}
                module="budget"
            />
        </Box>
    );
}
