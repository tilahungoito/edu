'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Checkbox,
    FormControlLabel,
    Grid,
    Divider,
    Alert,
    CircularProgress,
    Chip,
    TextField,
    InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { rolesService, RoleWithCount } from '@/app/lib/api/roles.service';
import { Permission } from '@/app/lib/types/permissions';

interface PermissionDialogProps {
    open: boolean;
    onClose: () => void;
    role: RoleWithCount | null;
    onSuccess: () => void;
}

export function PermissionDialog({ open, onClose, role, onSuccess }: PermissionDialogProps) {
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (open && role) {
            fetchPermissions();
            setSelectedIds(role.permissions.map(p => p.id));
        }
    }, [open, role]);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const perms = await rolesService.getAllPermissions();
            setAllPermissions(perms);
        } catch (err: any) {
            setError('Failed to load permissions');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!role) return;
        setSaving(true);
        try {
            await rolesService.assignPermissions(role.id, selectedIds);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    // Group permissions by module
    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const filteredModules = Object.entries(groupedPermissions).filter(([module, perms]) => {
        if (!searchQuery) return true;
        return module.toLowerCase().includes(searchQuery.toLowerCase()) || 
               perms.some(p => p.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.action.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Manage Permissions: {role?.name}</Typography>
                    <TextField
                        size="small"
                        placeholder="Search permissions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ minHeight: '400px' }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box>
                        {filteredModules.length === 0 ? (
                            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                No permissions found matching your search.
                            </Typography>
                        ) : (
                            filteredModules.map(([module, perms]) => (
                                <Box key={module} sx={{ mb: 4 }}>
                                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                                            {module}
                                        </Typography>
                                        <Chip label={`${perms.filter(p => selectedIds.includes(p.id)).length}/${perms.length}`} size="small" variant="soft" color="primary" />
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={1}>
                                        {perms.map(perm => (
                                            <Grid key={perm.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox 
                                                            checked={selectedIds.includes(perm.id)}
                                                            onChange={() => handleToggle(perm.id)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                                                {perm.action} {perm.resourceType && (perm.resourceType as string) !== 'all' ? perm.resourceType : ''}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                                {perm.description || `${perm.action} access to ${perm.module}`}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            ))
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSave} 
                    disabled={saving || loading}
                    sx={{ px: 4, borderRadius: 2 }}
                >
                    {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
