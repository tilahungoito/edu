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
    { field: 'school', headerName: 'Institution', width: 220 },
    { field: 'category', headerName: 'Category', width: 180 },
    {
        field: 'amount',
        headerName: 'Spent Amount',
        width: 150,
        type: 'number',
        valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() + ' ETB' : '-'
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
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>Expenditure Tracking</Typography>
                <Typography variant="body1" color="text.secondary">Monitor spending and financial utilization</Typography>
            </Box>
            <DataTable
                title="Expenditure Logs"
                rows={mockExpenditure}
                columns={columns}
                loading={false}
                module="budget"
            />
        </Box>
    );
}
