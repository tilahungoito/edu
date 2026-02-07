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
            await kebelesService.create(data);
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error creating kebele:', error);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
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
                onAdd={canCreate ? () => setDialogOpen(true) : undefined}
                addButtonLabel="Create Kebele"
                onEdit={(kebele) => console.log('Edit kebele', kebele)}
                onView={(kebele) => console.log('View kebele', kebele)}
                onDelete={(kebele) => console.log('Delete kebele', kebele)}
                checkboxSelection
            />

            <TenantDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleAddKebele}
                type="kebele"
            />
        </Box>
    );
}
