'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, alpha } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { zonesService } from '@/app/lib/api/zones.service';
import type { ModuleType, ResourceType, Role } from '@/app/lib/types';
import { Zone } from '@/app/lib/types/entities';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { TenantDialog } from '@/app/components/management/TenantDialog';

const zoneColumns: GridColDef<Zone>[] = [
    { field: 'name', headerName: 'Zone Name', flex: 1.5, minWidth: 140 },
    { field: 'code', headerName: 'Code', width: 70 },
    { field: 'totalWoredas', headerName: 'Woredas', flex: 0.8, minWidth: 80, type: 'number' },
    { field: 'totalSchools', headerName: 'Schools', flex: 0.8, minWidth: 80, type: 'number' },
    {
        field: 'totalStudents',
        headerName: 'Students',
        flex: 1,
        minWidth: 100,
        type: 'number',
        valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    {
        field: 'totalTeachers',
        headerName: 'Teachers',
        flex: 1,
        minWidth: 100,
        type: 'number',
        valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    { field: 'status', headerName: 'Status', width: 90 },
];

export default function ZonesPage() {
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [zones, setZones] = useState<any[]>([]);

    const fetchZones = async () => {
        setLoading(true);
        try {
            const data = await zonesService.getAll();
            setZones(data);
        } catch (error) {
            console.error('Error fetching zones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    // Listen for real-time updates
    useRealTime('STATS_UPDATED', () => {
        fetchZones();
    });

    const filteredZones = useScopedData(zones, 'zone');

    const handleAddZone = async (data: any) => {
        try {
            await zonesService.create(data);
            setDialogOpen(false);
            fetchZones();
        } catch (error) {
            console.error('Error creating zone:', error);
        }
    };

    const handleDeleteZone = async (zone: any) => {
        try {
            await zonesService.delete(zone.id);
            fetchZones();
        } catch (error) {
            console.error('Error deleting zone:', error);
        }
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ letterSpacing: -1 }}>
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
                resourceType="zone"
                allowedRoles={['SYSTEM_ADMIN', 'REGIONAL_ADMIN']}
                onAdd={() => setDialogOpen(true)}
                onEdit={() => { }}
                onView={() => { }}
                onDelete={handleDeleteZone}
                onRefresh={fetchZones}
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
