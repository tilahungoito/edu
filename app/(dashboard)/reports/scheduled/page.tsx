'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

const mockScheduledReports = [
    { id: 'SCH-001', name: 'Monthly Enrollment Update', frequency: 'Monthly', lastRun: new Date('2024-01-01'), nextRun: new Date('2024-02-01'), recipients: 'admin@edu.gov.et', status: 'active' },
    { id: 'SCH-002', name: 'Weekly Staff Attendance', frequency: 'Weekly', lastRun: new Date('2024-01-15'), nextRun: new Date('2024-01-22'), recipients: 'hr@edu.gov.et', status: 'active' },
    { id: 'SCH-003', name: 'Quarterly Budget Forecast', frequency: 'Quarterly', lastRun: new Date('2023-12-31'), nextRun: new Date('2024-03-31'), recipients: 'finance@edu.gov.et', status: 'paused' },
];

const columns: GridColDef[] = [
    { field: 'name', headerName: 'Report Name', width: 250 },
    { field: 'frequency', headerName: 'Frequency', width: 120 },
    { field: 'lastRun', headerName: 'Last Run', width: 130, valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '-' },
    { field: 'nextRun', headerName: 'Next Run', width: 130, valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '-' },
    { field: 'recipients', headerName: 'Recipients', width: 220 },
    {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => (
            <Chip
                label={params.value?.toString().toUpperCase()}
                size="small"
                color={params.value === 'active' ? 'success' : 'default'}
            />
        ),
    },
];

export default function ScheduledReportsPage() {
    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Scheduled Reports
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Automate your reporting workflow
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>
                    Schedule New
                </Button>
            </Box>

            <DataTable
                title="Schedules"
                subtitle="Manage automated report deliveries"
                rows={mockScheduledReports}
                columns={columns}
                loading={false}
                module="reports"
            />
        </Box>
    );
}
