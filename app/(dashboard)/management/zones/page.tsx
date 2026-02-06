'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { mockZones } from '@/app/lib/mock-data';

import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { TenantDialog } from '@/app/components/management/TenantDialog';

const zoneColumns: GridColDef[] = [
    { field: 'name', headerName: 'Zone Name', flex: 1, minWidth: 150 },
    { field: 'nameAmharic', headerName: 'ስም (አማርኛ)', flex: 1, minWidth: 120 },
    { field: 'code', headerName: 'Code', width: 80 },
    { field: 'totalWoredas', headerName: 'Woredas', width: 100, type: 'number' },
    { field: 'totalSchools', headerName: 'Schools', width: 100, type: 'number' },
    {
        field: 'totalStudents',
        headerName: 'Students',
        width: 120,
        type: 'number',
        valueFormatter: ({ value }) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    {
        field: 'totalTeachers',
        headerName: 'Teachers',
        width: 110,
        type: 'number',
        valueFormatter: ({ value }) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    { field: 'status', headerName: 'Status', width: 100 },
];

export default function ZonesPage() {
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const filteredZones = useScopedData(mockZones, 'zone');

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleAddZone = (data: any) => {
        console.log('Creating zone:', data);
        // In a real app, this would call an API
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    Zones Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage all zones in Tigray Region
                </Typography>
            </Box>

            <DataTable
                title="All Zones"
                subtitle={`${filteredZones.length} zones`}
                columns={zoneColumns}
                rows={filteredZones}
                loading={loading}
                module="management"
                onAdd={() => setDialogOpen(true)}
                onEdit={(zone) => console.log('Edit zone', zone)}
                onView={(zone) => console.log('View zone', zone)}
                onDelete={(zone) => console.log('Delete zone', zone)}
                statusField="status"
                statusColors={{
                    active: 'success',
                    inactive: 'error',
                }}
                checkboxSelection
            />

            <TenantDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleAddZone}
                type="zone"
            />
        </Box>
    );
}
