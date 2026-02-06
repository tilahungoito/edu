'use client';

import React, { useState } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { KPIGrid } from '@/app/components/analytics';
import {
    Add as AddIcon,
    Inventory as InventoryIcon,
    Pending as PendingIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const mockRequests = [
    {
        id: 'REQ-001',
        schoolName: 'Ayder Primary School',
        itemType: 'Laptops',
        quantity: 15,
        priority: 'high',
        status: 'pending',
        requestedAt: new Date('2024-01-20'),
    },
    {
        id: 'REQ-002',
        schoolName: 'Hawelti Secondary School',
        itemType: 'Desks',
        quantity: 50,
        priority: 'medium',
        status: 'approved',
        requestedAt: new Date('2024-01-18'),
    },
    {
        id: 'REQ-003',
        schoolName: 'Mekelle Preparatory',
        itemType: 'Lab Equipment',
        quantity: 5,
        priority: 'urgent',
        status: 'pending',
        requestedAt: new Date('2024-01-22'),
    },
];

const columns: GridColDef[] = [
    { field: 'id', headerName: 'Request ID', width: 120 },
    { field: 'schoolName', headerName: 'School', width: 220 },
    { field: 'itemType', headerName: 'Item', width: 150 },
    { field: 'quantity', headerName: 'Qty', width: 100, type: 'number' },
    {
        field: 'priority',
        headerName: 'Priority',
        width: 120,
        renderCell: (params) => {
            const colors = { high: 'error', medium: 'warning', urgent: 'error', low: 'info' };
            return (
                <Chip
                    label={params.value?.toString().toUpperCase()}
                    size="small"
                    color={(colors[params.value as keyof typeof colors] || 'default') as any}
                />
            );
        },
    },
    { field: 'requestedAt', headerName: 'Date', width: 130, valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '' },
    { field: 'status', headerName: 'Status', width: 120 },
];

export default function InventoryRequestsPage() {
    const [loading] = useState(false);

    const kpis = [
        { label: 'Total Requests', value: 45, icon: 'Inventory', trend: 'up' },
        { label: 'Pending', value: 12, icon: 'Pending', trend: 'stable', color: 'warning' },
        { label: 'Approved', value: 28, icon: 'CheckCircle', trend: 'up', color: 'success' },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Inventory Requests
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage supply and asset requests from schools and woredas
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>
                    New Request
                </Button>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis as any} loading={loading} />
            </Box>

            <DataTable
                title="Requests Management"
                subtitle="Track and process all inventory requests"
                rows={mockRequests}
                columns={columns}
                loading={loading}
                module="inventory"
            />
        </Box>
    );
}
