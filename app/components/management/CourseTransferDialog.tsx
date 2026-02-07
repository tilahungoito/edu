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
    Avatar,
    useTheme,
} from '@mui/material';
import {
    SwapHoriz as TransferIcon,
    ArrowForward as ArrowIcon
} from '@mui/icons-material';
import coursesService, { Course } from '@/app/lib/api/courses.service';
import { staffService } from '@/app/lib/api/staff.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { User } from '@/app/lib/api/api-client';

interface CourseTransferDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    course: Course | null;
}

export function CourseTransferDialog({ open, onClose, onSuccess, course }: CourseTransferDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(false);
    const [fetchingInstructors, setFetchingInstructors] = useState(false);
    const [instructors, setInstructors] = useState<User[]>([]);
    const [selectedInstructorId, setSelectedInstructorId] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInstructors = async () => {
            if (!open || !course) return;
            setFetchingInstructors(true);
            try {
                // Fetch instructors in the same institution as the course
                const data = await staffService.getStaffByRole('INSTRUCTOR', course.institutionId);
                // Filter out current instructor
                setInstructors(data.filter(i => i.id !== course.instructorId));
            } catch (err: any) {
                console.error('Failed to fetch instructors:', err);
            } finally {
                setFetchingInstructors(false);
            }
        };

        fetchInstructors();
    }, [open, course]);

    useEffect(() => {
        if (open) {
            setSelectedInstructorId('');
            setError(null);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!course || !selectedInstructorId) return;

        setLoading(true);
        setError(null);

        try {
            await coursesService.transfer(course.id, selectedInstructorId);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Transfer error:', err);
            setError(err.response?.data?.message || 'Failed to transfer course');
        } finally {
            setLoading(false);
        }
    };

    if (!course) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1, textAlign: 'center' }}>
                <Box sx={{
                    width: 56, height: 56, borderRadius: '50%',
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 2
                }}>
                    <TransferIcon fontSize="large" />
                </Box>
                Transfer Instructor
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Reassign {course.code} - {course.name} to a new instructor
                </Typography>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.background.default, 0.8),
                        border: `1px solid ${theme.palette.divider}`,
                        mb: 3
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ textAlign: 'center', flex: 1 }}>
                                <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: theme.palette.primary.main }}>
                                    {course.instructor?.username?.charAt(0)}
                                </Avatar>
                                <Typography variant="caption" fontWeight={700} noWrap>
                                    {course.instructor?.username || 'Current'}
                                </Typography>
                            </Box>
                            <ArrowIcon sx={{ color: theme.palette.text.disabled }} />
                            <Box sx={{ textAlign: 'center', flex: 1 }}>
                                <Avatar sx={{
                                    mx: 'auto', mb: 1,
                                    bgcolor: selectedInstructorId ? theme.palette.secondary.main : theme.palette.action.disabledBackground
                                }}>
                                    {instructors.find(i => i.id === selectedInstructorId)?.username?.charAt(0) || '?'}
                                </Avatar>
                                <Typography variant="caption" fontWeight={700} color={selectedInstructorId ? 'secondary' : 'text.disabled'}>
                                    {instructors.find(i => i.id === selectedInstructorId)?.username || 'Select New'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <TextField
                        select
                        fullWidth
                        label="New Instructor"
                        value={selectedInstructorId}
                        onChange={(e) => setSelectedInstructorId(e.target.value)}
                        required
                        disabled={fetchingInstructors}
                        helperText={instructors.length === 0 ? "No other instructors available in this institution" : "Select an instructor to take over this course"}
                    >
                        {instructors.map(instructor => (
                            <MenuItem key={instructor.id} value={instructor.id}>
                                {instructor.username} ({instructor.email})
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={onClose} color="inherit">Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        disabled={loading || !selectedInstructorId}
                        sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Transfer'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
