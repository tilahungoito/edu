'use client';

import React from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { Add as AddIcon } from '@mui/icons-material';

const mockRequests = [
    { id: 'BRQ-001', submittedBy: 'Hawelti Woreda', purpose: 'Classroom Maintenance', amount: 850000, status: 'pending' },
    { id: 'BRQ-002', submittedBy: 'Shire Zone', purpose: 'Science Lab Upgrade', amount: 2500000, status: 'approved' },
];

const columns: GridColDef[] = [
    { field: 'submittedBy', headerName: 'Submitted By', width: 220 },
    { field: 'purpose', headerName: 'Purpose', width: 250 },
    {
        field: 'amount',
        headerName: 'Requested Amount',
        width: 180,
        type: 'number',
        valueFormatter: ({ value }) => typeof value === 'number' ? value.toLocaleString() + ' ETB' : '-'
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 130,
        renderCell: (params) => (
            <Chip
                label={params.value as string}
                color={params.value === 'approved' ? 'success' : 'warning'}
                size="small"
            />
        )
    },
];

export default function BudgetRequestsPage() {
    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>Budget Requests</Typography>
                    <Typography variant="body1" color="text.secondary">Handle bottom-up budget requests and justifications</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>New Request</Button>
            </Box>
            <DataTable
                title="Incoming Requests"
                rows={mockRequests}
                columns={columns}
                loading={false}
                module="budget"
            />
        </Box>
    );
}
