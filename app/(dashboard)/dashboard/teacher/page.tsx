'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Divider, Button, CircularProgress } from '@mui/material';
import {
    School as CourseIcon,
    Groups as StudentIcon,
    EventNote as AttendanceIcon,
    LibraryBooks as AssetsIcon,
    AddCircleOutline as AddIcon
} from '@mui/icons-material';
import { KPIGrid } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { dashboardService, InstructorStats } from '@/app/lib/api/dashboard.service';
import { KPIData } from '@/app/lib/types';

export default function InstructorDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<InstructorStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardService.getStats() as InstructorStats;
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch instructor stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const kpis: KPIData[] = [
        {
            label: 'Total Students',
            value: stats?.totalStudents || 0,
            icon: 'Groups',
            trend: 'stable'
        },
        {
            label: 'Active Courses',
            value: stats?.courses?.length || 0,
            icon: 'School',
            trend: 'stable'
        },
        {
            label: 'Attendance Records',
            value: stats?.recentAttendance?.length || 0,
            icon: 'EventNote',
            trend: 'up'
        }
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Instructor Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Managing your courses and academic progress. Welcome back, {user?.firstName || 'Instructor'}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={3} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CourseIcon color="primary" /> Assigned Courses
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        {stats?.courses && stats.courses.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {stats.courses.map((course: any) => (
                                    <Box key={course.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography fontWeight={600}>{course.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">Credits: {course.credit}</Typography>
                                            <Typography variant="body2" color="primary.main">{course._count.enrollments} Students Enrolled</Typography>
                                        </Box>
                                        <Button variant="outlined" size="small" startIcon={<AttendanceIcon />}>
                                            Attendance
                                        </Button>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                No courses assigned to you yet.
                            </Typography>
                        )}
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>Quick Actions</Typography>
                            <Divider sx={{ my: 1, mb: 2 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Button fullWidth variant="contained" startIcon={<AttendanceIcon />}>Record Attendance</Button>
                                <Button fullWidth variant="outlined" startIcon={<CourseIcon />}>Course Resources</Button>
                                <Button fullWidth variant="outlined" startIcon={<AssetsIcon />}>Request Lab Assets</Button>
                            </Box>
                        </Paper>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>Recent Attendance</Typography>
                            <Divider sx={{ my: 1, mb: 2 }} />
                            {stats?.recentAttendance && stats.recentAttendance.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {stats.recentAttendance.map((att: any) => (
                                        <Box key={att.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption">{new Date(att.date).toLocaleDateString()}</Typography>
                                            <Typography variant="caption" fontWeight={600}>{att.status}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="caption" color="text.secondary">No recent records.</Typography>
                            )}
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
