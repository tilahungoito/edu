'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { mockWoredas, mockZones } from '@/app/lib/mock-data';
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

export default function WoredasPage() {
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<string>('');
    const scopedWoredas = useScopedData(mockWoredas, 'woreda');

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const [dialogOpen, setDialogOpen] = useState(false);
    const filteredWoredas = selectedZone
        ? scopedWoredas.filter(w => w.zoneId === selectedZone)
        : scopedWoredas;

    const handleAddWoreda = (data: any) => {
        console.log('Creating woreda:', data);
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
                            {mockZones.map(zone => (
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
                parentName={selectedZone ? mockZones.find(z => z.id === selectedZone)?.name : undefined}
            />
        </Box>
    );
}
