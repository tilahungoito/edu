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
    IconButton,
    alpha,
    useTheme,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
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

    // Form State: Array for creation, single object for editing
    const [courses, setCourses] = useState<Array<{ name: string; gradeLevel: string | number }>>([
        { name: '', gradeLevel: '' }
    ]);

    // Single form data for editing
    const [editData, setEditData] = useState({
        name: '',
        gradeLevel: '' as string | number,
    });

    const isEdit = !!course;

    // Validation State
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch instructors and institutions
    useEffect(() => {
        const fetchData = async () => {
            if (!open) return;
            setFetchingData(true);
            try {
                const insts = await institutionsService.getAll();
                setInstitutions(insts);
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
                setEditData({
                    name: course.name,
                    gradeLevel: course.gradeLevel || '',
                });
            } else {
                setCourses([{ name: '', gradeLevel: '' }]);
            }
            setErrors({});
            setError(null);
        }
    }, [open, course, user]);

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleCourseChange = (index: number, name: string, value: any) => {
        const newCourses = [...courses];
        newCourses[index] = { ...newCourses[index], [name]: value as any };
        setCourses(newCourses);
        // Clear errors for this index if any
        if (errors[`${index}-${name}`]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[`${index}-${name}`];
                return newErrs;
            });
        }
    };

    const addCourseRow = () => {
        setCourses([...courses, { name: '', gradeLevel: '' }]);
    };

    const removeCourseRow = (index: number) => {
        if (courses.length > 1) {
            setCourses(courses.filter((_, i) => i !== index));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        const isRegional = user?.roles?.some(r => r.name === 'REGIONAL_ADMIN' || r.name === 'REGION_ADMIN');

        if (isEdit) {
            if (!editData.name) newErrors.name = 'Name is required';
            if (isRegional && !editData.gradeLevel) newErrors.gradeLevel = 'Grade level is required';
        } else {
            courses.forEach((c, idx) => {
                if (!c.name) newErrors[`${idx}-name`] = 'Name is required';
                if (isRegional && !c.gradeLevel) newErrors[`${idx}-gradeLevel`] = 'Grade level is required';
            });
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
            const isRegional = user?.roles?.some(r => r.name === 'REGIONAL_ADMIN' || r.name === 'REGION_ADMIN');

            if (isEdit) {
                const submitData: any = {
                    name: editData.name,
                };
                // Only send institutionId if we're a school and have a valid ID
                if (!isRegional && user?.tenantId && user.tenantType === 'school') {
                    submitData.institutionId = user.tenantId;
                }
                if (editData.gradeLevel && editData.gradeLevel !== '') {
                    submitData.gradeLevel = Number(editData.gradeLevel);
                }

                await coursesService.update(course.id, submitData);
            } else {
                // Batch create with comma separation
                const creationPromises: any[] = [];
                courses.forEach(c => {
                    const names = c.name.split(',').map(n => n.trim()).filter(n => n !== '');
                    names.forEach(name => {
                        const submitData: any = {
                            name: name,
                        };
                        // Only send institutionId if we're a school and have a valid ID
                        if (!isRegional && user?.tenantId && user.tenantType === 'school') {
                            submitData.institutionId = user.tenantId;
                        }
                        if (c.gradeLevel && c.gradeLevel !== '') {
                            submitData.gradeLevel = Number(c.gradeLevel);
                        }

                        creationPromises.push(coursesService.create(submitData));
                    });
                });
                await Promise.all(creationPromises);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.response?.data?.message || 'Failed to save course(s)');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    {isEdit ? 'Update Course' : 'Add Multiple Courses'}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {isEdit ? 'Modify course parameters and assignments.' : 'Quickly add one or more courses to the curriculum.'}
                    </Typography>
                </Box>
                {!isEdit && (
                    <Button
                        startIcon={<AddIcon />}
                        onClick={addCourseRow}
                        variant="soft"
                        size="small"
                        sx={{ borderRadius: 2 }}
                    >
                        Add Row
                    </Button>
                )}
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {isEdit ? (
                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Course Name"
                                    name="name"
                                    fullWidth
                                    required
                                    value={editData.name}
                                    onChange={handleEditChange}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    select
                                    label="Target Grade Level"
                                    name="gradeLevel"
                                    fullWidth
                                    value={editData.gradeLevel}
                                    onChange={handleEditChange}
                                    error={!!errors.gradeLevel}
                                    helperText={errors.gradeLevel}
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(level => (
                                        <MenuItem key={level} value={level}>Grade {level}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {courses.map((courseField, index) => (
                                <Grid container spacing={2} key={index} sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: alpha(theme.palette.background.default, 0.4),
                                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                    position: 'relative'
                                }}>
                                    {courses.length > 1 && (
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeCourseRow(index)}
                                            sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', boxShadow: 1 }}
                                        >
                                            <Typography variant="caption" sx={{ fontSize: 10 }}>×</Typography>
                                        </IconButton>
                                    )}
                                    <Grid size={{ xs: 12, md: 8 }}>
                                        <TextField
                                            label="Course Names (comma separated)"
                                            fullWidth
                                            size="small"
                                            required
                                            value={courseField.name}
                                            onChange={(e) => handleCourseChange(index, 'name', e.target.value)}
                                            error={!!errors[`${index}-name`]}
                                            helperText={errors[`${index}-name`] || "e.g. Maths, English, Science"}
                                            placeholder="Maths, English, Science"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            select
                                            label="Grade"
                                            fullWidth
                                            size="small"
                                            value={courseField.gradeLevel}
                                            onChange={(e) => handleCourseChange(index, 'gradeLevel', e.target.value)}
                                            error={!!errors[`${index}-gradeLevel`]}
                                            helperText={errors[`${index}-gradeLevel`]}
                                        >
                                            <MenuItem value=""><em>None</em></MenuItem>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(level => (
                                                <MenuItem key={level} value={level}>G{level}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                </Grid>
                            ))}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5), justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                        {isEdit ? 'Course details are editable after creation.' : `Total courses to add: ${courses.length}`}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{
                                borderRadius: 2.5,
                                px: 4,
                                fontWeight: 700,
                                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : (isEdit ? 'Update Course' : 'Create All Courses')}
                        </Button>
                    </Box>
                </DialogActions>
            </form>
        </Dialog>
    );
}
