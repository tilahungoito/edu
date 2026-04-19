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
    FormControlLabel,
    Switch,
    Divider,
    Autocomplete,
} from '@mui/material';
import { classroomService, BehaviorRecord, CreateBehaviorData } from '@/app/lib/api/classroom.service';
import { studentsService, Student } from '@/app/lib/api/students.service';
import { useAuthStore } from '@/app/lib/store';
import { toast } from 'react-hot-toast';

interface BehaviorDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    record?: BehaviorRecord | null;
    /** Lock the form to a specific student (e.g. when opened from a student profile) */
    studentId?: string;
    institutionId?: string;
    /**
     * When set, the student picker is enabled but only shows students in the
     * instructor's courses (fetched via the instructor-scoped endpoint).
     * Pass the instructor's userId.
     */
    restrictToInstructor?: string;
}

const BEHAVIOR_TYPES = [
    { value: 'POSITIVE',     label: 'Positive / Recognition',  color: '#10b981' },
    { value: 'WARNING',      label: 'Verbal Warning',           color: '#f59e0b' },
    { value: 'DISCIPLINARY', label: 'Disciplinary Action',     color: '#ef4444' },
    { value: 'CRITICAL',     label: 'Critical Incident',        color: '#7f1d1d' },
    { value: 'COUNSELING',   label: 'Counseling Note',          color: '#8b5cf6' },
    { value: 'OBSERVATION',  label: 'General Observation',      color: '#3b82f6' },
];

