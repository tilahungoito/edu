'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    MenuItem,
    Button,
    Chip,
    Avatar,
    CircularProgress,
    alpha,
    useTheme,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import {
    Assessment as GradesIcon,
    Save as SaveIcon,
    Print as PrintIcon,
    Download as DownloadIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import coursesService from '@/app/lib/api/courses.service';
import enrollmentsService from '@/app/lib/api/enrollments.service';
import gradesService, { Grade, Transcript } from '@/app/lib/api/grades.service';
import { useAuthStore } from '@/app/lib/store';

export default function GradesPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const isStudent = user?.roles?.some(r => r.name === 'STUDENT');

    if (isStudent) {
        return <StudentTranscriptView />;
    }

    return <InstructorGradingView />;
}

function InstructorGradingView() {
    const theme = useTheme();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [scores, setScores] = useState<Record<string, number>>({});
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

    const { data: existingGrades, isLoading: loadingGrades } = useQuery({
        queryKey: ['grades', selectedCourseId],
        queryFn: () => gradesService.getByCourse(selectedCourseId),
        enabled: !!selectedCourseId,
    });

    // Mutations
    const saveGradeMutation = useMutation({
        mutationFn: (data: { enrollmentId: string, score: number, grade: string, remark?: string }) =>
            gradesService.create(data),
    });

    const calculateGrade = (score: number) => {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'B-';
        if (score >= 60) return 'C+';
        if (score >= 50) return 'C';
        if (score >= 40) return 'D';
        return 'F';
    };

    const handleScoreChange = (enrollmentId: string, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
            setScores(prev => ({ ...prev, [enrollmentId]: numValue }));
        } else if (value === '') {
            setScores(prev => {
                const newState = { ...prev };
                delete newState[enrollmentId];
                return newState;
            });
        }
    };

    const handleSaveAll = async () => {
        if (!enrollments) return;

        const promises = enrollments.map(enrollment => {
            const score = scores[enrollment.id];
            if (score === undefined) return Promise.resolve();

            return saveGradeMutation.mutateAsync({
                enrollmentId: enrollment.id,
                score,
                grade: calculateGrade(score),
                remark: remarks[enrollment.id]
            });
        });

        try {
            await Promise.all(promises);
            setSuccessMessage('Grades successfully submitted.');
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
            console.error('Failed to save grades:', error);
        }
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <GradesIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            Grade Management
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Enter and manage student grades for your courses.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        select
                        size="small"
                        label="Course"
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        sx={{ minWidth: 250 }}
                    >
                        {courses?.map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.name} ({c.code})</MenuItem>
                        ))}
                    </TextField>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={!selectedCourseId || loadingEnrollments || saveGradeMutation.isPending}
                        onClick={handleSaveAll}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        Save All
                    </Button>
                </Box>
            </Box>

            {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

            {!selectedCourseId ? (
                <Box sx={{
                    height: 400, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    border: `2px dashed ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 4, bgcolor: alpha(theme.palette.divider, 0.02)
                }}>
                    <GradesIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2, opacity: 0.3 }} />
                    <Typography color="text.secondary" fontWeight={700}>Select a course to manage grades</Typography>
                </Box>
            ) : loadingEnrollments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Student ID</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800 }}>Score (0-100)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800 }}>Grade</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Remarks</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {enrollments?.map((enrollment) => {
                                const currentScore = scores[enrollment.id];
                                const existingGrade = existingGrades?.find(g => g.enrollmentId === enrollment.id);

                                return (
                                    <TableRow key={enrollment.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                                                    {enrollment.student?.username.charAt(0)}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {enrollment.student?.username}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                {enrollment.studentId.substring(0, 13).toUpperCase()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={currentScore !== undefined ? currentScore : (existingGrade?.score || '')}
                                                onChange={(e) => handleScoreChange(enrollment.id, e.target.value)}
                                                sx={{ width: 80, '& .MuiInputBase-input': { textAlign: 'center', fontWeight: 700 } }}
                                                InputProps={{ inputProps: { min: 0, max: 100 } }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" fontWeight={800} color="primary">
                                                {currentScore !== undefined ? calculateGrade(currentScore) : (existingGrade?.grade || '-')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder="Add remark..."
                                                value={remarks[enrollment.id] || (existingGrade?.remark || '')}
                                                onChange={(e) => setRemarks(prev => ({ ...prev, [enrollment.id]: e.target.value }))}
                                                sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {existingGrade ? (
                                                <Chip label="Submitted" size="small" color="success" variant="soft" />
                                            ) : (
                                                <Chip label="Pending" size="small" color="warning" variant="soft" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}

function StudentTranscriptView() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);

    const { data: transcript, isLoading } = useQuery({
        queryKey: ['transcript', user?.id],
        queryFn: () => gradesService.getTranscript(user?.id || ''),
        enabled: !!user?.id,
    });

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            My Transcript
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Overall academic performance and full course history.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button variant="soft" startIcon={<PrintIcon />}>Print</Button>
                    <Button variant="contained" startIcon={<DownloadIcon />}>Download PDF</Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <CardContent>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: theme.palette.primary.main, fontSize: '2rem' }}>
                                    {user?.firstName?.charAt(0)}
                                </Avatar>
                                <Typography variant="h6" fontWeight={800}>{user?.firstName} {user?.lastName}</Typography>
                                <Typography variant="body2" color="text.secondary">Student ID: {user?.id.substring(0, 13).toUpperCase()}</Typography>
                            </Box>

                            <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04), p: 2, borderRadius: 3, textAlign: 'center' }}>
                                <Typography variant="overline" color="text.secondary" fontWeight={800}>Cumulative GPA</Typography>
                                <Typography variant="h3" color="primary" fontWeight={900}>{transcript?.gpa?.toFixed(2) || '0.00'}</Typography>
                            </Box>

                            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Institution:</Typography>
                                    <Typography variant="body2" fontWeight={700}>{user?.tenantName}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Courses Completed:</Typography>
                                    <Typography variant="body2" fontWeight={700}>{transcript?.results.length || 0}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Course</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800 }}>Credits</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800 }}>Grade</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {transcript?.results.map((result, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight={700}>{result.courseName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{result.courseCode}</Typography>
                                            </TableCell>
                                            <TableCell align="center">{result.credits}</TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2" fontWeight={800} color="secondary">
                                                    {result.grade}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label="Passed" size="small" variant="soft" color="success" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!transcript?.results || transcript.results.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary">No results available yet.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
