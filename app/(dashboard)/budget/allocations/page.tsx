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
    { field: 'tenant', headerName: 'Admin Unit', flex: 1, minWidth: 160 },
    {
        field: 'amount',
        headerName: 'Allocated',
        width: 150,
        type: 'number',
        valueFormatter: (params: any) => typeof params.value === 'number' ? `${(params.value / 1000000).toFixed(1)}M ETB` : '-'
    },
    { field: 'source', headerName: 'Funding Source', flex: 1, minWidth: 160 },
    {
        field: 'date',
        headerName: 'Date',
        width: 130,
        valueFormatter: (value) => value && typeof value === 'object' && 'toLocaleDateString' in value ? (value as Date).toLocaleDateString() : ''
    },
];

export default function BudgetAllocationsPage() {
    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>Budget Allocations</Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>Manage disbursement of funds across administrative levels</Typography>
            </Box>
            <DataTable
                title="Allocations"
                rows={mockAllocations}
                columns={columns}
                loading={false}
                onView={() => { }}
                module="budget"
            />
        </Box>
    );
}