export function BehaviorDialog({
    open,
    onClose,
    onSuccess,
    record,
    studentId,
    institutionId,
    restrictToInstructor,
}: BehaviorDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const isViewMode = !!(record?.id) && false; // always editable when opened via onView

    const [loading, setLoading]               = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [students, setStudents]             = useState<Student[]>([]);
    const [error, setError]                   = useState<string | null>(null);

    const effectiveInstitutionId = institutionId || user?.tenantId || '';

    // ─── Form State ────────────────────────────────────────────────────────────
    const [formData, setFormData] = useState<CreateBehaviorData>({
        studentId:     studentId || '',
        institutionId: effectiveInstitutionId,
        title:         '',
        description:   '',
        type:          'WARNING',
        date:          new Date().toISOString().split('T')[0],
        isPrivate:     false,
    });

    // ─── Load student list ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        // No need to load students if studentId is already fixed
        if (studentId) return;

        setFetchingStudents(true);

        if (restrictToInstructor) {
            // Instructor-scoped: fetch students via their courses
            classroomService.getInstructorCourses()
                .then(async (courses: any[]) => {
                    const studentMap = new Map<string, Student>();
                    
                    if (courses && courses.length > 0) {
                        await Promise.all(
                            courses.map(async (course: any) => {
                                try {
                                    const result = await classroomService.getStudentsInCourse(course.id);
                                    const courseStudents = (result as any).students || [];
                                    courseStudents.forEach((s: any) => {
                                        const student = s.student ?? s;
                                        if (student?.id) studentMap.set(student.id, student);
                                    });
                                } catch (err) {
                                    console.error(`Failed to fetch students for course ${course.id}:`, err);
                                }
                            })
                        );
                    }

                    const list = Array.from(studentMap.values());
                    
                    // FALLBACK: If instructor has no students in courses, try fetching institution-wide
                    if (list.length === 0) {
                        const allStudents = await studentsService.getAll({ institutionId: effectiveInstitutionId });
                        setStudents(allStudents);
                    } else {
                        setStudents(list);
                    }
                })
                .catch(async (err) => {
                    console.error('Failed to fetch instructor courses, falling back to all students:', err);
                    // Fallback to all students on error too
                    const allStudents = await studentsService.getAll({ institutionId: effectiveInstitutionId });
                    setStudents(allStudents);
                })
                .finally(() => setFetchingStudents(false));
        } else {
            // Admin / Registrar: all institution students
            studentsService.getAll({ institutionId: effectiveInstitutionId })
                .then(setStudents)
                .catch(() => setStudents([]))
                .finally(() => setFetchingStudents(false));
        }
    }, [open, studentId, restrictToInstructor, effectiveInstitutionId]);

    // ─── Populate form on edit ─────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        if (record) {
            setFormData({
                studentId:     record.studentId,
                institutionId: record.institutionId,
                title:         record.title,
                description:   record.description,
                type:          record.type as any,
                date:          new Date(record.date).toISOString().split('T')[0],
                isPrivate:     record.isPrivate,
            });
        } else {
            setFormData({
                studentId:     studentId || '',
                institutionId: effectiveInstitutionId,
                title:         '',
                description:   '',
                type:          'WARNING',
                date:          new Date().toISOString().split('T')[0],
                isPrivate:     false,
            });
        }
        setError(null);
    }, [open, record, studentId, effectiveInstitutionId]);

    // ─── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.studentId)   { setError('Please select a target student'); return; }
        if (!formData.title)       { setError('Title / summary is required');    return; }
        if (!formData.description) { setError('Detailed observation is required'); return; }

        setLoading(true);
        setError(null);
        try {
            if (record?.id) {
                await classroomService.updateBehavior(record.id, formData);
                toast.success('Behavior record updated');
            } else {
                await classroomService.createBehavior(formData);
                toast.success('Behavior record saved');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.response?.data?.message || 'Failed to save record. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectedTypeConfig = BEHAVIOR_TYPES.find(t => t.value === formData.type);

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
                {record?.id ? 'Update Behavior Record' : 'Log Behavioral Observation'}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {record?.id
                        ? 'Edit the details of this behavioral observation.'
                        : 'Chronicle significant student actions, discipline, or positive achievements.'}
                </Typography>
            </DialogTitle>
            <Divider />

            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ pt: 3 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
                    )}

                    <Grid container spacing={3}>
                        {/* Student selector — hidden when studentId is fixed */}
                        {!studentId && (
                            <Grid size={{ xs: 12 }}>
                                <Autocomplete
                                    options={students}
                                    getOptionLabel={(option) => 
                                        `${option.user?.firstName} ${option.user?.lastName} ${option.user?.username ? `(@${option.user.username})` : ''}`
                                    }
                                    loading={fetchingStudents}
                                    value={students.find(s => s.id === formData.studentId) || null}
                                    onChange={(_, newValue) => {
                                        setFormData({ ...formData, studentId: newValue?.id || '' });
                                    }}
                                    disabled={fetchingStudents || !!record?.id}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Target Student *"
                                            required={!formData.studentId}
                                            placeholder="Search by name or username..."
                                            helperText={
                                                restrictToInstructor
                                                    ? 'Showing only students enrolled in your courses'
                                                    : 'All students in this institution'
                                            }
                                            slotProps={{
                                                input: {
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <React.Fragment>
                                                            {fetchingStudents ? <CircularProgress color="inherit" size={20} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </React.Fragment>
                                                    ),
                                                }
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <Box component="li" {...props} key={option.id} sx={{ py: 1, px: 2 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="body2" fontWeight={700}>
                                                    {option.user?.firstName} {option.user?.lastName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.user?.username ? `@${option.user.username}` : `ID: ${option.id.slice(0, 8)}`}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                />
                            </Grid>
                        )}

                        {/* Type & Date */}
                        <Grid size={{ xs: 12, sm: 7 }}>
                            <TextField
                                select
                                label="Observation Type *"
                                fullWidth
                                required
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                {BEHAVIOR_TYPES.map(t => (
                                    <MenuItem key={t.value} value={t.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{
                                                width: 10, height: 10, borderRadius: '50%', bgcolor: t.color,
                                                flexShrink: 0,
                                            }} />
                                            {t.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                                label="Date *"
                                type="date"
                                fullWidth
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Title */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Short Title / Summary *"
                                fullWidth
                                required
                                placeholder="e.g. Exceptional leadership in group project"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                inputProps={{ maxLength: 120 }}
                                helperText={`${formData.title.length}/120`}
                            />
                        </Grid>

                        {/* Description */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Detailed Observation *"
                                fullWidth
                                multiline
                                rows={4}
                                required
                                placeholder="Describe the incident or achievement in detail…"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Grid>

                        {/* Privacy toggle */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{
                                p: 2, borderRadius: 2,
                                bgcolor: formData.isPrivate
                                    ? alpha(theme.palette.warning.main, 0.05)
                                    : alpha(theme.palette.info.main, 0.04),
                                border: `1px solid ${formData.isPrivate
                                    ? alpha(theme.palette.warning.main, 0.15)
                                    : alpha(theme.palette.divider, 0.12)}`,
                            }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isPrivate}
                                            onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })}
                                            color="warning"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>
                                                {formData.isPrivate ? '🔒 Confidential Note' : '🌐 General Observation'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {formData.isPrivate
                                                    ? 'Visible only to Counselors, Registrars and higher Administrators.'
                                                    : 'Visible to all academic staff with access to this module.'}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                            borderRadius: 2.5,
                            px: 4,
                            fontWeight: 700,
                            bgcolor: selectedTypeConfig?.color,
                            '&:hover': { bgcolor: selectedTypeConfig?.color, filter: 'brightness(0.88)' },
                            boxShadow: selectedTypeConfig
                                ? `0 4px 14px ${alpha(selectedTypeConfig.color, 0.35)}`
                                : undefined,
                        }}
                    >
                        {loading
                            ? <CircularProgress size={22} color="inherit" />
                            : record?.id ? 'Update Record' : 'Save Record'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
