'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Chip, Autocomplete, Button, Grid, alpha } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { institutionsService, Institution } from '@/app/lib/api/institutions.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { useAuthStore } from '@/app/lib/store';
import { useRouter } from 'next/navigation';
import { useTheme, Tooltip, IconButton } from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';

import type { ModuleType, ResourceType, Role } from '@/app/lib/types';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { TenantDialog } from '@/app/components/management/TenantDialog';


// Roles that can create schools
const CREATE_ROLES = ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN'];

export default function SchoolsPage() {
    const theme = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<string>('');
    const [selectedWoreda, setSelectedWoreda] = useState<string>('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSchool, setEditingSchool] = useState<any>(null);
    const [schools, setSchools] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [woredas, setWoredas] = useState<any[]>([]);

    const user = useAuthStore(state => state.user);
    const canCreate = user?.roles?.some(r => CREATE_ROLES.includes(r.name)) ?? false;

    const columns: GridColDef<Institution>[] = [
        { field: 'name', headerName: 'School Name', flex: 1, minWidth: 200 },
        {
            field: 'kebeleName',
            headerName: 'Kebele',
            width: 150,
            valueGetter: (value, row: any) => row.kebele?.name || '-'
        },
        {
            field: 'academic',
            headerName: 'Academic',
            width: 100,
            renderCell: (params) => (
                <Tooltip title="Academic Periods">
                    <IconButton
                        size="small"
                        onClick={() => router.push(`/academic/config/periods?institutionId=${params.row.id}`)}
                        sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                            }
                        }}
                    >
                        <CalendarIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )
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
    ];

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
            if (editingSchool) {
                await institutionsService.update(editingSchool.id, data);
            } else {
                await institutionsService.create(data);
            }
            setDialogOpen(false);
            setEditingSchool(null);
            fetchData();
        } catch (error) {
            console.error('Error saving school:', error);
        }
    };

    const handleDeleteSchool = async (school: any) => {
        try {
            await institutionsService.delete(school.id);
            fetchData();
        } catch (error) {
            console.error('Error deleting school:', error);
        }
    };

    const handleEditSchool = (school: any) => {
        setEditingSchool(school);
        setDialogOpen(true);
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ letterSpacing: -1 }}>
                    Schools Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage schools within your administrative scope
                </Typography>
            </Box>

            <DataTable
                title="Schools"
                subtitle={`${filteredSchools.length} schools`}
                columns={columns}
                rows={filteredSchools}
                loading={loading}
                module="management"
                onAdd={canCreate ? () => {
                    setEditingSchool(null);
                    setDialogOpen(true);
                } : undefined}
                allowedRoles={CREATE_ROLES}
                onEdit={handleEditSchool}
                onView={(school) => { console.log('View school:', school); }}
                onDelete={handleDeleteSchool}
                onRefresh={fetchData}
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
                onClose={() => {
                    setDialogOpen(false);
                    setEditingSchool(null);
                }}
                onSubmit={handleAddSchool}
                type="school"
                editData={editingSchool}
                parentType={selectedWoreda || editingSchool?.kebele?.woredaId ? 'woreda' : 'zone'}
                parentId={selectedWoreda || editingSchool?.kebele?.woredaId || selectedZone || editingSchool?.kebele?.woreda?.zoneId || undefined}
                parentName={selectedWoreda
                    ? woredas.find(w => w.id === selectedWoreda)?.name
                    : (editingSchool?.kebele?.woreda?.name || (selectedZone
                        ? zones.find(z => z.id === selectedZone)?.name
                        : undefined))}
            />
        </Box>
    );
}
