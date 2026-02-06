'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';

const mockAssets = [
    { id: 'AST-001', name: 'Dell Latitude 3420', category: 'Computing', school: 'Ayder Primary', condition: 'Good', value: 45000 },
    { id: 'AST-002', name: 'Science Lab Kit v2', category: 'Science', school: 'Hawelti Secondary', condition: 'New', value: 120000 },
];

const columns: GridColDef[] = [
    { field: 'id', headerName: 'Asset ID', width: 120 },
    { field: 'name', headerName: 'Asset Name', width: 220 },
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'school', headerName: 'School', width: 180 },
    { field: 'condition', headerName: 'Condition', width: 120 },
    { field: 'value', headerName: 'Value (ETB)', width: 150, type: 'number', valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() : '-' },
];

export default function AssetsPage() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>Asset Registry</Typography>
                <Typography variant="body1" color="text.secondary">Detailed tracking of all physical educational assets</Typography>
            </Box>
            <DataTable
                title="Asset Registry"
                rows={mockAssets}
                columns={columns}
                loading={false}
                module="inventory"
            />
        </Box>
    );
}
