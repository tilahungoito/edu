'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { woredasService } from '@/app/lib/api/woredas.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { TenantDialog } from '@/app/components/management/TenantDialog';
import { useAuthStore } from '@/app/lib/store';
import { toast } from 'react-hot-toast';

const woredaColumns: GridColDef[] = [
    { field: 'name', headerName: 'Woreda Name', flex: 1, minWidth: 150 },
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
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingWoreda, setEditingWoreda] = useState<any>(null);

    const user = useAuthStore(state => state.user);

    // Initialize filter based on user restricted scope
    useEffect(() => {
        if (user && user.tenantType === 'zone') {
            setSelectedZone(user.tenantId || '');
        }
    }, [user]);

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
            toast.error('Failed to load woredas');
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
    const filteredWoredas = scopedWoredas;

    const handleAddWoreda = async (data: any) => {
        try {
            if (editingWoreda) {
                await woredasService.update(editingWoreda.id, data);
                toast.success('Woreda updated successfully');
            } else {
                await woredasService.create(data);
                toast.success('Woreda created successfully');
            }
            setDialogOpen(false);
            setEditingWoreda(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Error saving woreda');
        }
    };

    const handleDeleteWoreda = async (woreda: any) => {
        try {
            await woredasService.delete(woreda.id);
            toast.success(`Woreda "${woreda.name}" deleted successfully`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Error deleting woreda');
        }
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ letterSpacing: -1 }}>
                    Woredas Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage woredas within your administrative scope
                </Typography>
            </Box>

            <DataTable
                title="All Woredas"
                subtitle={`${filteredWoredas.length} woredas registered`}
                columns={woredaColumns}
                rows={filteredWoredas}
                loading={loading}
                module="management"
                resourceType="woreda"
                allowedRoles={['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN']}
                onAdd={() => {
                    setEditingWoreda(null);
                    setDialogOpen(true);
                }}
                onEdit={(woreda) => {
                    setEditingWoreda(woreda);
                    setDialogOpen(true);
                }}
                onView={(woreda) => {
                    // Standardized View is already handled inside DataTable
                }}
                onDelete={handleDeleteWoreda}
                onRefresh={fetchData}
                statusField="status"
                statusColors={{
                    active: 'success',
                    inactive: 'error',
                }}
                checkboxSelection
                toolbarActions={
                    user?.tenantType === 'bureau' ? (
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
                    ) : null
                }
            />

            <TenantDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingWoreda(null);
                }}
                onSubmit={handleAddWoreda}
                type="woreda"
                editData={editingWoreda}
                parentType="zone"
                parentId={selectedZone || editingWoreda?.zoneId || (user?.tenantType === 'zone' ? user.tenantId : undefined)}
                parentName={selectedZone ? zones.find(z => z.id === selectedZone)?.name : (editingWoreda?.zoneId ? zones.find(z => z.id === editingWoreda.zoneId)?.name : (user?.tenantType === 'zone' ? user.tenantName : undefined))}
            />
        </Box>
    );
}

