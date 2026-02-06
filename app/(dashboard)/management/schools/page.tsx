'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { mockSchools, mockZones, mockWoredas } from '@/app/lib/mock-data';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { TenantDialog } from '@/app/components/management/TenantDialog';

const schoolColumns: GridColDef[] = [
    { field: 'name', headerName: 'School Name', flex: 1, minWidth: 200 },
    { field: 'code', headerName: 'Code', width: 120 },
    { field: 'zoneName', headerName: 'Zone', width: 100 },
    { field: 'woredaName', headerName: 'Woreda', width: 120 },
    {
        field: 'type',
        headerName: 'Type',
        width: 110,
        renderCell: (params) => {
            const typeColors: Record<string, 'primary' | 'secondary' | 'warning'> = {
                primary: 'primary',
                secondary: 'secondary',
                preparatory: 'warning',
            };
            return (
                <Chip
                    label={params.value?.charAt(0).toUpperCase() + params.value?.slice(1)}
                    size="small"
                    color={typeColors[params.value as string] || 'default'}
                />
            );
        }
    },
    {
        field: 'ownership',
        headerName: 'Ownership',
        width: 110,
        valueFormatter: ({ value }) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '',
    },
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

export default function SchoolsPage() {
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<string>('');
    const [selectedWoreda, setSelectedWoreda] = useState<string>('');
    const [dialogOpen, setDialogOpen] = useState(false);

    const scopedSchools = useScopedData(mockSchools, 'school');

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Filter woredas by zone
    const availableWoredas = selectedZone
        ? mockWoredas.filter(w => w.zoneId === selectedZone)
        : mockWoredas;

    // Filter schools
    let filteredSchools = scopedSchools;
    if (selectedZone) {
        filteredSchools = filteredSchools.filter(s => s.zoneId === selectedZone);
    }
    if (selectedWoreda) {
        filteredSchools = filteredSchools.filter(s => s.woredaId === selectedWoreda);
    }

    const handleAddSchool = (data: any) => {
        console.log('Creating school:', data);
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    Schools Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage schools within your administrative scope
                </Typography>
            </Box>

            <DataTable
                title="Schools"
                subtitle={`${filteredSchools.length} schools`}
                columns={schoolColumns}
                rows={filteredSchools}
                loading={loading}
                module="management"
                onAdd={() => setDialogOpen(true)}
                onEdit={(school) => console.log('Edit school', school)}
                onView={(school) => console.log('View school', school)}
                onDelete={(school) => console.log('Delete school', school)}
                statusField="status"
                statusColors={{
                    active: 'success',
                    inactive: 'error',
                }}
                checkboxSelection
                toolbarActions={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Zone</InputLabel>
                            <Select
                                value={selectedZone}
                                label="Zone"
                                onChange={(e) => {
                                    setSelectedZone(e.target.value);
                                    setSelectedWoreda('');
                                }}
                            >
                                <MenuItem value="">All Zones</MenuItem>
                                {mockZones.map(zone => (
                                    <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Woreda</InputLabel>
                            <Select
                                value={selectedWoreda}
                                label="Woreda"
                                onChange={(e) => setSelectedWoreda(e.target.value)}
                                disabled={!selectedZone}
                            >
                                <MenuItem value="">All Woredas</MenuItem>
                                {availableWoredas.map(woreda => (
                                    <MenuItem key={woreda.id} value={woreda.id}>{woreda.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                }
            />

            <TenantDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleAddSchool}
                type="school"
                parentName={selectedWoreda
                    ? mockWoredas.find(w => w.id === selectedWoreda)?.name
                    : selectedZone
                        ? mockZones.find(z => z.id === selectedZone)?.name
                        : undefined}
            />
        </Box>
    );
}
