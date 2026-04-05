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
        firstName: '',
        lastName: '',
        username: '',
        institutionId: '',
        program: '',
        year: 1,
        gender: '' as 'MALE' | 'FEMALE' | '',
        sem1Average: '' as string | number,
        sem2Average: '' as string | number,
        promotionStatus: '' as 'PASS' | 'DETAINED' | 'WITHDRAWN' | 'PENDING' | '',
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
                // Pull existing semester results from academicHistories
                const getSem = (num: 1 | 2) => {
                    const roman = num === 1 ? 'I' : 'II';
                    const digit = num.toString();
                    const re = new RegExp(`(Semester|Sem|S)[.\\s-]*(${roman}|${digit})(?![A-Za-z\\d])`, 'i');
                    return student.academicHistories?.find(h => re.test(h.academicPeriod?.name || ''));
                };
                const h1 = getSem(1);
                const h2 = getSem(2);
                setFormData({
                    firstName: student.user?.firstName || '',
                    lastName: student.user?.lastName || '',
                    username: student.user?.username || '',
                    institutionId: student.institutionId,
                    program: student.program,
                    year: student.year,
                    gender: student.gender || '',
                    sem1Average: h1?.finalAverage != null ? h1.finalAverage : '',
                    sem2Average: h2?.finalAverage != null ? h2.finalAverage : '',
                    promotionStatus: (h1 || h2)?.promotionStatus || '',
                });
            } else {
                setFormData({
                    firstName: '',
                    lastName: '',
                    username: '',
                    institutionId: user?.tenantType === 'school' ? user.tenantId : '',
                    program: '',
                    year: 1,
                    gender: '',
                    sem1Average: '',
                    sem2Average: '',
                    promotionStatus: '',
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

        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
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
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username || undefined,
                institutionId: formData.institutionId,
                program: formData.program,
                year: Number(formData.year),
                gender: formData.gender,
                // Only include academicHistory if at least one semester average is provided
                ...(formData.sem1Average !== '' || formData.sem2Average !== '' ? {
                    academicHistory: {
                        sem1Average: formData.sem1Average !== '' ? Number(formData.sem1Average) : null,
                        sem2Average: formData.sem2Average !== '' ? Number(formData.sem2Average) : null,
                        promotionStatus: formData.promotionStatus || undefined,
                    }
                } : {}),
            };

            if (student) {
                await studentsService.update(student.id, payload as any);
            } else {
                await studentsService.create(payload as any);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Submission error:', err);
            const message = err.response?.data?.message;
            setError(Array.isArray(message) ? message.join(', ') : (message || 'Failed to save student record'));
        } finally {
            setLoading(false);
        }
    };

    const isEdit = !!student;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                {isEdit ? `Update Profile: ${formData.firstName} ${formData.lastName}` : 'Register New Student'}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {isEdit ? 'Modify student profile and academic details.' : 'Create a new student profile. Credentials will be auto-generated.'}
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
                                select
                                label="Program / Department"
                                name="program"
                                fullWidth
                                required
                                value={formData.program}
                                onChange={handleChange}
                                error={!!errors.program}
                                helperText={errors.program}
                            >
                                <MenuItem value="Natural Science">Natural Science</MenuItem>
                                <MenuItem value="Social Science">Social Science</MenuItem>
                                <MenuItem value="General">General</MenuItem>
                                <MenuItem value="Vocational">Vocational</MenuItem>
                            </TextField>
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
                                InputProps={{ inputProps: { min: 1, max: 12 } }}
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

                        {/* ── Semester Results ─────────────────────────────── */}
                        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                            <Typography variant="overline" color="secondary" fontWeight={800} sx={{ letterSpacing: 1 }}>
                                Semester Results{' '}
                                <Typography component="span" variant="caption" color="text.secondary">
                                    (optional — leave blank if not yet available)
                                </Typography>
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Semester I Average (%)"
                                name="sem1Average"
                                type="number"
                                fullWidth
                                value={formData.sem1Average}
                                onChange={handleChange}
                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                                helperText="e.g. 78.5"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Semester II Average (%)"
                                name="sem2Average"
                                type="number"
                                fullWidth
                                value={formData.sem2Average}
                                onChange={handleChange}
                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                                helperText="e.g. 82.0"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                select
                                label="Academic Standing"
                                name="promotionStatus"
                                fullWidth
                                value={formData.promotionStatus}
                                onChange={handleChange}
                                helperText="Set manually or leave for auto-calculation"
                            >
                                <MenuItem value="">Auto / Not Set</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="PASS">Promoted (Pass)</MenuItem>
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
