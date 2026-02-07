'use client';

import React from 'react';
import { Box, Typography, Grid, Button, Card, CardContent } from '@mui/material';
import {
    School as CourseIcon,
    Assessment as GradesIcon,
    EventAvailable as AttendanceIcon,
    Assignment as TaskIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { KPIData } from '@/app/lib/types';

export default function AcademicDashboard() {
    const { user } = useAuthStore();
    const isInstructor = user?.roles.some(r => r.name === 'INSTRUCTOR');

    const kpis: KPIData[] = [
        {
            label: isInstructor ? 'My Courses' : 'Enrolled Courses',
            value: 5,
            icon: 'School',
            trend: 'stable'
        },
        {
            label: isInstructor ? 'Total Students' : 'GPA',
            value: isInstructor ? 185 : '3.8',
            icon: isInstructor ? 'People' : 'Star',
            trend: 'up',
            change: isInstructor ? 5 : 0.2
        },
        {
            label: 'Attendance',
            value: '92%',
            icon: 'EventAvailable',
            trend: 'stable'
        },
        {
            label: 'Assignments',
            value: 3,
            icon: 'Assignment',
            trend: 'up'
        }
    ];

    const performanceData = [
        { name: 'Quiz 1', score: 85, average: 78 },
        { name: 'Midterm', score: 92, average: 82 },
        { name: 'Quiz 2', score: 88, average: 80 },
        { name: 'Project', score: 95, average: 85 },
        { name: 'Final', score: 90, average: 84 },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Academic Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {isInstructor ? 'Managing your courses and students.' : 'Tracking your academic progress.'} Welcome back, {user?.firstName}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title={isInstructor ? 'Class Average Performance' : 'My Performance Trend'}
                        subtitle="Scores over current semester"
                        data={performanceData}
                        type="area"
                        dataKeys={['score', 'average']}
                        height={350}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600}>Quick Access</Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<CourseIcon />}
                            sx={{ py: 1.5 }}
                        >
                            View All Courses
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<TaskIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Upcoming Assignments
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<GradesIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Full Report Card
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<AttendanceIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Attendance Logs
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
