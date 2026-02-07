'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, alpha, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { woredasService } from '@/app/lib/api/woredas.service';
import { zonesService } from '@/app/lib/api/zones.service';
import type { ModuleType, ResourceType, Role } from '@/app/lib/types';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { TenantDialog } from '@/app/components/management/TenantDialog';

const woredaColumns: GridColDef[] = [
    { field: 'name', headerName: 'Woreda Name', flex: 1, minWidth: 150 },
    { field: 'nameAmharic', headerName: 'ስም (አማርኛ)', flex: 1, minWidth: 120 },
    { field: 'code', headerName: 'Code', width: 80 },
    { field: 'totalSchools', headerName: 'Schools', width: 100, type: 'number' },
    {
        field: 'totalStudents',
        headerName: 'Students',
        width: 120,
        type: 'number',
        valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    {
        field: 'totalTeachers',
        headerName: 'Teachers',
        width: 110,
        type: 'number',
        valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    { field: 'status', headerName: 'Status', width: 100 },
];

export default function WoredasPage() {
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<string>('');
    const [woredas, setWoredas] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [woredasData, zonesData] = await Promise.all([
                woredasService.getAll(selectedZone || undefined),
                zonesService.getAll()
            ]);
            setWoredas(woredasData);
            setZones(zonesData);
        } catch (error) {
            console.error('Error fetching woredas data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedZone]);

    // Listen for real-time updates
    useRealTime('STATS_UPDATED', () => {
        fetchData();
    });

    const scopedWoredas = useScopedData(woredas, 'woreda');
    const [dialogOpen, setDialogOpen] = useState(false);
    const filteredWoredas = scopedWoredas;

    const handleAddWoreda = async (data: any) => {
        try {
            await woredasService.create(data);
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error creating woreda:', error);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    Woredas Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage woredas within your administrative scope
                </Typography>
            </Box>

            <DataTable
                title="Woredas"
                subtitle={`${filteredWoredas.length} woredas`}
                columns={woredaColumns}
                rows={filteredWoredas}
                loading={loading}
                module="management"
                resourceType="woreda"
                allowedRoles={['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN']}
                onAdd={() => setDialogOpen(true)}
                onEdit={(woreda) => console.log('Edit woreda', woreda)}
                onView={(woreda) => console.log('View woreda', woreda)}
                onDelete={(woreda) => console.log('Delete woreda', woreda)}
                statusField="status"
                statusColors={{
                    active: 'success',
                    inactive: 'error',
                }}
                checkboxSelection
                toolbarActions={
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Filter by Zone</InputLabel>
                        <Select
                            value={selectedZone}
                            label="Filter by Zone"
                            onChange={(e) => setSelectedZone(e.target.value)}
                        >
                            <MenuItem value="">All Zones</MenuItem>
                            {zones.map(zone => (
                                <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                }
            />

            <TenantDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleAddWoreda}
                type="woreda"
                parentType="zone"
                parentId={selectedZone || undefined}
                parentName={selectedZone ? zones.find(z => z.id === selectedZone)?.name : undefined}
            />
        </Box>
    );
}
