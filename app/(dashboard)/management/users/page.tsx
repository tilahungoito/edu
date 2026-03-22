'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, alpha, Avatar, useTheme,
    Button,
    IconButton, Tooltip, Chip, Paper, Skeleton,
    TextField, InputAdornment, MenuItem, FormControl, Select, InputLabel
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables/DataTable';
import {
    ExpandMore as ExpandMoreIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ToggleOn as ActivateIcon,
    ToggleOff as DeactivateIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    People as PeopleIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { usersService } from '@/app/lib/api/users.service';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import type { User } from '@/app/lib/api/api-client';
import { UserDialog } from '@/app/components/management/UserDialog';
import { ConfirmDialog } from '@/app/components/common/ConfirmDialog';
import { useAuthStore } from '@/app/lib/store';
import { toast } from 'react-hot-toast';

const CREATE_ROLES = [
    'SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN',
    'WOREDA_ADMIN', 'KEBELE_ADMIN', 'INSTITUTION_ADMIN'
];

// Color per role
const roleColors: Record<string, string> = {
    'SYSTEM_ADMIN': '#ef4444',
    'REGIONAL_ADMIN': '#f97316',
    'ZONE_ADMIN': '#f59e0b',
    'WOREDA_ADMIN': '#10b981',
    'KEBELE_ADMIN': '#06b6d4',
    'INSTITUTION_ADMIN': '#3b82f6',
    'INSTRUCTOR': '#8b5cf6',
    'REGISTRAR': '#ec4899',
    'STUDENT': '#6366f1',
    'ACCOUNTANT': '#14b8a6',
};
const roleOrder = [
    'SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN',
    'KEBELE_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR', 'INSTRUCTOR',
    'ACCOUNTANT', 'STUDENT',
];
const getRoleColor = (role: string) => roleColors[role] || '#64748b';

const roleFriendlyName = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function UsersManagementPage() {
    const theme = useTheme();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const handleEdit = (u: any) => {
        setSelectedUser(u);
        setDialogOpen(true);
    };

    const user = useAuthStore(state => state.user);
    const canCreate = user?.roles?.some(r => CREATE_ROLES.includes(r.name)) ?? false;

    const userRoles = useMemo(() => user?.roles?.map((r: any) => r.name) || [], [user?.roles]);
    
    const visibleRoles = useMemo(() => {
        if (userRoles.includes('SYSTEM_ADMIN')) return roleOrder;
        if (userRoles.includes('REGIONAL_ADMIN')) return roleOrder.slice(roleOrder.indexOf('ZONE_ADMIN'));
        if (userRoles.includes('ZONE_ADMIN')) return roleOrder.slice(roleOrder.indexOf('WOREDA_ADMIN'));
        if (userRoles.includes('WOREDA_ADMIN')) return roleOrder.slice(roleOrder.indexOf('KEBELE_ADMIN'));
        if (userRoles.includes('KEBELE_ADMIN')) return roleOrder.slice(roleOrder.indexOf('INSTITUTION_ADMIN'));
        if (userRoles.includes('INSTITUTION_ADMIN')) return ['REGISTRAR', 'INSTRUCTOR', 'ACCOUNTANT', 'STUDENT'];
        return [];
    }, [userRoles]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await usersService.getAll();
            setUsers(data);
        } catch {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);
    useRealTime('STATS_UPDATED', fetchUsers);

    const mappedUsers = useMemo(() => {
        let result = users.map(u => ({
            ...u,
            name: u.firstName ? `${u.firstName} ${u.lastName}`.trim() : (u.username || u.email),
            roleName: (u.role as any)?.name || (u.roles?.[0]?.name) || 'User',
            scope: u.scopeType || 'System',
        }));

        // Filter based on allowed visibility
        if (!userRoles.includes('SYSTEM_ADMIN')) {
            result = result.filter(u => visibleRoles.includes(u.roleName) || u.roleName === 'User');
        }

        if (selectedRole !== 'all') {
            result = result.filter(u => u.roleName === selectedRole || u.roleName === roleFriendlyName(selectedRole));
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(u => 
                u.name.toLowerCase().includes(q) || 
                u.email?.toLowerCase().includes(q)
            );
        }

        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [users, selectedRole, searchQuery, visibleRoles, userRoles]);



    const handleToggleStatus = async (u: any) => {
        try {
            if (u.isActive) {
                await usersService.deactivate(u.id);
                toast.success('User deactivated');
            } else {
                await usersService.activate(u.id);
                toast.success('User activated');
            }
            fetchUsers();
        } catch (e: any) {
            toast.error(e.message || 'Failed to update status');
        }
    };

    const handleDelete = async (u: any) => {
        try {
            await usersService.remove(u.id);
            toast.success('User removed');
            fetchUsers();
            setDeleteTarget(null);
        } catch (e: any) {
            toast.error(e.message || 'Failed to remove user');
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'index',
            headerName: '#',
            width: 60,
            filterable: false,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.secondary' }}>
                    {params.api.getAllRowIds().indexOf(params.id) + 1}
                </Typography>
            )
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 180,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main', fontWeight: 600 }}>
                        {params.value?.[0]}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{params.value}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: -0.5 }}>{params.row.email}</Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'roleName',
            headerName: 'Role',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                const color = getRoleColor(params.value);
                return (
                    <Chip
                        label={roleFriendlyName(params.value)}
                        size="small"
                        sx={{ bgcolor: alpha(color, 0.1), color, fontWeight: 700, fontSize: '11px', height: 22 }}
                    />
                );
            }
        },
        {
            field: 'scope',
            headerName: 'Scope',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => {
                const color = getRoleColor(params.row.roleName);
                return (
                    <Chip
                        label={params.value}
                        size="small"
                        sx={{ bgcolor: alpha(color, 0.08), color, fontWeight: 600, fontSize: '10px', height: 20, borderRadius: '6px' }}
                    />
                );
            }
        }
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                <TextField
                    placeholder="Search by name or email..."
                    size="small"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
                    sx={{ width: { xs: '100%', sm: 240 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Role</InputLabel>
                    <Select value={selectedRole} label="Role" onChange={e => setSelectedRole(e.target.value)} sx={{ borderRadius: 2 }}>
                        <MenuItem value="all">All Roles</MenuItem>
                        {visibleRoles.map(r => <MenuItem key={r} value={r}>{roleFriendlyName(r)}</MenuItem>)}
                    </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', gap: 1, ml: 'auto', alignItems: 'center' }}>
                    <Tooltip title="Refresh"><IconButton size="small" onClick={fetchUsers}><RefreshIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
            </Paper>

            <DataTable
                title="System Users"
                subtitle="View and manage administrative personnel across different scopes"
                rows={mappedUsers}
                columns={columns}
                loading={loading}
                module="management"
                onAdd={canCreate ? () => { setSelectedUser(null); setDialogOpen(true); } : undefined}
                allowedRoles={CREATE_ROLES}
                onEdit={handleEdit}
                onView={(row) => {
                    console.log('Viewing user:', row);
                }}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onRefresh={fetchUsers}
                showDensitySelector={true}
                statusField="isActive"
            />

            {/* Edit / Create Dialog */}
            <UserDialog
                open={dialogOpen}
                user={selectedUser}
                onClose={() => { setDialogOpen(false); setSelectedUser(null); }}
                onSuccess={() => {
                    fetchUsers();
                    toast.success(selectedUser ? 'User updated' : 'User created');
                }}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove User"
                message={`Are you sure you want to permanently remove "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Remove"
                confirmColor="error"
                onConfirm={() => handleDelete(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
            />
        </Box>
    );
}
