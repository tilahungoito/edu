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
    alpha,
    useTheme,
} from '@mui/material';
import { studentsService, Student, CreateStudentData, UpdateStudentData } from '@/app/lib/api/students.service';
import { institutionsService, Institution } from '@/app/lib/api/institutions.service';
import { useAuthStore } from '@/app/lib/store';

interface StudentDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    student?: Student | null;
}

export function StudentDialog({ open, onClose, onSuccess, student }: StudentDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(false);
    const [fetchingInstitutions, setFetchingInstitutions] = useState(false);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        phone: '',
        institutionId: '',
        program: '',
        year: 1,
        gender: '' as 'MALE' | 'FEMALE' | '',
        sem1Average: '' as string | number,
        sem2Average: '' as string | number,
        promotionStatus: 'PENDING' as 'PASS' | 'DETAINED' | 'WITHDRAWN' | 'PENDING',
    });

    // Validation State
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch institutions if user is not limited to one
    useEffect(() => {
        const fetchInstitutions = async () => {
            if (!open) return;

            // If user is school-level, they might be restricted. 
            // For now, let's fetch all institutions they have access to.
            setFetchingInstitutions(true);
            try {
                const data = await institutionsService.getAll();
                setInstitutions(data);

                // Auto-select if there's only one institution
                if (data.length === 1 && !formData.institutionId) {
                    setFormData(prev => ({ ...prev, institutionId: data[0].id }));
                } else if (user?.tenantType === 'school' && user?.tenantId) {
                    // Safety check: if user is school admin, auto-select their institution
                    setFormData(prev => ({ ...prev, institutionId: user.tenantId }));
                }
            } catch (err: any) {
                console.error('Failed to fetch institutions:', err);
            } finally {
                setFetchingInstitutions(false);
            }
        };

        fetchInstitutions();
    }, [open, user]);

    // Reset/Populate form when dialog opens or student changes
    useEffect(() => {
        if (open) {
            if (student) {
                setFormData({
                    email: student.user?.email || '',
                    username: student.user?.username || '',
                    phone: student.user?.phone || '',
                    institutionId: student.institutionId,
                    program: student.program,
                    year: student.year,
                    gender: student.gender || '',
                    sem1Average: student.academicHistories?.find(h => h.academicPeriod.name.includes('Semester I'))?.finalAverage || '',
                    sem2Average: student.academicHistories?.find(h => h.academicPeriod.name.includes('Semester II'))?.finalAverage || '',
                    promotionStatus: student.academicHistories?.[0]?.promotionStatus || 'PENDING',
                });
            } else {
                setFormData({
                    email: '',
                    username: '',
                    phone: '',
                    institutionId: user?.tenantType === 'school' ? user.tenantId : '',
                    program: '',
                    year: 1,
                    gender: '',
                    sem1Average: '',
                    sem2Average: '',
                    promotionStatus: 'PENDING',
                });
            }
            setErrors({});
            setError(null);
        }
    }, [open, student, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.username) newErrors.username = 'Student name is required';
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.institutionId) newErrors.institutionId = 'Institution is required';
        if (!formData.program) newErrors.program = 'Academic program is required';
        if (!formData.year || formData.year < 1) newErrors.year = 'Valid year is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            const payload = {
                phone: formData.phone,
                institutionId: formData.institutionId,
                program: formData.program,
                year: Number(formData.year),
                gender: formData.gender,
                // Add academic performance data to payload
                academicHistory: {
                    sem1Average: formData.sem1Average !== '' ? Number(formData.sem1Average) : null,
                    sem2Average: formData.sem2Average !== '' ? Number(formData.sem2Average) : null,
                    promotionStatus: formData.promotionStatus,
                }
            };

            if (student) {
                await studentsService.update(student.id, payload as any);
            } else {
                await studentsService.create({
                    ...formData,
                    ...payload,
                    year: Number(formData.year),
                } as any);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.response?.data?.message || 'Failed to save student record');
        } finally {
            setLoading(false);
        }
    };

    const isEdit = !!student;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                {isEdit ? 'Update Student Record' : 'Register New Student'}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {isEdit ? 'Modify student profile and academic details.' : 'Create a new student profile in the system.'}
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
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="overline" color="secondary" fontWeight={800} sx={{ letterSpacing: 1 }}>
                                Personal Information
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Full Name"
                                name="username"
                                fullWidth
                                required
                                value={formData.username}
                                onChange={handleChange}
                                error={!!errors.username}
                                helperText={errors.username}
                                disabled={isEdit} // Username usually shouldn't change
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
                                disabled={isEdit}
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

                        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                            <Typography variant="overline" color="secondary" fontWeight={800} sx={{ letterSpacing: 1 }}>
                                Academic Details
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                select
                                label="Institution"
                                name="institutionId"
                                fullWidth
                                required
                                value={formData.institutionId}
                                onChange={handleChange}
                                error={!!errors.institutionId}
                                helperText={errors.institutionId}
                                disabled={fetchingInstitutions || (user?.tenantType === 'school' && !isEdit)}
                            >
                                {fetchingInstitutions ? (
                                    <MenuItem disabled><CircularProgress size={20} sx={{ mr: 1 }} /> Loading...</MenuItem>
                                ) : (
                                    institutions.map(inst => (
                                        <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
                                    ))
                                )}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                                label="Program / Department"
                                name="program"
                                fullWidth
                                required
                                value={formData.program}
                                onChange={handleChange}
                                error={!!errors.program}
                                helperText={errors.program}
                                placeholder="e.g., Computer Science, Engineering"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Current Year"
                                name="year"
                                type="number"
                                fullWidth
                                required
                                value={formData.year}
                                onChange={handleChange}
                                error={!!errors.year}
                                helperText={errors.year}
                                InputProps={{ inputProps: { min: 1, max: 8 } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                select
                                label="Gender"
                                name="gender"
                                fullWidth
                                required
                                value={formData.gender}
                                onChange={handleChange}
                                error={!!errors.gender}
                                helperText={errors.gender}
                            >
                                <MenuItem value="MALE">Male</MenuItem>
                                <MenuItem value="FEMALE">Female</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                            <Typography variant="overline" color="secondary" fontWeight={800} sx={{ letterSpacing: 1 }}>
                                Academic Performance
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                label="Semester I Avg (%)"
                                name="sem1Average"
                                type="number"
                                fullWidth
                                value={formData.sem1Average}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 0, max: 100 } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                label="Semester II Avg (%)"
                                name="sem2Average"
                                type="number"
                                fullWidth
                                value={formData.sem2Average}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 0, max: 100 } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                label="Overall Avg (%)"
                                fullWidth
                                disabled
                                value={(() => {
                                    const s1 = Number(formData.sem1Average);
                                    const s2 = Number(formData.sem2Average);
                                    if (!isNaN(s1) && !isNaN(s2) && formData.sem1Average !== '' && formData.sem2Average !== '') return ((s1 + s2) / 2).toFixed(1);
                                    if (!isNaN(s1) && formData.sem1Average !== '') return s1.toFixed(1);
                                    if (!isNaN(s2) && formData.sem2Average !== '') return s2.toFixed(1);
                                    return '-';
                                })()}
                                helperText="Calculated automatically"
                                slotProps={{ input: { sx: { fontWeight: 800, color: 'secondary.main' } } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                select
                                label="Promotion Status"
                                name="promotionStatus"
                                fullWidth
                                value={formData.promotionStatus}
                                onChange={handleChange}
                            >
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="PASS">Promoted</MenuItem>
                                <MenuItem value="DETAINED">Detained</MenuItem>
                                <MenuItem value="WITHDRAWN">Withdrawn</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                    <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        disabled={loading}
                        sx={{
                            borderRadius: 2.5,
                            px: 4,
                            fontWeight: 700,
                            boxShadow: `0 4px 14px ${alpha(theme.palette.secondary.main, 0.3)}`
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (isEdit ? 'Update Student' : 'Register Student')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
