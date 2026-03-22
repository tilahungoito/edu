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
import {
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
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
            if (!course) return;
            
            // We need a school scope to fetch instructors
            const schoolId = course.institutionId || (user?.tenantType === 'school' ? user?.scopeId : null);
            
            if (!open || !schoolId) {
                setInstructors([]);
                return;
            }
            setFetchingData(true);
            try {
                // Fetch instructors for the determined institutional scope
                const data = await staffService.getStaffByRole('INSTRUCTOR', schoolId);
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
            <DialogTitle sx={{ 
                pb: 1, 
                fontWeight: 800, 
                display: 'flex', 
                flexDirection: 'column',
                gap: 0.5,
                fontSize: '1.5rem',
                color: 'primary.main'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex'
                    }}>
                        <PersonAddIcon />
                    </Box>
                    Teacher Assignment
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                    Manage the instructor assigned to <strong>{course.name}</strong>
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
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            This is a <strong>Regional Curriculum</strong> course. Assigning an instructor will automatically create a local copy for your school.
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
                            disabled={instructors.length === 0}
                            helperText={instructors.length === 0 ? 'No instructors found in your school' : ''}
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
                            disabled={loading || (!selectedInstructor && !course.instructor)}
                            sx={{
                                borderRadius: 3,
                                px: 4,
                                py: 1.2,
                                fontWeight: 700,
                                textTransform: 'none',
                                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
                                '&:hover': {
                                    boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                                }
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Assignment'}
                        </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
