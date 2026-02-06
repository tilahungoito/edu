'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon } from '@mui/icons-material';

const mockApprovals = [
    { id: 'APP-001', staffName: 'Kidist Gebremichael', type: 'Transfer', submittedBy: 'Ayder Primary', status: 'pending', date: new Date('2024-01-20') },
    { id: 'APP-002', staffName: 'Abraham Tesfay', type: 'Assignment', submittedBy: 'Hawelti Woreda', status: 'pending', date: new Date('2024-01-21') },
];

const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'staffName', headerName: 'Staff Member', width: 200 },
    { field: 'type', headerName: 'Type', width: 120 },
    { field: 'submittedBy', headerName: 'Source', width: 180 },
    { field: 'date', headerName: 'Date', width: 130, valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '' },
    {
        field: 'actions',
        headerName: 'Actions',
        width: 250,
        renderCell: (params) => (
            <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />}>Approve</Button>
                <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />}>Reject</Button>
            </Stack>
        ),
    },
];

export default function ApprovalsPage() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Pending Approvals
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Review and process HR requests within your administrative scope
                </Typography>
            </Box>

            <DataTable
                title="Approval Requests"
                rows={mockApprovals}
                columns={columns}
                loading={false}
            />
        </Box>
    );
}
