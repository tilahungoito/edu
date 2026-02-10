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
import coursesService, { Course, CreateCourseData } from '@/app/lib/api/courses.service';
import { staffService } from '@/app/lib/api/staff.service';
import { institutionsService, Institution } from '@/app/lib/api/institutions.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { User } from '@/app/lib/api/api-client';

interface CourseDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    course?: Course | null;
}

export function CourseDialog({ open, onClose, onSuccess, course }: CourseDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [instructors, setInstructors] = useState<User[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        credit: 3,
        instructorId: '',
        institutionId: '',
    });

    // Validation State
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch instructors and institutions
    useEffect(() => {
        const fetchData = async () => {
            if (!open) return;
            setFetchingData(true);
            try {
                const [insts, staffs] = await Promise.all([
                    institutionsService.getAll(),
                    staffService.getStaffByRole('INSTRUCTOR', user?.tenantId || undefined)
                ]);

                setInstitutions(insts);
                setInstructors(staffs);

                // Auto-fills
                if (insts.length === 1 && !formData.institutionId) {
                    setFormData(prev => ({ ...prev, institutionId: insts[0].id }));
                } else if (user?.tenantType === 'school' && user?.tenantId) {
                    setFormData(prev => ({ ...prev, institutionId: user.tenantId }));
                }
            } catch (err: any) {
                console.error('Failed to fetch support data:', err);
            } finally {
                setFetchingData(false);
            }
        };

        fetchData();
    }, [open, user]);

    // Reset/Populate form
    useEffect(() => {
        if (open) {
            if (course) {
                setFormData({
                    name: course.name,
                    code: course.code,
                    credit: course.credit,
                    instructorId: course.instructorId || '',
                    institutionId: course.institutionId,
                });
            } else {
                setFormData({
                    name: '',
                    code: '',
                    credit: 3,
                    instructorId: '',
                    institutionId: user?.tenantType === 'school' ? user.tenantId : '',
                });
            }
            setErrors({});
            setError(null);
        }
    }, [open, course, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name) newErrors.name = 'Course name is required';
        if (!formData.code) newErrors.code = 'Course code is required';
        if (!formData.credit || Number(formData.credit) < 0) newErrors.credit = 'Valid credit hours are required';
        if (!formData.institutionId) newErrors.institutionId = 'Institution is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            if (course) {
                setError('Course editing is currently limited to instructor transfers.');
            } else {
                const submitData: CreateCourseData = {
                    name: formData.name,
                    code: formData.code,
                    credit: Number(formData.credit),
                    institutionId: formData.institutionId,
                };

                if (formData.instructorId) {
                    submitData.instructorId = formData.instructorId;
                }

                await coursesService.create(submitData);
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.response?.data?.message || 'Failed to save course');
        } finally {
            setLoading(false);
        }
    };

    const isEdit = !!course;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                {isEdit ? 'Update Course' : 'Create New Course'}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {isEdit ? 'Modify course parameters and assignments.' : 'Define a new course in the curriculum.'}
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
                            <Typography variant="overline" color="primary" fontWeight={800} sx={{ letterSpacing: 1 }}>
                                General Information
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Course Name"
                                name="name"
                                fullWidth
                                required
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                placeholder="e.g. Introduction to Physics"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                label="Course Code"
                                name="code"
                                fullWidth
                                required
                                value={formData.code}
                                onChange={handleChange}
                                error={!!errors.code}
                                helperText={errors.code}
                                placeholder="e.g. PHYS101"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                label="Credits"
                                name="credit"
                                type="number"
                                fullWidth
                                required
                                value={formData.credit}
                                onChange={handleChange}
                                error={!!errors.credit}
                                helperText={errors.credit}
                                InputProps={{ inputProps: { min: 0, max: 20 } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                            <Typography variant="overline" color="primary" fontWeight={800} sx={{ letterSpacing: 1 }}>
                                Assignment & Scope
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
                                disabled={fetchingData || (user?.tenantType === 'school' && !isEdit)}
                            >
                                {institutions.map(inst => (
                                    <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                select
                                label="Assign Instructor (Optional)"
                                name="instructorId"
                                fullWidth
                                value={formData.instructorId}
                                onChange={handleChange}
                                error={!!errors.instructorId}
                                helperText={errors.instructorId}
                                disabled={fetchingData || isEdit}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {instructors.map(staff => (
                                    <MenuItem key={staff.id} value={staff.id}>{staff.username} ({staff.email})</MenuItem>
                                ))}
                                {instructors.length === 0 && <MenuItem disabled>No instructors found</MenuItem>}
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                    <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || isEdit}
                        sx={{
                            borderRadius: 2.5,
                            px: 4,
                            fontWeight: 700,
                            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Course'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
