'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Divider, CircularProgress } from '@mui/material';
import {
    School as CourseIcon,
    EventAvailable as AttendanceIcon,
    Grade as GradeIcon,
    Person as ProfileIcon
} from '@mui/icons-material';
import { KPIGrid } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { dashboardService, StudentStats } from '@/app/lib/api/dashboard.service';
import { KPIData } from '@/app/lib/types';

export default function StudentDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardService.getStats() as StudentStats;
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch student stats:', error);
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
            label: 'Attendance Rate',
            value: `${stats?.attendanceRate || 0}%`,
            icon: 'EventAvailable',
            trend: (stats?.attendanceRate || 0) > 85 ? 'up' : 'down',
            change: 2
        },
        {
            label: 'Enrolled Courses',
            value: stats?.enrollments?.length || 0,
            icon: 'School',
            trend: 'stable'
        },
        {
            label: 'GPA',
            value: '3.8',
            icon: 'Grade',
            trend: 'up'
        }
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Welcome Back, {user?.firstName || 'Student'}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Stay on top of your studies. Here is your academic overview.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={3} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CourseIcon color="primary" /> Courses
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        {stats?.enrollments && stats.enrollments.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {stats.enrollments.map((enr: any) => (
                                    <Box key={enr.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                        <Typography fontWeight={600}>{enr.course.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">Semester: {enr.semester}</Typography>
                                        {enr.grades && enr.grades.length > 0 && (
                                            <Typography variant="body2" color="success.main" fontWeight={600}>
                                                Latest Grade: {enr.grades[enr.grades.length - 1].letter}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                No active enrollments found.
                            </Typography>
                        )}
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ProfileIcon color="primary" /> Student Info
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Username:</Typography>
                                <Typography variant="body2" fontWeight={600}>{user?.firstName}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Email:</Typography>
                                <Typography variant="body2" fontWeight={600}>{user?.email}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Role:</Typography>
                                <Typography variant="body2" fontWeight={600}>{user?.roles[0]?.name || 'STUDENT'}</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
