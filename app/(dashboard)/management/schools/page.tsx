'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Chip, Autocomplete, Button, Grid, alpha } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { institutionsService, Institution } from '@/app/lib/api/institutions.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { zonesService } from '@/app/lib/api/zones.service';
import type { ModuleType, ResourceType, Role } from '@/app/lib/types';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { TenantDialog } from '@/app/components/management/TenantDialog';

const schoolColumns: GridColDef<Institution>[] = [
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
                    label={typeof params.value === 'string' ? ((params.value as string).charAt(0).toUpperCase() + (params.value as string).slice(1)) : ''}
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
        valueFormatter: (value: any) => typeof value === 'string' ? (value as string).charAt(0).toUpperCase() + (value as string).slice(1) : '',
    },
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

export default function SchoolsPage() {
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<string>('');
    const [selectedWoreda, setSelectedWoreda] = useState<string>('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [schools, setSchools] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [woredas, setWoredas] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schoolsData, zonesData, woredasData] = await Promise.all([
                institutionsService.getAll({
                    zoneId: selectedZone || undefined,
                    woredaId: selectedWoreda || undefined,
                }),
                zonesService.getAll(),
                woredasService.getAll(selectedZone || undefined)
            ]);
            setSchools(schoolsData);
            setZones(zonesData);
            setWoredas(woredasData);
        } catch (error) {
            console.error('Error fetching schools data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedZone, selectedWoreda]);

    // Listen for real-time updates
    useRealTime('STATS_UPDATED', () => {
        fetchData();
    });

    const scopedSchools = useScopedData(schools, 'school');
    const availableWoredas = woredas;
    const filteredSchools = scopedSchools;

    const handleAddSchool = async (data: any) => {
        try {
            await institutionsService.create(data);
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error creating school:', error);
        }
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
                resourceType="institution"
                allowedRoles={['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN']}
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
                                {zones.map(zone => (
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
                parentType={selectedWoreda ? 'woreda' : 'zone'}
                parentId={selectedWoreda || selectedZone || undefined}
                parentName={selectedWoreda
                    ? woredas.find(w => w.id === selectedWoreda)?.name
                    : selectedZone
                        ? zones.find(z => z.id === selectedZone)?.name
                        : undefined}
            />
        </Box>
    );
}
