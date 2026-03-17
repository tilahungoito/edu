'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Chip, 
    IconButton, 
    Tooltip,
    Alert,
    Snackbar,
    alpha,
    useTheme
} from '@mui/material';
import { 
    Security as SecurityIcon, 
    Edit as EditIcon,
    DeleteOutline as DeleteIcon,
    Group as GroupIcon,
    Refresh as RefreshIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { DataTable } from '@/app/components/tables';
import { GridColDef } from '@mui/x-data-grid';
import { rolesService, RoleWithCount } from '@/app/lib/api/roles.service';
import { RoleDialog } from '@/app/components/management/RoleDialog';
import { PermissionDialog } from '@/app/components/management/PermissionDialog';

export default function RolesPermissionsPage() {
    const theme = useTheme();
    const [roles, setRoles] = useState<RoleWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Dialog states
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [permDialogOpen, setPermDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleWithCount | null>(null);
    
    // Notification state
    const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const fetchRoles = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await rolesService.getAllRoles();
            setRoles(data);
        } catch (err: any) {
            setError('Failed to load roles and permissions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDeleteRole = async (role: RoleWithCount) => {
        if (!confirm(`Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`)) return;

        try {
            await rolesService.deleteRole(role.id);
            setNotification({
                open: true,
                message: `Role "${role.name}" deleted successfully`,
                severity: 'success'
            });
            fetchRoles();
        } catch (err: any) {
            setNotification({
                open: true,
                message: err.message || 'Failed to delete role',
                severity: 'error'
            });
        }
    };

    const handleOpenPermissions = (role: RoleWithCount) => {
        setSelectedRole(role);
        setPermDialogOpen(true);
    };

    const columns: GridColDef<RoleWithCount>[] = [
        {
            field: 'name',
            headerName: 'Role Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SecurityIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={600}>
                        {params.value}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'permissions',
            headerName: 'Permissions',
            flex: 1.5,
            minWidth: 300,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 1 }}>
                    {params.value?.slice(0, 3).map((p: any) => (
                        <Chip 
                            key={p.id} 
                            label={`${p.action} ${p.module}`} 
                            size="small" 
                            variant="soft" 
                            sx={{ fontSize: '0.7rem' }}
                        />
                    ))}
                    {params.value?.length > 3 && (
                        <Chip 
                            label={`+${params.value.length - 3} more`} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontSize: '0.7rem' }}
                        />
                    )}
                    {(!params.value || params.value.length === 0) && (
                        <Typography variant="caption" color="text.disabled">No permissions</Typography>
                    )}
                </Box>
            )
        },
        {
            field: '_count',
            headerName: 'Active Users',
            width: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" color="action" />
                    <Typography variant="body2">{params.value?.users || 0}</Typography>
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            align: 'right',
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Manage Permissions">
                        <IconButton size="small" onClick={() => handleOpenPermissions(params.row)} color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Role">
                        <IconButton size="small" onClick={() => handleDeleteRole(params.row)} color="error">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '1440px', mx: 'auto' }}>
            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                        Roles & Permissions
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Define granular access control policies for different user categories
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="soft"
                        startIcon={<RefreshIcon />}
                        onClick={fetchRoles}
                        sx={{ borderRadius: 2.5 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setRoleDialogOpen(true)}
                        sx={{ 
                            borderRadius: 2.5, 
                            px: 3,
                            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
                        }}
                    >
                        New Role
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
                    {error}
                </Alert>
            )}

            <DataTable
                title="Management Vault"
                subtitle={`${roles.length} system roles identified`}
                rows={roles}
                columns={columns}
                loading={loading}
                module="system"
                onRefresh={fetchRoles}
            />

            <RoleDialog 
                open={roleDialogOpen} 
                onClose={() => setRoleDialogOpen(false)} 
                onSuccess={() => {
                    setNotification({
                        open: true,
                        message: 'Role created successfully',
                        severity: 'success'
                    });
                    fetchRoles();
                }}
            />

            <PermissionDialog 
                open={permDialogOpen} 
                onClose={() => {
                    setPermDialogOpen(false);
                    setSelectedRole(null);
                }}
                role={selectedRole}
                onSuccess={() => {
                    setNotification({
                        open: true,
                        message: 'Permissions updated successfully',
                        severity: 'success'
                    });
                    fetchRoles();
                }}
            />

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 2, boxShadow: 6 }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

