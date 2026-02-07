'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid2 as Grid,
    TextField,
    MenuItem,
    Button,
    Chip,
    Avatar,
    IconButton,
    CircularProgress,
    alpha,
    useTheme,
    Alert,
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    AccessTime as LateIcon,
    Save as SaveIcon,
    History as HistoryIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import coursesService from '@/app/lib/api/courses.service';
import enrollmentsService from '@/app/lib/api/enrollments.service';
import attendanceService from '@/app/lib/api/attendance.service';
import { useAuthStore } from '@/app/lib/store';

export default function AttendancePage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);

    // State
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [attendanceData, setAttendanceData] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
    const [remarks, setRemarks] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Queries
    const { data: courses, isLoading: loadingCourses } = useQuery({
        queryKey: ['courses'],
        queryFn: () => coursesService.getAll(),
    });

    const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
        queryKey: ['enrollments', selectedCourseId],
        queryFn: () => enrollmentsService.getByCourse(selectedCourseId),
        enabled: !!selectedCourseId,
    });

    // Mutations
    const markAttendanceMutation = useMutation({
        mutationFn: async (vars: { enrollmentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE', remarks?: string }) => {
            return attendanceService.markStudent({
                enrollmentId: vars.enrollmentId,
                date: selectedDate,
                status: vars.status,
                remarks: vars.remarks
            });
        }
    });

    const handleStatusChange = (enrollmentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
        setAttendanceData(prev => ({
            ...prev,
            [enrollmentId]: status
        }));
    };

    const handleRemarksChange = (enrollmentId: string, value: string) => {
        setRemarks(prev => ({
            ...prev,
            [enrollmentId]: value
        }));
    };

    const handleSubmitAll = async () => {
        if (!enrollments) return;

        setSuccessMessage(null);
        const promises = enrollments.map(enrollment => {
            const status = attendanceData[enrollment.id] || 'PRESENT';
            return markAttendanceMutation.mutateAsync({
                enrollmentId: enrollment.id,
                status,
                remarks: remarks[enrollment.id]
            });
        });

        try {
            await Promise.all(promises);
            setSuccessMessage(`Attendance successfully recorded for ${enrollments.length} students.`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error('Failed to submit attendance:', error);
        }
    };

    const selectedCourse = useMemo(() =>
        courses?.find(c => c.id === selectedCourseId),
        [courses, selectedCourseId]);

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <CalendarIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                        Attendance Tracking
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Record and monitor student attendance for your assigned courses.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Configuration Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{
                        borderRadius: 4,
                        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        overflow: 'visible'
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                                Session Details
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Select Course"
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    disabled={loadingCourses}
                                >
                                    {loadingCourses ? (
                                        <MenuItem disabled><CircularProgress size={20} sx={{ mr: 1 }} /> Loading...</MenuItem>
                                    ) : (
                                        courses?.map(course => (
                                            <MenuItem key={course.id} value={course.id}>
                                                {course.name} ({course.code})
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>

                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <Box sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: alpha(theme.palette.secondary.main, 0.04),
                                    border: `1px dashed ${alpha(theme.palette.secondary.main, 0.2)}`
                                }}>
                                    <Typography variant="caption" color="secondary" fontWeight={800} sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                                        Course Info
                                    </Typography>
                                    {selectedCourse ? (
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {selectedCourse.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Code: {selectedCourse.code} | Credits: {selectedCourse.credits}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                            Select a course to see details.
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Attendance List Card */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {selectedCourseId ? (
                        <Card sx={{
                            borderRadius: 4,
                            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            minHeight: 400
                        }}>
                            <Box sx={{
                                p: 2.5,
                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Typography variant="h6" fontWeight={700}>
                                    Students Enrollment ({enrollments?.length || 0})
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="soft"
                                        startIcon={<HistoryIcon />}
                                        sx={{ borderRadius: 2, fontWeight: 700 }}
                                    >
                                        History
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSubmitAll}
                                        disabled={!enrollments?.length || markAttendanceMutation.isPending}
                                        sx={{ borderRadius: 2, fontWeight: 700 }}
                                    >
                                        {markAttendanceMutation.isPending ? 'Saving...' : 'Submit All'}
                                    </Button>
                                </Box>
                            </Box>

                            <CardContent sx={{ p: 0 }}>
                                {successMessage && (
                                    <Alert severity="success" sx={{ m: 2, borderRadius: 2 }}>
                                        {successMessage}
                                    </Alert>
                                )}

                                {loadingEnrollments ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : enrollments && enrollments.length > 0 ? (
                                    <Box>
                                        {enrollments.map((enrollment, index) => {
                                            const status = attendanceData[enrollment.id] || 'PRESENT';
                                            return (
                                                <Box key={enrollment.id} sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    borderBottom: index < enrollments.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.05)}` : 'none',
                                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{
                                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                            color: theme.palette.primary.main,
                                                            fontWeight: 700
                                                        }}>
                                                            {enrollment.student?.username.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle2" fontWeight={700}>
                                                                {enrollment.student?.username}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                ID: {enrollment.studentId.substring(0, 8)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <TextField
                                                            size="small"
                                                            placeholder="Add remarks..."
                                                            value={remarks[enrollment.id] || ''}
                                                            onChange={(e) => handleRemarksChange(enrollment.id, e.target.value)}
                                                            sx={{ width: 150, '& .MuiInputBase-root': { fontSize: '0.75rem' } }}
                                                        />
                                                        <Box sx={{ display: 'flex', bgcolor: alpha(theme.palette.divider, 0.05), borderRadius: 2, p: 0.5 }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleStatusChange(enrollment.id, 'PRESENT')}
                                                                sx={{
                                                                    color: status === 'PRESENT' ? theme.palette.success.main : theme.palette.text.disabled,
                                                                    bgcolor: status === 'PRESENT' ? alpha(theme.palette.success.main, 0.1) : 'transparent',
                                                                    borderRadius: 1.5,
                                                                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) }
                                                                }}
                                                            >
                                                                <PresentIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleStatusChange(enrollment.id, 'LATE')}
                                                                sx={{
                                                                    color: status === 'LATE' ? theme.palette.warning.main : theme.palette.text.disabled,
                                                                    bgcolor: status === 'LATE' ? alpha(theme.palette.warning.main, 0.1) : 'transparent',
                                                                    borderRadius: 1.5,
                                                                    '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.1) }
                                                                }}
                                                            >
                                                                <LateIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleStatusChange(enrollment.id, 'ABSENT')}
                                                                sx={{
                                                                    color: status === 'ABSENT' ? theme.palette.error.main : theme.palette.text.disabled,
                                                                    bgcolor: status === 'ABSENT' ? alpha(theme.palette.error.main, 0.1) : 'transparent',
                                                                    borderRadius: 1.5,
                                                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                                                }}
                                                            >
                                                                <AbsentIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                ) : (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography color="text.secondary">No students enrolled in this course.</Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Box sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 4,
                            borderRadius: 4,
                            border: `2px dashed ${alpha(theme.palette.divider, 0.1)}`,
                            bgcolor: alpha(theme.palette.divider, 0.02)
                        }}>
                            <CalendarIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2, opacity: 0.3 }} />
                            <Typography variant="h6" color="text.secondary" fontWeight={700}>
                                No Course Selected
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Please select a course from the side panel to start recording attendance.
                            </Typography>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
