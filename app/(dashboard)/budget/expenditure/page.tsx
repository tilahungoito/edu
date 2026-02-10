'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';

const mockExpenditure = [
    { id: 'EXP-001', school: 'Ayder Primary', category: 'Salaries', amount: 450000, date: new Date('2024-01-15') },
    { id: 'EXP-002', school: 'Ayder Primary', category: 'Supplies', amount: 25000, date: new Date('2024-01-18') },
];

const columns: GridColDef[] = [
    { field: 'school', headerName: 'Institution', flex: 1.2, minWidth: 160 },
    { field: 'category', headerName: 'Category', width: 140 },
    {
        field: 'amount',
        headerName: 'Spent Amount',
        width: 140,
        type: 'number',
        valueFormatter: (params: any) => params.value ? (params.value as number).toLocaleString() + ' ETB' : '-'
    },
    {
        field: 'date',
        headerName: 'Date',
        width: 130,
        valueFormatter: (value) => value && typeof value === 'object' && 'toLocaleDateString' in value ? (value as Date).toLocaleDateString() : ''
    },
];

export default function BudgetExpenditurePage() {
    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>Expenditure Tracking</Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>Monitor spending and financial utilization across institutions</Typography>
            </Box>
            <DataTable
                title="Expenditure Logs"
                rows={mockExpenditure}
                columns={columns}
                loading={false}
                onView={() => { }}
                module="budget"
            />
        </Box>
    );
}
