'use client';

import React from 'react';
import { Box, Typography, Grid2 as Grid, Button } from '@mui/material';
import {
    Groups as StudentIcon,
    Badge as TeacherIcon,
    Add as AddIcon,
    EventNote as AttendanceIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { KPIData } from '@/app/lib/types';
import { UserDialog } from '@/app/components/management/UserDialog';

export default function SchoolAdminDashboard() {
    const { user } = useAuthStore();
    const [openUserDialog, setOpenUserDialog] = React.useState(false);

    const kpis: KPIData[] = [
        {
            label: 'Total Students',
            value: 850,
            icon: 'People',
            trend: 'up',
            change: 12
        },
        {
            label: 'Total Teachers',
            value: 42,
            icon: 'Badge',
            trend: 'stable'
        },
        {
            label: 'Daily Attendance',
            value: '96.5%',
            icon: 'EventAvailable',
            trend: 'up'
        },
        {
            label: 'School Rank',
            value: '#4',
            icon: 'EmojiEvents',
            trend: 'up'
        }
    ];

    const gradeDistribution = [
        { name: 'Grade 9', students: 210, male: 110, female: 100 },
        { name: 'Grade 10', students: 205, male: 105, female: 100 },
        { name: 'Grade 11', students: 220, male: 115, female: 105 },
        { name: 'Grade 12', students: 215, male: 110, female: 105 },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    School Dashboard
                    {user?.tenantName && <Typography component="span" variant="h4" color="primary">: {user.tenantName}</Typography>}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Managing daily operations and academic standards for your school. Welcome back, {user?.firstName}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Enrollment by Grade & Gender"
                        subtitle="Student distribution for current academic year"
                        data={gradeDistribution}
                        type="bar"
                        dataKeys={['male', 'female']}
                        height={350}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600}>School Actions</Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenUserDialog(true)}
                            sx={{ py: 1.5 }}
                        >
                            Create Staff/Student
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<AttendanceIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Record Daily Attendance
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<TeacherIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Staff Management
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            <UserDialog
                open={openUserDialog}
                onClose={() => setOpenUserDialog(false)}
                onSuccess={() => console.log('User created')}
            />
        </Box>
    );
}
