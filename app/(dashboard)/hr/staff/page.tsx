'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Chip,
    Avatar,
    useTheme,
    Button,
    Tabs,
    Tab,
    IconButton,
    alpha,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import { 
    Add as AddIcon, 
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    VerifiedUser as VerifiedIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { staffService, StaffMember } from '@/app/lib/api/staff.service';
import { usersService } from '@/app/lib/api/users.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { toast } from 'react-hot-toast';
import { UserDialog } from '@/app/components/management/UserDialog';
import { KPIGrid } from '@/app/components/analytics';

export default function StaffPage() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const [selectedTab, setSelectedTab] = useState(0);
    const [openUserDialog, setOpenUserDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // --- Queries ---
    const { data: staff = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['staff', user?.tenantId],
        queryFn: () => staffService.getAllStaff({ scopeId: user?.tenantId || undefined }),
        enabled: !!user?.tenantId,
    });

    // --- Real-time updates ---
    useRealTime('user_updated', () => queryClient.invalidateQueries({ queryKey: ['staff'] }));
    useRealTime('user_created', () => queryClient.invalidateQueries({ queryKey: ['staff'] }));
    useRealTime('user_deleted', () => queryClient.invalidateQueries({ queryKey: ['staff'] }));
    useRealTime('STATS_UPDATED', () => queryClient.invalidateQueries({ queryKey: ['staff'] }));

    // --- Mutations ---
    const deleteMutation = useMutation({
        mutationFn: (id: string) => usersService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success('Staff member removed successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to remove staff member');
        }
    });

    const tabRoles = [null, 'INSTRUCTOR', 'INSTITUTION_ADMIN', 'REGISTRAR'];

    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchesTab = selectedTab === 0 || s.role?.name === tabRoles[selectedTab];
            const matchesSearch =
                s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [staff, selectedTab, searchQuery]);

    const staffKPIs = useMemo(() => {
        const total = staff.length;
        const instructors = staff.filter(s => s.role?.name === 'INSTRUCTOR').length;
        const admins = staff.filter(s => s.role?.name === 'INSTITUTION_ADMIN').length;
        const active = staff.filter(s => s.isActive).length;
        
        return [
            { label: 'Total Staff', value: total, icon: 'People', trend: 'stable' },
            { label: 'Instructors', value: instructors, icon: 'School', trend: 'up', color: 'success' },
            { label: 'Management', value: admins, icon: 'Settings', trend: instructors > 0 ? 'up' : 'stable', color: 'primary' },
            { label: 'Active Status', value: active, icon: 'Verified', trend: 'stable' },
        ];
    }, [staff]);

    const staffColumns: GridColDef<StaffMember>[] = [
        {
            field: 'profilePicture',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <Avatar 
                    src={params.value} 
                    sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontSize: '0.8rem' }}
                >
                    {params.row.firstName?.charAt(0)}
                </Avatar>
            )
        },
        {
            field: 'firstName',
            headerName: 'Full Name',
            flex: 1,
            minWidth: 180,
            valueGetter: (_, row) => `${row.firstName || ''} ${row.lastName || ''}`,
        },
        { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
        {
            field: 'role',
            headerName: 'Role',
            width: 160,
            renderCell: (params) => {
                const role = params.row.role?.name || 'Unknown';
                let color: 'default' | 'primary' | 'secondary' | 'warning' | 'error' | 'success' = 'default';
                if (role.includes('ADMIN')) color = 'primary';
                if (role === 'INSTRUCTOR') color = 'success';
                
                return (
                    <Chip
                        label={role.replace(/_/g, ' ')}
                        size="small"
                        color={color}
                        sx={{ fontWeight: 800, borderRadius: 1.5 }}
                    />
                );
            }
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'ACTIVE' : 'INACTIVE'}
                    color={params.value ? 'success' : 'error'}
                    variant={params.value ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                        <IconButton size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove Personnel">
                        <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to remove ${params.row.username}?`)) {
                                    deleteMutation.mutate(params.row.id);
                                }
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <Box sx={{ p: { xs: 2.5, md: 3, lg: 5 }, className: "animate-fade-in" }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1.5 }}>
                            Personnel Directory
                        </Typography>
                        {(isLoading || isFetching) && <CircularProgress size={20} thickness={5} />}
                    </Box>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage staff roles, institutional accounts, and access permissions.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <IconButton onClick={() => refetch()} disabled={isFetching} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <RefreshIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenUserDialog(true)}
                        sx={{ borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700, textTransform: 'none' }}
                    >
                        Add Personnel
                    </Button>
                </Box>
            </Box>

            <Box sx={{ mb: 5 }}>
                <KPIGrid kpis={staffKPIs as any} loading={isLoading} />
            </Box>

            <Box sx={{ mb: 4 }}>
                <Tabs
                    value={selectedTab}
                    onChange={(_, v) => setSelectedTab(v)}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', px: 3 }
                    }}
                >
                    <Tab label="All Personnel" />
                    <Tab label="Instructors" />
                    <Tab label="Management" />
                    <Tab label="Support Staff" />
                </Tabs>
            </Box>

            <DataTable
                title="Staff Registry"
                subtitle="Central search and management for all institutional staff"
                columns={staffColumns}
                rows={filteredStaff}
                loading={isLoading}
                module="hr"
                checkboxSelection
            />

            <UserDialog
                open={openUserDialog}
                onClose={() => setOpenUserDialog(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['staff'] })}
            />
        </Box>
    );
}
