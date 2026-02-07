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
        description: '',
        credits: 3,
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
                    description: course.description || '',
                    credits: course.credits,
                    instructorId: course.instructorId,
                    institutionId: course.institutionId,
                });
            } else {
                setFormData({
                    name: '',
                    code: '',
                    description: '',
                    credits: 3,
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
        if (!formData.credits || formData.credits < 0) newErrors.credits = 'Valid credits are required';
        if (!formData.institutionId) newErrors.institutionId = 'Institution is required';
        if (!formData.instructorId) newErrors.instructorId = 'Instructor assignment is required';

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
                // Course update endpoint might be needed in service, 
                // for now we only have creation and transfer.
                // Let's assume create works for both if we add ID or 
                // we'll just handle creation for now.
                // Wait, I should've checked if update is in courses.service.ts
                // It's not. I'll focus on creation and transfer.
                setError('Course editing is currently limited to instructor transfers.');
            } else {
                await coursesService.create({
                    ...formData,
                    credits: Number(formData.credits),
                } as CreateCourseData);
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

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Course Code"
                                name="code"
                                fullWidth
                                required
                                value={formData.code}
                                onChange={handleChange}
                                error={!!errors.code}
                                helperText={errors.code}
                                placeholder="CS101"
                                disabled={isEdit}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                                label="Course Name"
                                name="name"
                                fullWidth
                                required
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                placeholder="Introduction to Computer Science"
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Description"
                                name="description"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="A brief overview of the course content..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Credits"
                                name="credits"
                                type="number"
                                fullWidth
                                required
                                value={formData.credits}
                                onChange={handleChange}
                                error={!!errors.credits}
                                helperText={errors.credits}
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
                                label="Assign Instructor"
                                name="instructorId"
                                fullWidth
                                required
                                value={formData.instructorId}
                                onChange={handleChange}
                                error={!!errors.instructorId}
                                helperText={errors.instructorId}
                                disabled={fetchingData || isEdit} // Use transfer dialog for edits
                            >
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
