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
    { field: 'submittedBy', headerName: 'Submitted By', flex: 1, minWidth: 160 },
    { field: 'purpose', headerName: 'Purpose', flex: 1.2, minWidth: 200 },
    {
        field: 'amount',
        headerName: 'Requested Amount',
        width: 150,
        type: 'number',
        valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() + ' ETB' : '-'
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 100,
        renderCell: (params) => (
            <Chip
                label={params.value as string}
                color={params.value === 'approved' ? 'success' : 'warning'}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', textTransform: 'capitalize' }}
            />
        )
    },
];

export default function BudgetRequestsPage() {
    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>Budget Requests</Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>Handle bottom-up budget requests and justifications</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2.5 }}>New Request</Button>
            </Box>
            <DataTable
                title="Incoming Requests"
                rows={mockRequests}
                columns={columns}
                loading={false}
                onView={() => { }}
                module="budget"
            />
        </Box>
    );
}
