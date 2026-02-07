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
    Grid2 as Grid,
    CircularProgress,

    Box,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    LinearProgress,
    alpha,
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { adminService } from '@/app/lib/api/admin.service';
import { useAuthStore } from '@/app/lib/store';
import { ScopeSelector } from './ScopeSelector';
import { ROLE_HIERARCHY, getManagedRoles } from '@/app/lib/utils/rbac-utils';
import { Role } from '@/app/lib/types/roles';

interface UserDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function UserDialog({ open, onClose, onSuccess }: UserDialogProps) {
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        phone: '',
        firstName: '',
        lastName: '',
        targetRole: '' as Role | '',
        scopeId: '',
    });

    // Validation State
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setFormData({
                email: '',
                username: '',
                password: '', // Empty by default
                phone: '',
                firstName: '',
                lastName: '',
                targetRole: '' as Role | '',
                scopeId: '',
            });
            setErrors({});
            setError(null);
        }
    }, [open]);

    // Get available roles based on current user's role
    const creatorRole = (user?.roles?.[0]?.name as Role) || '';
    const availableRoles = creatorRole ? getManagedRoles(creatorRole) : [];

    // Auto-select role if only one is available
    useEffect(() => {
        if (open && availableRoles.length === 1 && !formData.targetRole) {
            setFormData(prev => ({ ...prev, targetRole: availableRoles[0] }));
        }
    }, [open, availableRoles, formData.targetRole]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleScopeChange = (value: string) => {
        setFormData(prev => ({ ...prev, scopeId: value }));
        if (errors.scopeId) {
            setErrors(prev => ({ ...prev, scopeId: '' }));
        }
    };

    // Password Strength Logic
    const getPasswordStrength = (password: string): number => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 6) strength += 25;
        if (password.length >= 10) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
        return Math.min(strength, 100);
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const getStrengthColor = (strength: number) => {
        if (strength < 40) return 'error';
        if (strength < 70) return 'warning';
        return 'success';
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        if (!formData.phone) newErrors.phone = 'Phone number is required';

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.targetRole) newErrors.targetRole = 'Role is required';

        // Check if scope is required for the selected role
        // SYSTEM_ADMIN usually doesn't need a scope, but others do
        if (formData.targetRole && formData.targetRole !== 'SYSTEM_ADMIN' && !formData.scopeId) {
            // Some roles like INSTRUCTOR might be created under an institution without scopeId?
            // Actually they need to belong to the institution.
            // Let's enforce scopeId via ScopeSelector's logic, but here generally required
            // unless we decide otherwise. 
            // The ScopeSelector only renders if there's a map.
            // If ScopeSelector renders, scopeId is required.
            // For now, let's enforce it if role is not SYSTEM_ADMIN.
            newErrors.scopeId = 'Administrative unit is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

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
            console.error('Create user error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                Create New User
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Add a new administrative or staff account to the system
                </Typography>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2.5}>
                        {/* Personal Information Section */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                                Personal Information
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="First Name"
                                name="firstName"
                                fullWidth
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                error={!!errors.firstName}
                                helperText={errors.firstName}
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
                                error={!!errors.lastName}
                                helperText={errors.lastName}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Email Address"
                                name="email"
                                type="email"
                                fullWidth
                                required
                                value={formData.email}
                                onChange={handleChange}
                                error={!!errors.email}
                                helperText={errors.email}
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
                                error={!!errors.phone}
                                helperText={errors.phone}
                            />
                        </Grid>

                        {/* Account Details Section */}
                        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                                Account Details
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Username"
                                name="username"
                                fullWidth
                                required
                                value={formData.username}
                                onChange={handleChange}
                                error={!!errors.username}
                                helperText={errors.username}
                            />
                        </Grid>
                        <Grid sx={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                required
                                value={formData.password}
                                onChange={handleChange}
                                error={!!errors.password}
                                helperText={errors.password}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <Box sx={{ mt: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={passwordStrength}
                                        color={getStrengthColor(passwordStrength)}
                                        sx={{ height: 4, borderRadius: 2, bgcolor: alpha('#000', 0.05) }}
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">Strength</Typography>
                                        <Typography variant="caption" fontWeight={600} color={`${getStrengthColor(passwordStrength)}.main`}>
                                            {passwordStrength < 40 ? 'Weak' : passwordStrength < 70 ? 'Medium' : 'Strong'}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Grid>

                        {/* Role & Permission Section */}
                        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                                Role & Permissions
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select
                                label="Assign Role"
                                name="targetRole"
                                fullWidth
                                required
                                value={formData.targetRole}
                                onChange={handleChange}
                                error={!!errors.targetRole}
                                helperText={errors.targetRole || "Select the user's access level"}
                            >
                                {availableRoles.map(role => (
                                    <MenuItem key={role} value={role}>{role.replace('_', ' ')}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {formData.targetRole && (
                                <ScopeSelector
                                    targetRole={formData.targetRole as Role}
                                    value={formData.scopeId}
                                    onChange={handleScopeChange}
                                    error={!!errors.scopeId}
                                    helperText={errors.scopeId}
                                />
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: alpha('#000', 0.02) }}>
                    <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                            borderRadius: '10px',
                            px: 4,
                            fontWeight: 700,
                            boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create User'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
