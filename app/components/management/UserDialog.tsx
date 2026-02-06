'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    CircularProgress,
    Box,
    Typography,
    Alert,
} from '@mui/material';
import { adminService } from '@/app/lib/api/admin.service';
import { regionsService } from '@/app/lib/api/regions.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { institutionsService } from '@/app/lib/api/institutions.service';
import { useAuthStore } from '@/app/lib/store';

interface UserDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ROLE_HIERARCHY: Record<string, string[]> = {
    'SYSTEM_ADMIN': ['REGIONAL_ADMIN'],
    'REGIONAL_ADMIN': ['ZONE_ADMIN'],
    'ZONE_ADMIN': ['WOREDA_ADMIN'],
    'WOREDA_ADMIN': ['KEBELE_ADMIN'],
    'KEBELE_ADMIN': ['INSTITUTION_ADMIN'],
    'INSTITUTION_ADMIN': ['REGISTRAR', 'INSTRUCTOR', 'ACCOUNTANT', 'STUDENT'],
};

const SCOPE_MAP: Record<string, string> = {
    'REGIONAL_ADMIN': 'REGION',
    'ZONE_ADMIN': 'ZONE',
    'WOREDA_ADMIN': 'WOREDA',
    'KEBELE_ADMIN': 'KEBELE',
    'INSTITUTION_ADMIN': 'INSTITUTION',
};

export function UserDialog({ open, onClose, onSuccess }: UserDialogProps) {
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(false);
    const [fetchingScopes, setFetchingScopes] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scopes, setScopes] = useState<{ id: string, name: string }[]>([]);

    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: 'Password123!', // Default password for new users
        phone: '',
        firstName: '',
        lastName: '',
        targetRole: '',
        scopeId: '',
    });

    const creatorRole = user?.roles[0]?.name || '';
    const availableRoles = ROLE_HIERARCHY[creatorRole] || [];

    useEffect(() => {
        if (availableRoles.length === 1 && !formData.targetRole) {
            setFormData(prev => ({ ...prev, targetRole: availableRoles[0] }));
        }
    }, [availableRoles, formData.targetRole]);

    useEffect(() => {
        const fetchScopes = async () => {
            const scopeType = SCOPE_MAP[formData.targetRole];
            if (!scopeType) {
                setScopes([]);
                return;
            }

            setFetchingScopes(true);
            try {
                let data: any[] = [];
                if (scopeType === 'REGION') data = await regionsService.getAll();
                else if (scopeType === 'ZONE') data = await zonesService.getAll();
                else if (scopeType === 'WOREDA') data = await woredasService.getAll();
                else if (scopeType === 'INSTITUTION') data = await institutionsService.getAll();

                setScopes(data.map(item => ({ id: item.id, name: item.name })));
            } catch (err) {
                console.error('Error fetching scopes:', err);
                setError('Failed to load locations.');
            } finally {
                setFetchingScopes(false);
            }
        };

        if (open && formData.targetRole) {
            fetchScopes();
        }
    }, [open, formData.targetRole]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await adminService.createUser(formData.targetRole, {
                email: formData.email,
                username: formData.username,
                password: formData.password,
                phone: formData.phone,
                firstName: formData.firstName,
                lastName: formData.lastName,
                scopeId: formData.scopeId || undefined,
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>Add New User Account</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Create a new administrative account within your direct hierarchy.
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="First Name"
                                name="firstName"
                                fullWidth
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Last Name"
                                name="lastName"
                                fullWidth
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Username"
                                name="username"
                                fullWidth
                                required
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Email address"
                                name="email"
                                type="email"
                                fullWidth
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Phone Number"
                                name="phone"
                                fullWidth
                                required
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select
                                label="Select Role"
                                name="targetRole"
                                fullWidth
                                required
                                value={formData.targetRole}
                                onChange={handleChange}
                            >
                                {availableRoles.map(role => (
                                    <MenuItem key={role} value={role}>{role.replace('_', ' ')}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {scopes.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    select
                                    label={`Select ${SCOPE_MAP[formData.targetRole]}`}
                                    name="scopeId"
                                    fullWidth
                                    required
                                    value={formData.scopeId}
                                    onChange={handleChange}
                                    disabled={fetchingScopes}
                                >
                                    {fetchingScopes ? (
                                        <MenuItem disabled><CircularProgress size={20} sx={{ mr: 1 }} /> Loading...</MenuItem>
                                    ) : (
                                        scopes.map(scope => (
                                            <MenuItem key={scope.id} value={scope.id}>{scope.name}</MenuItem>
                                        ))
                                    )}
                                </TextField>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={onClose} color="inherit">Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{ borderRadius: '12px', px: 4 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Create Account'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
