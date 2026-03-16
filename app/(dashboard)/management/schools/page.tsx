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
import { CalendarMonth as CalendarIcon, BarChart as ReportIcon } from '@mui/icons-material';
import Link from 'next/link';

import type { ModuleType, ResourceType, Role } from '@/app/lib/types';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { TenantDialog } from '@/app/components/management/TenantDialog';


// Roles that can create schools
const CREATE_ROLES = ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN'];

// School type metadata
const SCHOOL_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'KG', label: 'KG', color: '#8b5cf6' },
    { value: 'PRIMARY', label: 'Primary', color: '#6366f1' },
    { value: 'SECONDARY', label: 'Secondary', color: '#f59e0b' },
    { value: 'PREPARATORY', label: 'Preparatory', color: '#ec4899' },
    { value: 'COMBINED', label: 'Combined', color: '#10b981' },
];
const getTypeInfo = (type: string) => SCHOOL_TYPES.find(t => t.value === type) || { value: type, label: type || 'Primary', color: '#6366f1' };

export default function SchoolsPage() {
    const theme = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<string>('');
    const [selectedWoreda, setSelectedWoreda] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSchool, setEditingSchool] = useState<any>(null);
    const [schools, setSchools] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [woredas, setWoredas] = useState<any[]>([]);

    const user = useAuthStore(state => state.user);
    const canCreate = user?.roles?.some(r => CREATE_ROLES.includes(r.name)) ?? false;

    // Initialize filters based on user restricted scope
    useEffect(() => {
        if (user) {
            if (user.tenantType === 'zone') {
                setSelectedZone(user.tenantId || '');
            } else if (user.tenantType === 'woreda') {
                // If woreda admin, they might not have zoneId directly available
                // but fetchData will handle it if we have selectedWoreda
                setSelectedWoreda(user.tenantId || '');
            }
        }
    }, [user]);

    const columns: GridColDef<Institution>[] = [
        { field: 'name', headerName: 'School Name', flex: 1, minWidth: 200 },
        {
            field: 'type',
            headerName: 'Type',
            width: 130,
            renderCell: (params) => {
                const info = getTypeInfo((params.value as string) || 'PRIMARY');
                return (
                    <Chip
                        label={info.label}
                        size="small"
                        sx={{
                            bgcolor: alpha(info.color || '#6366f1', 0.1),
                            color: info.color || '#6366f1',
                            fontWeight: 800,
                            fontSize: '11px',
                            height: 22,
                        }}
                    />
                );
            }
        },
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

    // Flatten data for useScopedData to work correctly
    const flattenedSchools = schools.map(school => ({
        ...school,
        kebeleId: school.kebele?.id,
        woredaId: school.kebele?.woredaId,
        zoneId: school.kebele?.woreda?.zoneId
    }));

    const scopedSchools = useScopedData(flattenedSchools, 'school');
    const availableWoredas = woredas;
    const filteredSchools = scopedSchools.filter((s: any) => !selectedType || (s.type || 'PRIMARY') === selectedType);

    const handleAddSchool = async (data: any) => {
        try {
            // Ensure kebeleId is present if it's a school creation
            if (!data.kebeleId && user?.tenantType === 'kebele') {
                data.kebeleId = user.tenantId;
            }

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

    // Determine parent context for TenantDialog
    const getParentContext = () => {
        if (selectedWoreda) {
            return {
                type: 'woreda' as const,
                id: selectedWoreda,
                name: woredas.find(w => w.id === selectedWoreda)?.name
            };
        }
        if (user?.tenantType === 'woreda') {
            return {
                type: 'woreda' as const,
                id: user.tenantId,
                name: user.tenantName
            };
        }
        if (selectedZone) {
            return {
                type: 'zone' as const,
                id: selectedZone,
                name: zones.find(z => z.id === selectedZone)?.name
            };
        }
        if (user?.tenantType === 'zone') {
            return {
                type: 'zone' as const,
                id: user.tenantId,
                name: user.tenantName
            };
        }
        return { type: undefined, id: undefined, name: undefined };
    };

    const parentContext = getParentContext();

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
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            component={Link}
                            href="/management/schools/types"
                            size="small"
                            variant="outlined"
                            startIcon={<ReportIcon />}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Types Report
                        </Button>
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                            <InputLabel>School Type</InputLabel>
                            <Select
                                value={selectedType}
                                label="School Type"
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                {SCHOOL_TYPES.map(t => (
                                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {user?.tenantType === 'bureau' && (
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
                        )}
                        {(user?.tenantType === 'bureau' || user?.tenantType === 'zone') && (
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Woreda</InputLabel>
                                <Select
                                    value={selectedWoreda}
                                    label="Woreda"
                                    onChange={(e) => setSelectedWoreda(e.target.value)}
                                    disabled={!selectedZone && user?.tenantType === 'bureau'}
                                >
                                    <MenuItem value="">All Woredas</MenuItem>
                                    {availableWoredas.map(woreda => (
                                        <MenuItem key={woreda.id} value={woreda.id}>{woreda.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
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
                parentType={editingSchool?.kebele?.woredaId ? 'woreda' : parentContext.type}
                parentId={editingSchool?.kebele?.woredaId || parentContext.id}
                parentName={editingSchool?.kebele?.woreda?.name || parentContext.name}
            />
        </Box>
    );
}
