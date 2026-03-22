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
    CircularProgress,
    Box,
    Typography,
    Alert,
    alpha,
    useTheme,
} from '@mui/material';
import coursesService, { Course } from '@/app/lib/api/courses.service';
import { staffService } from '@/app/lib/api/staff.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { User } from '@/app/lib/api/api-client';

interface AssignInstructorDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    course: Course | null;
}

export function AssignInstructorDialog({ open, onClose, onSuccess, course }: AssignInstructorDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [instructors, setInstructors] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedInstructor, setSelectedInstructor] = useState<string>('');

    useEffect(() => {
        const fetchInstructors = async () => {
            if (!open || !course || !course.institutionId) {
                setInstructors([]);
                return;
            }
            setFetchingData(true);
            try {
                // Fetch instructors for the course's institution
                const data = await staffService.getStaffByRole('INSTRUCTOR', course.institutionId);
                setInstructors(data);
                
                // Pre-select current instructor if assigned
                if (course.instructor) {
                    setSelectedInstructor(course.instructor.id);
                } else {
                    setSelectedInstructor('');
                }
            } catch (err: any) {
                console.error('Failed to fetch instructors:', err);
                setError('Failed to load instructors');
            } finally {
                setFetchingData(false);
            }
        };

        fetchInstructors();
    }, [open, course]);

    useEffect(() => {
        if (!open) {
            setError(null);
            setSelectedInstructor('');
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!course) return;

        setLoading(true);
        setError(null);

        try {
            await coursesService.assignInstructor(course.id, selectedInstructor);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Assignment error:', err);
            setError(err.response?.data?.message || 'Failed to assign instructor');
        } finally {
            setLoading(false);
        }
    };

    if (!course) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                Assign Instructor
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Assign a teacher to {course.name}
                </Typography>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {!course.institutionId && (
                        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                            Instructors cannot be explicitly assigned to Regional Curriculum courses. They must be duplicated or localized first.
                        </Alert>
                    )}

                    {fetchingData ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TextField
                            select
                            label="Select Instructor"
                            fullWidth
                            required
                            value={selectedInstructor}
                            onChange={(e) => setSelectedInstructor(e.target.value)}
                            disabled={!course.institutionId || instructors.length === 0}
                            helperText={instructors.length === 0 && course.institutionId ? 'No instructors found in this institution' : ''}
                        >
                            <MenuItem value="">
                                <em>Unassign</em>
                            </MenuItem>
                            {instructors.map((inst: any) => (
                                <MenuItem key={inst.id} value={inst.id}>
                                    {inst.firstName && inst.lastName 
                                        ? `${inst.firstName} ${inst.lastName} (${inst.username})` 
                                        : inst.username}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                    <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !course.institutionId || (!selectedInstructor && !course.instructor)}
                        sx={{
                            borderRadius: 2.5,
                            px: 4,
                            fontWeight: 700,
                            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Assign'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
