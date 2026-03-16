'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { kebelesService, Kebele } from '@/app/lib/api/kebeles.service';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { TenantDialog } from '@/app/components/management/TenantDialog';
import { useAuthStore } from '@/app/lib/store';

const kebeleColumns: GridColDef<Kebele>[] = [
    { field: 'name', headerName: 'Kebele Name', flex: 1, minWidth: 200 },
    { field: 'woredaName', headerName: 'Woreda', width: 180 },
    {
        field: 'createdAt', headerName: 'Created At', width: 180,
        valueFormatter: (value) => value ? new Date(value as string).toLocaleDateString() : '-'
    },
    {
        field: '_count',
        headerName: 'Institutions',
        width: 120,
        type: 'number',
        valueGetter: (_value, row) => row._count?.institutions || 0
    },
];

// Roles that can create kebeles
const CREATE_ROLES = ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN'];

export default function KebelesPage() {
    const [loading, setLoading] = useState(true);
    const [kebeles, setKebeles] = useState<Kebele[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKebele, setEditingKebele] = useState<Kebele | null>(null);

    const user = useAuthStore(state => state.user);

    // Check if user can create kebeles
    const canCreate = user?.roles?.some(r => CREATE_ROLES.includes(r.name)) ?? false;

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await kebelesService.getAll();
            setKebeles(data);
        } catch (error) {
            console.error('Error fetching kebeles data:', error);
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

    const handleAddKebele = async (data: any) => {
        try {
            if (editingKebele) {
                await kebelesService.update(editingKebele.id, data);
            } else {
                await kebelesService.create(data);
            }
            setDialogOpen(false);
            setEditingKebele(null);
            fetchData();
        } catch (error) {
            console.error('Error saving kebele:', error);
        }
    };

    const handleDeleteKebele = async (kebele: any) => {
        try {
            await kebelesService.delete(kebele.id);
            fetchData();
        } catch (error) {
            console.error('Error deleting kebele:', error);
        }
    };

    const handleEditKebele = (kebele: Kebele) => {
        setEditingKebele(kebele);
        setDialogOpen(true);
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ letterSpacing: -1 }}>
                    Kebeles Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage kebele-level administrative entities
                </Typography>
            </Box>

            <DataTable
                title="Kebeles"
                subtitle={`${kebeles.length} kebeles in system`}
                columns={kebeleColumns}
                rows={kebeles}
                loading={loading}
                module="management"
                onAdd={canCreate ? () => {
                    setEditingKebele(null);
                    setDialogOpen(true);
                } : undefined}
                onEdit={handleEditKebele}
                onView={(kebele) => { console.log('View kebele:', kebele); }}
                onDelete={handleDeleteKebele}
                onRefresh={fetchData}
                checkboxSelection
            />

            <TenantDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingKebele(null);
                }}
                onSubmit={handleAddKebele}
                type="kebele"
                editData={editingKebele}
                parentType="woreda"
                parentId={editingKebele?.woredaId || undefined}
                parentName={editingKebele?.woredaName}
            />
        </Box>
    );
}
