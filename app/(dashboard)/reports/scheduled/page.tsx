'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { Add as AddIcon } from '@mui/icons-material';
import { reportsService, ScheduledReport } from '@/app/lib/api/reports.service';
import { ScheduleReportDialog } from '@/app/components/reports/ScheduleReportDialog';

const columns: GridColDef<ScheduledReport>[] = [
    { field: 'name', headerName: 'Report Name', flex: 1, minWidth: 200 },
    { 
        field: 'reportType', 
        headerName: 'Type', 
        width: 130, 
        valueGetter: (value: any) => value?.toString().toUpperCase() 
    },
    { 
        field: 'frequency', 
        headerName: 'Frequency', 
        width: 120, 
        valueGetter: (value: any) => value?.toString().toUpperCase() 
    },
    { 
        field: 'lastRun', 
        headerName: 'Last Run', 
        width: 130, 
        valueFormatter: (value?: any) => {
            if (!value) return 'Never';
            return new Date(value).toLocaleDateString();
        }
    },
    { 
        field: 'nextRun', 
        headerName: 'Next Run', 
        width: 130, 
        valueFormatter: (value?: any) => {
            if (!value) return '-';
            return new Date(value).toLocaleDateString();
        }
    },
    { 
        field: 'recipients', 
        headerName: 'Recipients', 
        width: 220, 
        valueGetter: (value: any) => {
            return Array.isArray(value) && value.length > 0 ? value.join(', ') : 'No recipients';
        }
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => {
            const status = params.value as string;
            return (
                <Chip
                    label={status?.toUpperCase()}
                    size="small"
                    color={status === 'active' ? 'success' : 'default'}
                    variant={status === 'active' ? 'filled' : 'outlined'}
                />
            );
        },
    },
];

export default function ScheduledReportsPage() {
    const [rows, setRows] = useState<ScheduledReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const data = await reportsService.getScheduledReports();
            setRows(data);
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Scheduled Reports
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Automate your reporting workflow for efficient data distribution
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    sx={{ borderRadius: 2 }}
                    onClick={() => setDialogOpen(true)}
                >
                    Schedule New
                </Button>
            </Box>

            <DataTable
                title="Schedules"
                subtitle="Manage automated report deliveries and their frequencies"
                rows={rows}
                columns={columns}
                loading={loading}
                onView={() => { }}
                onDelete={async (row) => {
                    if (confirm(`Are you sure you want to delete the schedule "${row.name}"?`)) {
                        await reportsService.deleteScheduledReport(row.id);
                        fetchSchedules();
                    }
                }}
                module="reports"
            />

            <ScheduleReportDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSuccess={fetchSchedules}
            />
        </Box>
    );
}
