import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { zonesService } from '@/app/lib/api/zones.service';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { TenantDialog } from '@/app/components/management/TenantDialog';
import { toast } from 'react-hot-toast';

const zoneColumns: GridColDef[] = [
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
];

export default function ZonesPage() {
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [zones, setZones] = useState<any[]>([]);
    const [editData, setEditData] = useState<any>(null);

    const fetchZones = async () => {
        setLoading(true);
        try {
            const data = await zonesService.getAll();
            setZones(data);
        } catch (error) {
            console.error('Error fetching zones:', error);
            toast.error('Failed to load zones');
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

    const handleAddZone = async (data: any, id?: string) => {
        try {
            if (id) {
                await zonesService.update(id, data);
                toast.success('Zone updated successfully');
            } else {
                await zonesService.create(data);
                toast.success('Zone created successfully');
            }
            setDialogOpen(false);
            setEditData(null);
            fetchZones();
        } catch (error: any) {
            toast.error(error.message || 'Error saving zone');
        }
    };

    const handleDeleteZone = async (zone: any) => {
        try {
            await zonesService.delete(zone.id);
            toast.success(`Zone "${zone.name}" deleted successfully`);
            fetchZones();
        } catch (error: any) {
            toast.error(error.message || 'Error deleting zone');
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
                subtitle={`${filteredZones.length} zones registered`}
                columns={zoneColumns}
                rows={filteredZones}
                loading={loading}
                module="management"
                resourceType="zone"
                allowedRoles={['SYSTEM_ADMIN', 'REGIONAL_ADMIN']}
                onAdd={() => {
                    setEditData(null);
                    setDialogOpen(true);
                }}
                onEdit={(zone) => {
                    setEditData(zone);
                    setDialogOpen(true);
                }}
                onView={(zone) => {
                    // Standardized View is already handled inside DataTable via DetailsModal
                }}
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
                onClose={() => {
                    setDialogOpen(false);
                    setEditData(null);
                }}
                onSubmit={handleAddZone}
                type="zone"
                editData={editData}
            />
        </Box>
    );
}

