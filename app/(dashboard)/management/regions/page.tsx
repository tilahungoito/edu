'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, alpha } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { regionsService, Region } from '@/app/lib/api/regions.service';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { TenantDialog } from '@/app/components/management/TenantDialog';

const regionColumns: GridColDef<Region>[] = [
    { field: 'name', headerName: 'Region Name', flex: 1, minWidth: 200 },
    {
        field: 'createdAt', headerName: 'Created At', width: 180,
        valueFormatter: (value) => value ? new Date(value as string).toLocaleDateString() : '-'
    },
    {
        field: '_count',
        headerName: 'Zones',
        width: 120,
        type: 'number',
        valueGetter: (_value, row) => row._count?.zones || 0
    },
];

export default function RegionsPage() {
    const [loading, setLoading] = useState(true);
    const [regions, setRegions] = useState<Region[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await regionsService.getAll();
            setRegions(data);
        } catch (error) {
            console.error('Error fetching regions data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Listen for real-time updates
    useRealTime('STATS_UPDATED', () => {
        fetchData();
    });

    const handleAddRegion = async (data: any) => {
        try {
            await regionsService.create(data);
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error creating region:', error);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    Regions Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage top-level regional entities
                </Typography>
            </Box>

            <DataTable
                title="Regions"
                subtitle={`${regions.length} regions in system`}
                columns={regionColumns}
                rows={regions}
                loading={loading}
                module="management"
                onAdd={() => setDialogOpen(true)}
                onEdit={(region) => console.log('Edit region', region)}
                onView={(region) => console.log('View region', region)}
                onDelete={(region) => console.log('Delete region', region)}
                checkboxSelection
            />

            <TenantDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleAddRegion}
                type="region"
            />
        </Box>
    );
}
