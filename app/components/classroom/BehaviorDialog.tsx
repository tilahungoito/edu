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
    studentId?: string;
    institutionId?: string;
}

const BEHAVIOR_TYPES = [
    { value: 'POSITIVE', label: 'Positive / Recognition', color: '#10b981' },
    { value: 'WARNING', label: 'Verbal Warning', color: '#f59e0b' },
    { value: 'DISCIPLINARY', label: 'Disciplinary Action', color: '#ef4444' },
    { value: 'CRITICAL', label: 'Critical Incident', color: '#7f1d1d' },
];

export function BehaviorDialog({ open, onClose, onSuccess, record, studentId, institutionId }: BehaviorDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateBehaviorData>({
        studentId: studentId || '',
        institutionId: institutionId || user?.tenantId || '',
        title: '',
        description: '',
        type: 'WARNING',
        date: new Date().toISOString().split('T')[0],
        isPrivate: false,
    });

    useEffect(() => {
        if (open && !studentId && user?.tenantId) {
            setFetchingStudents(true);
            studentsService.getAll({ institutionId: user.tenantId })
                .then(setStudents)
                .finally(() => setFetchingStudents(false));
        }
    }, [open, studentId, user?.tenantId]);

    useEffect(() => {
        if (open) {
            if (record) {
                setFormData({
                    studentId: record.studentId,
                    institutionId: record.institutionId,
                    title: record.title,
                    description: record.description,
                    type: record.type,
                    date: new Date(record.date).toISOString().split('T')[0],
                    isPrivate: record.isPrivate,
                });
            } else {
                setFormData({
                    studentId: studentId || '',
                    institutionId: institutionId || user?.tenantId || '',
                    title: '',
                    description: '',
                    type: 'WARNING',
                    date: new Date().toISOString().split('T')[0],
                    isPrivate: false,
                });
            }
            setError(null);
        }
    }, [open, record, studentId, institutionId, user?.tenantId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.studentId || !formData.title || !formData.description) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (record?.id) {
                await classroomService.updateBehavior(record.id, formData);
                toast.success('Behavior record updated');
            } else {
                await classroomService.createBehavior(formData);
                toast.success('Behavior record created');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.response?.data?.message || 'Failed to save record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                {record ? 'Update Behavior Record' : 'Log Behavioral Observation'}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Chronicle significant student actions, discipline, or positive achievements.
                </Typography>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
                    )}

                    <Grid container spacing={3}>
                        {!studentId && (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    select
                                    label="Target Student"
                                    fullWidth
                                    required
                                    value={formData.studentId}
                                    onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                                    disabled={fetchingStudents}
                                >
                                    {fetchingStudents ? (
                                        <MenuItem disabled><CircularProgress size={20} sx={{ mr: 1 }} /> Loading...</MenuItem>
                                    ) : (
                                        students.map(s => (
                                            <MenuItem key={s.id} value={s.id}>
                                                {s.user?.firstName} {s.user?.lastName} ({s.user?.username})
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>
                            </Grid>
                        )}

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select
                                label="Observation Type"
                                fullWidth
                                required
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                {BEHAVIOR_TYPES.map(t => (
                                    <MenuItem key={t.value} value={t.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color }} />
                                            {t.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Date"
                                type="date"
                                fullWidth
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Short Title / Summary"
                                fullWidth
                                required
                                placeholder="e.g. Exceptional leadership in group project"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Detailed Observation"
                                fullWidth
                                multiline
                                rows={4}
                                required
                                placeholder="Describe the incident or achievement in detail..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ 
                                p: 2, 
                                borderRadius: 2, 
                                bgcolor: formData.isPrivate ? alpha(theme.palette.warning.main, 0.05) : alpha(theme.palette.info.main, 0.05),
                                border: `1px solid ${formData.isPrivate ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.info.main, 0.1)}`
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
                                                {formData.isPrivate ? 'Confidential Note' : 'General Observation'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {formData.isPrivate 
                                                    ? 'Visible only to Counselors and Higher Administrators.' 
                                                    : 'Visible to all academic staff (and Student/Parents if enabled).'}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                    <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color={formData.type === 'CRITICAL' ? 'error' : 'secondary'}
                        disabled={loading}
                        sx={{
                            borderRadius: 2.5,
                            px: 4,
                            fontWeight: 700,
                            boxShadow: `0 4px 14px ${alpha(formData.type === 'CRITICAL' ? theme.palette.error.main : theme.palette.secondary.main, 0.3)}`
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (record ? 'Update Record' : 'Save Record')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
